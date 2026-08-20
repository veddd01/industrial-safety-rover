# Industrial Safety Rover Dashboard

A web dashboard for an **Industrial Safety Rover** designed for pre-entry hazard assessment in confined industrial spaces such as gas chambers, refineries, tanks, and enclosed chambers.

The project is focused on giving operators a clear view of environmental hazards before human entry, combining gas sensing, risk classification, rover position mapping, live video, thermal imaging, and hazard-responsive movement.

> **Project status:** Dashboard / prototype stage. Hardware integration and autonomous rover functionality are planned components of the overall system.

## 🎯 Problem

Manual inspection and single-sensor approaches can expose personnel to hazardous environments and provide limited situational awareness. The goal of this system is to use a low-cost mobile rover to detect hazardous gases and environmental conditions, map risk areas, and provide operators with a live dashboard.

## ✨ Planned Capabilities

- Real-time combustible gas, LPG, and CO monitoring
- Temperature and humidity monitoring
- Safe / Caution / Danger risk classification
- Weighted risk-scoring model for combining sensor readings
- Color-coded gas and hazard intensity mapping
- Rover position tracking using wheel encoders
- Automatic movement behavior based on risk level
  - **Safe:** normal movement
  - **Caution:** reduced speed and increased monitoring
  - **Danger:** stop, reverse, and trigger alerts
- Live ESP32-CAM video feed
- MLX90640 thermal imaging
- Buzzer and RGB/LED hazard alerts
- Operator dashboard for live sensor and rover status

## 🏗️ System Architecture

The proposed system uses a two-controller design:

```text
                  ┌─────────────────────────┐
                  │      Web Dashboard      │
                  │ Sensors • Risk • Map    │
                  │ Video • Thermal • Alerts│
                  └────────────┬────────────┘
                               │ Wi-Fi
                 ┌─────────────┴─────────────┐
                 │                           │
        ┌────────▼────────┐       ┌────────▼────────┐
        │   ESP32 Main    │       │   ESP32-CAM      │
        │ Sensor + Motion │       │   Live Video     │
        │ Risk + Mapping  │       │                  │
        └────────┬────────┘       └──────────────────┘
                 │
       ┌─────────┼──────────────────────┐
       │         │          │            │
    Gas sensors  │       Encoders    Motor driver
       │         │          │            │
     MQ-2/MQ-5  BME688     X/Y          4WD Rover
     MQ-7/DHT22  MLX90640  position
```

The main ESP32 is intended to handle sensor polling, motor control, risk scoring, position tracking, and the Wi-Fi dashboard interface. The ESP32-CAM is kept separate so video streaming does not interfere with sensor processing.

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

## 🧠 Risk & Mapping Logic

Sensor readings are intended to be calibrated and filtered before risk classification. The planned pipeline is:

1. Calibrate gas sensors and establish clean-air baselines.
2. Smooth noisy readings using a moving-average filter.
3. Normalize readings against relevant hazard thresholds.
4. Combine readings using a weighted risk score.
5. Classify the environment as **Safe**, **Caution**, or **Danger**.
6. Associate readings with rover position and timestamp.
7. Render the collected data as a color-coded 2D hazard map.
8. Adjust rover movement according to the current risk level.

## 💻 Software Stack

### Dashboard

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts

### Rover / Embedded System

- ESP32
- ESP32-CAM
- Sensor modules over analog / I2C interfaces
- Wheel-encoder based dead-reckoning

The current repository is a Vite + React + TypeScript frontend project with Tailwind CSS and shadcn/ui dependencies.

## 🚀 Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## 📊 Development Roadmap

- [ ] Component procurement and individual sensor bring-up
- [ ] Rover chassis and motor control
- [ ] Gas/environmental sensor integration
- [ ] Sensor calibration and filtering
- [ ] Risk scoring implementation
- [ ] Position tracking and gas mapping
- [ ] Autonomous hazard-responsive movement
- [ ] ESP32-CAM video integration
- [ ] MLX90640 thermal integration
- [ ] Live dashboard integration with rover telemetry
- [ ] End-to-end testing in a controlled enclosed-space mock environment
- [ ] Final documentation, cost analysis, and demonstration

## ⚠️ Important Limitations

- MQ-series gas sensors require proper calibration and warm-up; raw ADC values should not be treated as universal gas concentrations.
- Wheel-encoder dead-reckoning will accumulate positional drift over longer runs.
- Wi-Fi can be unreliable inside metal tanks, pipelines, and other enclosed industrial structures.
- Thresholds and risk classifications must be validated against appropriate safety standards and real sensor calibration before any real hazardous-environment deployment.
- This project should be treated as a prototype and **not as a replacement for certified industrial safety equipment or professional gas detection systems**.

## 💰 Budget

**Target:** ₹20,000 maximum

**Estimated base hardware cost:** ~₹10,740

The remaining budget is intended for shipping/import costs, spare components, battery improvements, and optional future processing hardware.

## 📁 Project Context

This dashboard is part of an Industrial Safety Rover project intended for **pre-entry hazard assessment**. The broader project plan covers the hardware architecture, sensing, risk scoring, autonomous behavior, mapping, thermal imaging, video streaming, and a 10-week development roadmap.

## 📄 License

Add the project's license here before public release.
