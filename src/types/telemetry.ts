export type RiskLevel = 'safe' | 'warning' | 'danger';

export interface RoverGas {
  name: string;
  value: number | null;
  raw: number | null;
  unit: string;
  threshold: number | null;
}

export interface RoverTelemetry {
  roverId: string;
  timestamp: number;
  sensors: {
    gases: RoverGas[];
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    gasResistance: number | null;
  };
  position: {
    x: number | null;
    y: number | null;
  };
  battery: number | null;
  camera: {
    fps: number | null;
  };
  thermal: {
    min: number | null;
    max: number | null;
    frame: number[][] | null;
  };
  operatingMode: string;
  risk: {
    score: number;
    level: RiskLevel;
    reason: string;
  };
}

export interface RoverStatus {
  online: boolean;
  lastSeen: number;
  battery: number | null;
  riskLevel: RiskLevel;
  riskScore: number;
  operatingMode: string;
  cameraFps: number | null;
}

export interface RoverLatestResponse {
  roverId: string;
  status?: RoverStatus;
  sensors?: RoverTelemetry['sensors'];
  position?: RoverTelemetry['position'] & { timestamp: number };
  risk?: RoverTelemetry['risk'] & { timestamp: number };
}
