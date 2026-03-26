import { useState, useEffect, useCallback } from 'react';

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

const randomBetween = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

export function useRoverData() {
  const [sensorData, setSensorData] = useState<SensorData>({
    gases: [
      { name: 'CO', value: 12, unit: 'ppm', threshold: 50 },
      { name: 'CH₄', value: 0.8, unit: '%LEL', threshold: 5 },
      { name: 'H₂S', value: 3.2, unit: 'ppm', threshold: 10 },
      { name: 'O₂', value: 20.8, unit: '%', threshold: 19.5 },
    ],
    temperature: 34.2,
    humidity: 62,
    batteryLevel: 78,
    isOnline: true,
    fps: 30,
    thermalMax: 67.3,
    thermalMin: 22.1,
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date(), type: 'info', message: 'System initialized successfully' },
    { id: '2', timestamp: new Date(), type: 'info', message: 'Gas sensors calibrated' },
    { id: '3', timestamp: new Date(), type: 'warning', message: 'CO level approaching threshold' },
  ]);

  const [gasMap, setGasMap] = useState<GasMapPoint[]>(() => {
    const points: GasMapPoint[] = [];
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 15; y++) {
        const cx = 10, cy = 7;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        points.push({ x, y, value: Math.max(0, 100 - dist * 10 + Math.random() * 20) });
      }
    }
    return points;
  });

  const [thermalMap, setThermalMap] = useState<number[][]>(() => {
    const map: number[][] = [];
    for (let y = 0; y < 12; y++) {
      map[y] = [];
      for (let x = 0; x < 16; x++) {
        const hotspot1 = Math.exp(-((x - 4) ** 2 + (y - 3) ** 2) / 8) * 45;
        const hotspot2 = Math.exp(-((x - 12) ** 2 + (y - 8) ** 2) / 12) * 35;
        map[y][x] = 22 + hotspot1 + hotspot2 + Math.random() * 3;
      }
    }
    return map;
  });

  const [selectedGas, setSelectedGas] = useState('CO');

  const updateData = useCallback(() => {
    setSensorData(prev => ({
      ...prev,
      gases: prev.gases.map(g => ({
        ...g,
        value: Math.max(0, g.value + randomBetween(-0.5, 0.5)),
      })),
      temperature: prev.temperature + randomBetween(-0.3, 0.3),
      humidity: Math.min(100, Math.max(0, prev.humidity + randomBetween(-1, 1))),
      batteryLevel: Math.max(0, prev.batteryLevel - randomBetween(0, 0.05)),
      fps: Math.round(28 + Math.random() * 4),
      thermalMax: prev.thermalMax + randomBetween(-0.5, 0.5),
      thermalMin: prev.thermalMin + randomBetween(-0.2, 0.2),
    }));

    setGasMap(prev =>
      prev.map(p => ({ ...p, value: Math.max(0, Math.min(100, p.value + randomBetween(-3, 3))) }))
    );

    setThermalMap(prev =>
      prev.map(row => row.map(v => Math.max(20, v + randomBetween(-0.5, 0.5))))
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(updateData, 1500);
    return () => clearInterval(interval);
  }, [updateData]);

  // Randomly add logs
  useEffect(() => {
    const logMessages = [
      { type: 'info' as const, message: 'Sensor data acquired' },
      { type: 'info' as const, message: 'Navigation waypoint reached' },
      { type: 'warning' as const, message: 'Temperature spike detected in sector 3' },
      { type: 'warning' as const, message: 'Gas concentration rising in zone A' },
      { type: 'danger' as const, message: 'H₂S level exceeded safe threshold!' },
      { type: 'info' as const, message: 'Thermal scan complete' },
    ];
    const interval = setInterval(() => {
      const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
      setLogs(prev => [
        { id: Date.now().toString(), timestamp: new Date(), ...msg },
        ...prev.slice(0, 19),
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const riskLevel = (() => {
    const hasExceeded = sensorData.gases.some(g => g.value > g.threshold);
    const hasWarning = sensorData.gases.some(g => g.value > g.threshold * 0.7);
    if (hasExceeded) return 'danger' as const;
    if (hasWarning) return 'warning' as const;
    return 'safe' as const;
  })();

  return { sensorData, logs, gasMap, thermalMap, selectedGas, setSelectedGas, riskLevel };
}
