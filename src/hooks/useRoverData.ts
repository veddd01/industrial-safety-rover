import { useEffect, useMemo, useState } from 'react';
import { getTelemetryHistory, subscribeToTelemetry } from '@/lib/telemetry';
import type { RiskLevel, RoverTelemetry } from '@/types/telemetry';

export interface GasReading {
  name: string;
  value: number;
  unit: string;
  threshold: number;
}

export interface SensorData {
  gases: GasReading[];
  temperature: number;
  humidity: number;
  batteryLevel: number;
  isOnline: boolean;
  fps: number;
  thermalMax: number;
  thermalMin: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'danger';
  message: string;
}

export interface GasMapPoint {
  x: number;
  y: number;
  value: number;
}

const ROVER_ID = import.meta.env.VITE_ROVER_ID || 'rover-01';
const OFFLINE_AFTER_MS = 8_000;
const DEFAULT_GASES: GasReading[] = [
  { name: 'CO', value: 0, unit: 'ppm', threshold: 50 },
  { name: 'CH₄', value: 0, unit: '%LEL', threshold: 5 },
  { name: 'H₂S', value: 0, unit: 'ppm', threshold: 10 },
  { name: 'O₂', value: 0, unit: '%', threshold: 19.5 },
];

const toGasReadings = (telemetry?: RoverTelemetry): GasReading[] => {
  if (!telemetry?.sensors?.gases?.length) return DEFAULT_GASES;

  return telemetry.sensors.gases
    .filter((gas) => gas.value !== null)
    .map((gas) => ({
      name: gas.name,
      value: gas.value ?? 0,
      unit: gas.unit,
      threshold: gas.threshold ?? 0,
    }));
};

const buildGasMap = (history: RoverTelemetry[], selectedGas: string): GasMapPoint[] => {
  const valid = history.filter(
    (item) => item.position.x !== null && item.position.y !== null && item.sensors.gases.length,
  );
  if (!valid.length) return [];

  const values = valid.map((item) => {
    const gas = item.sensors.gases.find((entry) => entry.name === selectedGas);
    return { item, value: gas?.value ?? 0, threshold: gas?.threshold ?? 1 };
  });

  const xs = values.map(({ item }) => item.position.x as number);
  const ys = values.map(({ item }) => item.position.y as number);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  return values.map(({ item, value, threshold }) => ({
    x: ((item.position.x as number - minX) / rangeX) * 19,
    y: ((item.position.y as number - minY) / rangeY) * 14,
    value: Math.max(0, Math.min(100, threshold > 0 ? (value / threshold) * 100 : value)),
  }));
};

const makeLog = (telemetry: RoverTelemetry): LogEntry => ({
  id: `${telemetry.timestamp}-${telemetry.roverId}`,
  timestamp: new Date(telemetry.timestamp),
  type: telemetry.risk.level === 'danger' ? 'danger' : telemetry.risk.level === 'warning' ? 'warning' : 'info',
  message: telemetry.risk.reason || 'Telemetry received',
});

export function useRoverData() {
  const [history, setHistory] = useState<RoverTelemetry[]>([]);
  const [latest, setLatest] = useState<RoverTelemetry | undefined>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedGas, setSelectedGas] = useState('CO');
  const [lastReceivedAt, setLastReceivedAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    getTelemetryHistory(ROVER_ID, 200)
      .then((items) => {
        if (!active) return;
        const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
        setHistory(sorted);
        const last = sorted.at(-1);
        if (last) {
          setLatest(last);
          setLastReceivedAt(Date.now());
          setLogs(sorted.slice(-20).reverse().map(makeLog));
        }
      })
      .catch((error) => console.error('Unable to load telemetry history:', error));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToTelemetry(
      ROVER_ID,
      (telemetry) => {
        setLatest(telemetry);
        setLastReceivedAt(Date.now());
        setHistory((previous) => [...previous.slice(-199), telemetry]);
        setLogs((previous) => [makeLog(telemetry), ...previous].slice(0, 20));
      },
      (error) => console.warn('Telemetry stream error:', error),
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sensorData = useMemo<SensorData>(() => {
    const gases = toGasReadings(latest);
    return {
      gases,
      temperature: latest?.sensors.temperature ?? 0,
      humidity: latest?.sensors.humidity ?? 0,
      batteryLevel: latest?.battery ?? 0,
      isOnline: lastReceivedAt > 0 && now - lastReceivedAt < OFFLINE_AFTER_MS,
      fps: latest?.camera.fps ?? 0,
      thermalMax: latest?.thermal.max ?? 0,
      thermalMin: latest?.thermal.min ?? 0,
    };
  }, [latest, lastReceivedAt, now]);

  const gasMap = useMemo(() => buildGasMap(history, selectedGas), [history, selectedGas]);
  const thermalMap = latest?.thermal.frame ?? [];
  const riskLevel = (latest?.risk.level ?? 'safe') as RiskLevel;

  return {
    sensorData,
    logs,
    gasMap,
    thermalMap,
    selectedGas,
    setSelectedGas,
    riskLevel,
    roverId: ROVER_ID,
    lastTelemetry: latest,
  };
}
