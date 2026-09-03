# Industrial Safety Rover Dashboard

A web dashboard for an **Industrial Safety Rover** designed for pre-entry hazard assessment in confined industrial spaces such as gas chambers, refineries, tanks, and enclosed chambers.

The project combines gas/environmental sensing, risk classification, rover-position mapping, live ESP32-CAM video, thermal telemetry, and operator alerts.

> **Current implementation status:** The dashboard is now wired for live telemetry through a Node.js/Firebase backend. The remaining field work is hardware bring-up, sensor calibration, ESP32/ESP32-CAM flashing, and controlled end-to-end testing.

## 🎯 Problem

Manual inspection and single-sensor approaches can expose personnel to hazardous environments and provide limited situational awareness. The goal is to use a mobile rover to detect hazardous conditions, map risk areas, and provide operators with a live dashboard before human entry.

## ✅ Implemented Software Path

```text
ESP32 Main Rover
     │ HTTP POST + rover token
     ▼
Node.js / Express API
     │ validate + timestamp + risk evaluation
     ▼
Firebase Realtime Database
     │
     ├── current rover state
     ├── telemetry history
     └── alerts
     │
     ▼
Dashboard SSE stream
     │
     ├── live sensor values
     ├── risk state
     ├── gas mapping
     ├── thermal frame (when supplied)
     └── rover status

ESP32-CAM ──HTTP/MJPEG──► Dashboard camera panel
```

The main ESP32 is responsible for sensor acquisition, calibration/filtering, motion and odometry, and sending normalized telemetry. The ESP32-CAM remains a separate stream source so video processing does not interfere with the main controller.

## 🧰 Hardware Plan

| Component | Purpose |
|---|---|
| ESP32 DevKit | Main controller, sensor processing, Wi-Fi and motion logic |
| ESP32-CAM | Live video streaming |
| MQ-2 | Combustible gas / smoke detection |
| MQ-5 | LPG / natural gas detection |
| MQ-7 | Carbon monoxide detection |
| DHT22 | Temperature and humidity |
| BME688 | VOC / environmental sensing |
| MLX90640 | Thermal imaging |
| Wheel encoders | Rover odometry and mapping |
| Motor driver | Motor speed and direction control |
| 4WD chassis + BO motors | Rover mobility |
| Buzzer + RGB/LED | Local hazard alerts |

The target hardware budget is **₹20,000**, with an estimated base cost of approximately **₹10,740**, leaving contingency for shipping, spares, battery improvements, or future upgrades.

## 🧠 Telemetry Contract

The backend accepts a normalized rover payload at `POST /api/telemetry` with an `x-rover-token` header.

Example:

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

For MQ-series sensors, `raw` is the device ADC reading and `value` is the calibrated engineering value. Do not label raw ADC values as ppm or %LEL without calibration.

## 🔥 Firebase Data Model

```text
industrialSafety/
  rovers/
    rover-01/
      status/
      sensors/
      position/
      risk/
  telemetry/
    rover-01/<history-key>/
  alerts/<alert-id>/
```

The current-state paths are overwritten with the latest reading, while the telemetry collection retains historical samples for mapping, trends, and diagnostics. The Admin SDK is used only by the backend; Firebase credentials are never placed in the React frontend.

## 💻 Software Stack

### Dashboard

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts

### Backend

- Node.js 22+
- Express
- Firebase Admin SDK
- Firebase Realtime Database
- Server-Sent Events (SSE)

### Rover / Embedded System

- ESP32
- ESP32-CAM
- Sensor modules over analog / I2C interfaces
- Wheel-encoder based dead-reckoning

## 📁 Important Project Files

```text
src/
  hooks/useRoverData.ts       # live telemetry state for the dashboard
  lib/telemetry.ts            # backend API + SSE client
  types/telemetry.ts          # shared telemetry models
  components/dashboard/
    RGBCameraPanel.tsx        # ESP32-CAM stream

backend/
  server.js                   # telemetry API + Firebase persistence
  package.json                # backend dependencies/scripts
  .env.example                # backend configuration template

firebase.database.rules.json  # locked-down RTDB rules
.env.example                  # frontend configuration template
```

## 🚀 Local Development

### Frontend

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set:

```bash
VITE_API_BASE_URL=http://localhost:8787
VITE_ROVER_ID=rover-01
VITE_CAMERA_STREAM_URL=http://<ESP32-CAM-IP>/<stream-path>
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` from `backend/.env.example` and set your Firebase database URL, Google application credentials path, rover ingest token, and CORS origin.

Firebase's current Admin SDK guidance recommends Application Default Credentials for trusted server environments; when running locally with a service-account key, keep the JSON file outside Git and reference it through `GOOGLE_APPLICATION_CREDENTIALS`.

## 🔐 Security Rules

The repository includes `firebase.database.rules.json` with database reads/writes locked down. The backend uses the Firebase Admin SDK for trusted access, while the browser communicates with the backend rather than holding Firebase service-account credentials.

Do **not** put a Firebase Admin service-account JSON file, private key, or backend `.env` file into the repository.

## 🧠 Risk & Mapping Logic

Sensor readings are intended to be calibrated and filtered before risk classification:

1. Establish clean-air baselines and sensor calibration coefficients.
2. Smooth noisy readings using an appropriate moving-average/filtering strategy.
3. Convert raw sensor measurements into calibrated engineering values.
4. Compare calibrated values with configured hazard thresholds.
5. Combine hazards into a Safe / Warning / Danger state.
6. Associate readings with rover position and timestamp.
7. Render collected samples as a color-coded 2D gas map.
8. Use the risk state as an input to movement behavior.

The backend implementation deliberately keeps the calibration boundary explicit: raw MQ readings can be stored, but the risk calculation expects calibrated values with meaningful units.

## 🧪 Remaining Field Work

- [ ] Create/configure the Firebase project and enable Realtime Database
- [ ] Generate a dedicated backend service-account credential and configure `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Deploy/apply `firebase.database.rules.json`
- [ ] Flash the ESP32 main-controller firmware
- [ ] Flash/configure the ESP32-CAM stream firmware
- [ ] Wire and validate MQ-2, MQ-5, MQ-7, DHT22, BME688, and MLX90640 modules
- [ ] Calibrate gas sensors and validate threshold assumptions
- [ ] Calibrate wheel encoders and confirm rover position units
- [ ] Verify telemetry POSTs reach the backend and Firebase
- [ ] Verify the dashboard receives SSE updates and reports offline state correctly
- [ ] Validate thermal frames before enabling full-frame thermal mapping
- [ ] Test hazard alerts and movement behavior in a controlled mock environment
- [ ] Perform end-to-end demonstration and final documentation

## ⚠️ Important Limitations

- MQ-series gas sensors require proper warm-up and calibration; raw ADC values are not universal gas concentrations.
- Wheel-encoder dead-reckoning accumulates positional drift over longer runs.
- Wi-Fi can be unreliable inside metal tanks, pipelines, and other enclosed industrial structures.
- Thresholds and risk classifications must be validated against appropriate safety standards and actual sensor calibration before hazardous-environment use.
- This project is a prototype and **not a replacement for certified industrial safety equipment or professional gas detection systems**.

## 💰 Budget

**Target:** ₹20,000 maximum

**Estimated base hardware cost:** ~₹10,740

The remaining budget is intended for shipping/import costs, spare components, battery improvements, and optional future processing hardware.

## 📄 License

Add the project's license here before public release.
