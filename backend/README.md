# Industrial Safety Rover Backend

This service is the trusted telemetry gateway between the ESP32 rover and the React dashboard.

## Responsibilities

- Accept authenticated telemetry from the main ESP32.
- Validate and normalize sensor payloads.
- Calculate Safe / Warning / Danger status from configured calibrated values.
- Store current rover state and historical telemetry in Firebase Realtime Database.
- Create alerts for Warning / Danger telemetry.
- Stream live telemetry to the dashboard over Server-Sent Events (SSE).

## Required software

The current Firebase Admin documentation requires Node.js 22+ for the Node.js Admin SDK.

## Configuration

Copy `.env.example` to `.env` and set:

- `FIREBASE_DATABASE_URL` to the Realtime Database URL for your Firebase project.
- `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file stored outside Git.
- `ROVER_INGEST_TOKEN` to a long random token shared only with the rover firmware.
- `CORS_ORIGIN` to the URL of the React dashboard.

Never commit the service-account JSON or `.env` file.

## Install and run

```bash
cd backend
npm install
npm run dev
```

The default API is available at `http://localhost:8787`.

## Endpoints

`GET /api/health` — service health.

`GET /api/telemetry/latest?roverId=rover-01` — latest rover state.

`GET /api/telemetry/history?roverId=rover-01&limit=100` — historical telemetry.

`GET /api/telemetry/stream?roverId=rover-01` — live SSE stream for the dashboard.

`POST /api/telemetry` — rover ingestion endpoint. The request must contain the `x-rover-token` header.

Example ingestion payload:

```json
{
  "roverId": "rover-01",
  "timestamp": 1760000000000,
  "gases": [
    { "name": "CO", "value": 12.4, "raw": 412, "unit": "ppm", "threshold": 50 },
    { "name": "CH₄", "value": 0.8, "raw": 287, "unit": "%LEL", "threshold": 5 },
    { "name": "H₂S", "value": 2.1, "raw": 193, "unit": "ppm", "threshold": 10 },
    { "name": "O₂", "value": 20.8, "raw": null, "unit": "%", "threshold": 19.5 }
  ],
  "temperature": 31.4,
  "humidity": 58.2,
  "pressure": 1008.4,
  "gasResistance": 182000,
  "x": 2.4,
  "y": 5.1,
  "battery": 87,
  "camera": { "fps": 20 },
  "thermal": { "min": 23.1, "max": 61.2, "frame": null },
  "operatingMode": "manual"
}
```

The gas `value` field must represent a calibrated value in the stated unit. Raw MQ-series ADC readings should remain in `raw` and should not be presented as ppm/LEL without calibration.
