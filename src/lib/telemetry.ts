import type { RoverLatestResponse, RoverTelemetry } from '@/types/telemetry';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');

export async function getLatestTelemetry(roverId: string): Promise<RoverLatestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/telemetry/latest?roverId=${encodeURIComponent(roverId)}`);
  if (!response.ok) throw new Error(`Telemetry request failed (${response.status})`);
  return response.json();
}

export async function getTelemetryHistory(roverId: string, limit = 100): Promise<RoverTelemetry[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/telemetry/history?roverId=${encodeURIComponent(roverId)}&limit=${limit}`,
  );
  if (!response.ok) throw new Error(`Telemetry history request failed (${response.status})`);
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

export function subscribeToTelemetry(
  roverId: string,
  onTelemetry: (telemetry: RoverTelemetry) => void,
  onError?: (error: Event) => void,
): () => void {
  const source = new EventSource(
    `${API_BASE_URL}/api/telemetry/stream?roverId=${encodeURIComponent(roverId)}`,
  );

  const handleEvent = (event: MessageEvent<string>) => {
    try {
      onTelemetry(JSON.parse(event.data) as RoverTelemetry);
    } catch (error) {
      console.error('Invalid telemetry event:', error);
    }
  };

  source.addEventListener('telemetry', handleEvent);
  source.onerror = (event) => onError?.(event);

  return () => {
    source.removeEventListener('telemetry', handleEvent);
    source.close();
  };
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
