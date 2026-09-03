import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const PORT = Number(process.env.PORT || 8787);
const DEFAULT_ROVER_ID = process.env.DEFAULT_ROVER_ID || 'rover-01';
const INGEST_TOKEN = process.env.ROVER_INGEST_TOKEN;

if (!process.env.FIREBASE_DATABASE_URL) {
  console.warn('FIREBASE_DATABASE_URL is not set. Firebase writes will fail until it is configured.');
}
if (!INGEST_TOKEN) {
  console.warn('ROVER_INGEST_TOKEN is not set. Telemetry ingestion is disabled until it is configured.');
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = getDatabase();
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map((value) => value.trim()) || true }));
app.use(express.json({ limit: '256kb' }));

const sseClients = new Map();

const gasDefinitions = {
  CO: { unit: 'ppm', warningRatio: 0.7, dangerRatio: 1.0 },
  CH4: { unit: '%LEL', warningRatio: 0.7, dangerRatio: 1.0 },
  'H2S': { unit: 'ppm', warningRatio: 0.7, dangerRatio: 1.0 },
  O2: { unit: '%', warningRatio: 1.0, dangerRatio: 1.0, lowIsDanger: true },
};

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeGasName(name) {
  return String(name || '').replace('₄', '4').replace('₂', '2');
}

function calculateRisk(gases = []) {
  let score = 0;
  let danger = false;
  let warning = false;
  const reasons = [];

  for (const gas of gases) {
    const name = normalizeGasName(gas.name);
    const value = finiteNumber(gas.value);
    const threshold = finiteNumber(gas.threshold);
    if (value === null || threshold === null || threshold <= 0) continue;

    const definition = gasDefinitions[name] || {};
    const ratio = value / threshold;
    score = Math.max(score, Math.min(ratio * 100, 100));

    if (name === 'O2' && definition.lowIsDanger) {
      if (value < threshold) {
        danger = true;
        reasons.push(`O₂ below minimum (${value}${gas.unit || '%'})`);
      }
    } else if (ratio >= (definition.dangerRatio ?? 1)) {
      danger = true;
      reasons.push(`${gas.name} exceeded threshold`);
    } else if (ratio >= (definition.warningRatio ?? 0.7)) {
      warning = true;
      reasons.push(`${gas.name} approaching threshold`);
    }
  }

  const level = danger ? 'danger' : warning ? 'warning' : 'safe';
  return { score: Math.round(score * 100) / 100, level, reason: reasons.join('; ') || 'Within configured thresholds' };
}

function validateTelemetry(payload) {
  const roverId = String(payload?.roverId || payload?.deviceId || '').trim();
  if (!roverId) return { ok: false, error: 'roverId is required' };

  const sensors = payload?.sensors || {};
  const gases = Array.isArray(payload?.gases) ? payload.gases : [
    { name: 'CO', value: payload.co, unit: 'ppm', threshold: 50, raw: payload.mq7 },
    { name: 'CH₄', value: payload.ch4, unit: '%LEL', threshold: 5, raw: payload.mq5 },
    { name: 'H₂S', value: payload.h2s, unit: 'ppm', threshold: 10 },
    { name: 'O₂', value: payload.o2, unit: '%', threshold: 19.5 },
  ].filter((gas) => finiteNumber(gas.value) !== null);

  const normalized = {
    roverId,
    timestamp: finiteNumber(payload?.timestamp) || Date.now(),
    sensors: {
      gases: gases.map((gas) => ({
        name: String(gas.name),
        value: finiteNumber(gas.value),
        raw: finiteNumber(gas.raw),
        unit: String(gas.unit || ''),
        threshold: finiteNumber(gas.threshold),
      })),
      temperature: finiteNumber(payload?.temperature ?? sensors.temperature),
      humidity: finiteNumber(payload?.humidity ?? sensors.humidity),
      pressure: finiteNumber(payload?.pressure ?? sensors.pressure),
      gasResistance: finiteNumber(payload?.gasResistance ?? sensors.gasResistance),
    },
    position: {
      x: finiteNumber(payload?.x ?? payload?.position?.x ?? payload?.position?.xMeters),
      y: finiteNumber(payload?.y ?? payload?.position?.y ?? payload?.position?.yMeters),
    },
    battery: finiteNumber(payload?.battery ?? payload?.batteryLevel),
    camera: {
      fps: finiteNumber(payload?.camera?.fps ?? payload?.fps),
    },
    thermal: {
      min: finiteNumber(payload?.thermal?.min ?? payload?.thermalMin),
      max: finiteNumber(payload?.thermal?.max ?? payload?.thermalMax),
      frame: Array.isArray(payload?.thermal?.frame) ? payload.thermal.frame : null,
    },
    operatingMode: payload?.operatingMode ? String(payload.operatingMode) : 'manual',
  };

  if (!normalized.sensors.gases.length && normalized.sensors.temperature === null && normalized.sensors.humidity === null) {
    return { ok: false, error: 'No recognized sensor values supplied' };
  }

  return { ok: true, data: normalized };
}

function broadcast(roverId, event, data) {
  const clients = sseClients.get(roverId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const response of clients) response.write(payload);
}

async function writeTelemetry(data) {
  const roverRef = db.ref(`industrialSafety/rovers/${data.roverId}`);
  const historyRef = db.ref(`industrialSafety/telemetry/${data.roverId}`).push();
  const risk = calculateRisk(data.sensors.gases);
  const record = {
    ...data,
    risk,
    receivedAt: Date.now(),
  };

  await Promise.all([
    roverRef.child('status').set({
      online: true,
      lastSeen: record.timestamp,
      battery: record.battery,
      riskLevel: risk.level,
      riskScore: risk.score,
      operatingMode: record.operatingMode,
      cameraFps: record.camera.fps,
    }),
    roverRef.child('sensors').set(record.sensors),
    roverRef.child('position').set({ ...record.position, timestamp: record.timestamp }),
    roverRef.child('risk').set({ ...risk, timestamp: record.timestamp }),
    historyRef.set(record),
  ]);

  if (risk.level !== 'safe') {
    const alertRef = db.ref('industrialSafety/alerts').push();
    await alertRef.set({
      roverId: record.roverId,
      severity: risk.level,
      message: risk.reason,
      position: record.position,
      timestamp: record.timestamp,
      acknowledged: false,
    });
  }

  broadcast(record.roverId, 'telemetry', record);
  return record;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'industrial-safety-rover-backend', timestamp: Date.now() });
});

app.get('/api/telemetry/latest', async (req, res) => {
  const roverId = String(req.query.roverId || DEFAULT_ROVER_ID);
  try {
    const snapshot = await db.ref(`industrialSafety/rovers/${roverId}`).once('value');
    const value = snapshot.val();
    if (!value) return res.status(404).json({ error: 'Rover telemetry not found' });
    res.json({ roverId, ...value });
  } catch (error) {
    console.error('Latest telemetry error:', error);
    res.status(500).json({ error: 'Unable to read telemetry' });
  }
});

app.get('/api/telemetry/history', async (req, res) => {
  const roverId = String(req.query.roverId || DEFAULT_ROVER_ID);
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 1000);
  try {
    const snapshot = await db.ref(`industrialSafety/telemetry/${roverId}`).limitToLast(limit).once('value');
    const values = snapshot.val() || {};
    res.json({ roverId, data: Object.values(values) });
  } catch (error) {
    console.error('Telemetry history error:', error);
    res.status(500).json({ error: 'Unable to read telemetry history' });
  }
});

app.get('/api/telemetry/stream', async (req, res) => {
  const roverId = String(req.query.roverId || DEFAULT_ROVER_ID);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let clients = sseClients.get(roverId);
  if (!clients) {
    clients = new Set();
    sseClients.set(roverId, clients);
  }
  clients.add(res);
  res.write(': connected\n\n');

  try {
    const snapshot = await db.ref(`industrialSafety/rovers/${roverId}`).once('value');
    const latest = snapshot.val();
    if (latest) res.write(`event: snapshot\ndata: ${JSON.stringify({ roverId, ...latest })}\n\n`);
  } catch (error) {
    console.error('Stream snapshot error:', error);
  }

  req.on('close', () => {
    clients.delete(res);
    if (clients.size === 0) sseClients.delete(roverId);
  });
});

app.post('/api/telemetry', async (req, res) => {
  if (!INGEST_TOKEN || req.get('x-rover-token') !== INGEST_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized telemetry source' });
  }

  const validation = validateTelemetry(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  try {
    const record = await writeTelemetry(validation.data);
    res.status(201).json({ ok: true, telemetry: record });
  } catch (error) {
    console.error('Telemetry write error:', error);
    res.status(500).json({ error: 'Unable to store telemetry' });
  }
});

app.listen(PORT, () => {
  console.log(`Industrial Safety Rover backend listening on http://localhost:${PORT}`);
});
