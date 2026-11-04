# AAHARR — Industrial Safety Rover Dashboard

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![ESP32](https://img.shields.io/badge/Hardware-ESP32-E7352C?logo=espressif&logoColor=white)
![LoRa](https://img.shields.io/badge/Telemetry-LoRa%20433%20MHz-0A7BBB)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

**AAHARR (Advanced Autonomous Hazard and Reconnaissance Rover)** is a student-built, four-wheel-drive reconnaissance rover concept for preliminary screening of confined industrial spaces such as storage tanks, pipelines, and enclosed process chambers before personnel enter.

This repository contains the **React-based operator dashboard UI**. The wider rover system uses ESP32-based sensing and drive nodes, an ESP32-CAM for video, and a LoRa link to deliver sensor telemetry to a base station. The base station is designed to forward readings to the operator interface and log packets to Google Sheets.

> **Important implementation note:** The dashboard in this repository is currently a frontend prototype. Its `useRoverData` hook generates simulated readings, gas-map points, thermal data, and activity logs. The camera panel is a visual placeholder. The React UI is **not yet connected to live rover telemetry or the ESP32-CAM stream**. Do not interpret the values shown by this dashboard as real sensor measurements.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Current Dashboard](#current-dashboard)
- [System Architecture](#system-architecture)
- [Hardware](#hardware)
- [Communication and Telemetry](#communication-and-telemetry)
- [Firmware Reference](#firmware-reference)
- [Software Stack](#software-stack)
- [Getting Started](#getting-started)
- [Current Dashboard Structure](#current-dashboard-structure)
- [Planned Full Repository Layout](#planned-full-repository-layout)
- [Project Status](#project-status)
- [Bench Results](#bench-results)
- [Estimated Performance](#estimated-performance)
- [Wiring and Schematics](#wiring-and-schematics)
- [Documentation](#documentation)
- [Known Limitations and Safety](#known-limitations-and-safety)
- [Roadmap](#roadmap)
- [Budget](#budget)
- [Team](#team)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [Citation](#citation)

---

## Project Overview

Confined industrial spaces can contain combustible or toxic gases and oxygen-deficient atmospheres that are not visible to personnel. AAHARR is intended to provide a remotely operated first-look assessment platform, reducing the need for an initial manual walk-through.

The rover combines:

- Multi-sensor environmental monitoring.
- Remote movement over a Wi-Fi access point.
- Long-range sensor telemetry over LoRa.
- ESP32-CAM video streaming.
- A base station for packet reception and cloud logging.
- A browser-based operator dashboard for monitoring and control.

The project is a **teleoperated reconnaissance prototype**. Autonomous navigation, validated hazard mapping, and safety-certified gas measurement are not established capabilities.

## Current Dashboard

The React application is organized as a single dashboard page with the following panels:

| Panel | Current UI behavior | Hardware integration status |
|---|---|---|
| Top navigation | Displays connection status, battery percentage, and a live clock | Connection and battery values are currently sample state |
| Gas mapping | Renders a color-coded 20 × 15 grid and lets the user select CO, CH₄, H₂S, or O₂ | Grid values are generated locally; no rover position or sensor stream is connected |
| Sensor readings | Displays gas values, temperature, humidity, risk state, and an activity log | Readings and log messages are simulated |
| RGB camera | Shows a camera-style placeholder with illustrative detection boxes and FPS text | No live ESP32-CAM stream is loaded |
| Thermal imaging | Renders a generated thermal grid with a temperature range and hotspot markers | No thermal sensor is connected in this app |

### Demo data and risk indicator

The current data provider is `src/hooks/useRoverData.ts`. It updates sample values on a timer and generates sample map and thermal data. The default gas labels shown by the UI are **CO, CH₄, H₂S, and O₂**; these are demonstration fields and should not be read as a one-to-one display of the rover's MQ sensor channels.

The dashboard's current Safe / Warning / Danger indicator is a simple UI demonstration based on configured thresholds. It is **not a calibrated risk model** and does not implement validated gas-specific alarm logic. In particular, oxygen-deficiency assessment requires lower-limit logic and cannot be represented safely by a generic “reading above threshold” comparison.

The `LIVE`, `Online`, FPS, and battery indicators are also presentation values in the current prototype, not proof of an active device connection.

## System Architecture

The rover system is divided into sensing, drive, video, and base-station functions.

```text
                         OPERATOR LAPTOP
                 React dashboard (this repository)
             Telemetry UI • Gas map • Video • Thermal UI
                              |
                Live integration to be completed
                              |
              +---------------+----------------+
              |                                |
       USB serial / telemetry             Wi-Fi rover AP
              |                                |
      +-------v---------+              +-------v---------+
      | BASE STATION    |              | DRIVE NODE      |
      | ESP32 + Ra-02   |              | ESP32 + L298N   |
      | LoRa receiver   |              | 4WD motor drive |
      | RSSI / SNR      |              | Web controller  |
      +-------+---------+              +-------+---------+
              |                                |
       Google Apps Script                 Rover motors
              |                                |
       Google Sheets                  ESP32-CAM on same AP
              ^
              |
       LoRa 433 MHz
       approx. 3.1 s interval
              |
      +-------+---------+
      | SENSING NODE    |
      | ESP32 + Ra-02   |
      | Gas/environment|
      | and motion data|
      +----------------+
```

### Node responsibilities

| Node | Main components | Responsibility |
|---|---|---|
| Sensing node | ESP32 DevKit, Ra-02 LoRa module, sensors | Samples gas, environmental, flame, distance, and motion data; transmits telemetry packets |
| Drive node | ESP32 DevKit, L298N, 4WD motors | Hosts the rover Wi-Fi access point and web controller; drives the motors and applies a command-timeout stop |
| Video node | ESP32-CAM (OV2640) | Provides an MJPEG camera stream over the rover Wi-Fi network |
| Base station | ESP32 DevKit, Ra-02 LoRa module | Receives telemetry, adds RSSI/SNR information, outputs data over USB serial, and forwards readings to Google Apps Script |

The hardware reference describes the rover access point at `192.168.4.1` and the ESP32-CAM stream at `192.168.4.2:81`. These are hardware-side reference endpoints; the React app in this repository does not currently consume them.

## Hardware

The implemented sensor set documented for the rover is listed below. **MQ-135 appeared in the initial proposal but was not retained in the implemented sensor array; MQ-7 is used instead.**

| Component | Purpose |
|---|---|
| ESP32 DevKit | Sensing, drive, and base-station control nodes |
| ESP32-CAM (OV2640) | Live video stream |
| Ra-02 (SX1278) LoRa modules | 433 MHz telemetry link between sensing node and base station |
| MQ-2 | Smoke and combustible-gas sensing |
| MQ-5 | LPG and natural-gas sensing |
| MQ-7 | Carbon-monoxide sensing |
| MQ-9 | CO and combustible-gas sensing |
| DHT22 | Temperature and humidity |
| Flame sensor (LM393) | Flame indication |
| HC-SR04 | Advisory forward-distance measurement |
| MPU6050 | Acceleration and angular-rate measurements |
| L298N | Dual H-bridge motor driver |
| 2-tier 4WD chassis and geared motors | Rover mobility |
| 3S 18650 battery packs and buck converters | Separate power rails for rover decks |

### Drive-node pin map

| Function | L298N pin | ESP32 GPIO |
|---|---|---:|
| Left motor direction A / B | IN1 / IN2 | 26 / 27 |
| Left motor speed (PWM) | ENA | 33 |
| Right motor direction A / B | IN3 / IN4 | 14 / 25 |
| Right motor speed (PWM) | ENB | 32 |
| Light output | — | 4 |

The ENA and ENB jumpers on the L298N are removed so that the ESP32 can control motor speed with PWM. Left and right turn behavior is adjusted in software to match the motor wiring.

### LoRa configuration reference

| Parameter | Reference setting |
|---|---|
| Module | Ra-02 / SX1278 |
| Frequency | 433 MHz |
| Spreading factor | SF7 |
| Bandwidth | 125 kHz |
| Coding rate | 4/5 |
| Transmit power | 17 dBm |
| Packet format | 60-byte binary packet; magic word `0xABCD` |
| Nominal telemetry interval | Approximately 3.1 seconds |

**Regulatory check required:** the hardware notes flag the referenced `433.000 MHz` / `17 dBm` setting as outside the stated Indian licence-free operating conditions. Confirm the permitted frequency, bandwidth, and effective radiated power for the deployment location before operating the radio. Do not treat the reference settings as regulatory approval.

## Communication and Telemetry

The hardware design uses two wireless paths for different purposes:

- **Wi-Fi:** short-range rover driving and camera access.
- **LoRa:** longer-range sensor telemetry from the sensing node to the base station.

The telemetry packet is documented with the following groups:

| Group | Fields |
|---|---|
| Header | Source, destination, packet ID, TTL |
| Gas channels | MQ sensor readings (raw ADC counts) |
| Environment | Flame state, distance (cm), temperature (°C), humidity (%) |
| Motion | Accelerometer `ax`, `ay`, `az` (g) and gyroscope `gx`, `gy`, `gz` (°/s) |
| Link quality | RSSI (dBm) and SNR (dB), added by the base station |
| Time | Dashboard/laptop time for local export; server time in Google Sheets |

Gas readings are raw sensor counts unless and until the sensing chain is calibrated and converted using an appropriate sensor model. They are not ppm values.

### Planned React dashboard integration

The hardware reference describes a separate HTML operator interface using browser serial access. That `dashboard_live.html` file is **not present in this React repository**. The React app still needs an integration layer to:

1. Read and parse telemetry from the base station over an appropriate serial or backend connection.
2. Map the received sensor channels to the dashboard's data model.
3. Replace generated gas and thermal map data with actual sensor and position data.
4. Load the ESP32-CAM stream from the rover network.
5. Add real connection-state, packet-age, and device-health handling.
6. Connect operator drive controls to the drive node's HTTP endpoints, with safe command handling.

## Firmware Reference

The hardware project notes describe these firmware responsibilities. The firmware sketches are not currently part of this React dashboard repository.

| Planned sketch path | Node | Responsibility |
|---|---|---|
| `firmware/sensing_node/sensing_node.ino` | Sensing ESP32 | Samples the sensors and transmits a `SensorPacket` over LoRa at approximately 3.1-second intervals |
| `firmware/base_station/base_station.ino` | Base-station ESP32 | Receives and validates LoRa packets, adds RSSI/SNR, outputs serial data at 115200 baud, and posts readings to Google Apps Script |
| `firmware/drive_node/drive_node.ino` | Drive ESP32 | Hosts the Wi-Fi AP and web controller, controls the motors, and stops the motors if a command is not received within 500 ms |
| `firmware/camera_node/camera_node.ino` | ESP32-CAM | Camera firmware based on Espressif's CameraWebServer example; keep its supporting source/header files and applicable license notices |

**Repository status:** these firmware files are described by the project update plan but have **not yet been uploaded to this repository**. The names above are the target Arduino sketch names; no firmware compile is possible from the current checkout.

## Software Stack

### Dashboard repository

| Technology | Use |
|---|---|
| React 18 | Dashboard UI |
| TypeScript | Application typing |
| Vite 5 | Development server and production build |
| Tailwind CSS | Styling |
| Radix UI / shadcn-style components | UI primitives |
| Lucide React | Icons |
| React Router | Page routing |
| TanStack React Query | Query client provider |
| Recharts | Charting dependency available in the project |

### Rover hardware

- ESP32 DevKit and ESP32-CAM.
- Arduino-based firmware.
- Ra-02 / SX1278 LoRa communication.
- Wi-Fi access point and HTTP control on the drive node.
- Google Apps Script and Google Sheets for packet logging.

## Getting Started

### Prerequisites

- Node.js (LTS recommended) and npm.
- Git.
- A modern browser for local dashboard development.

Hardware flashing requires the Arduino IDE or PlatformIO with the ESP32 board package and the libraries used by the firmware sketches.

### Run the dashboard locally

Clone the repository:

```bash
git clone https://github.com/veddd01/industrial-safety-rover.git
cd industrial-safety-rover
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The Vite configuration uses port `8080` by default. Open the local URL printed in the terminal.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Hardware bring-up (pending firmware upload)

The following workflow reflects the project update plan. It is **not executable from the current repository checkout**, because the firmware sketches, `secrets.example.h` files, Apps Script source, and `dashboard/dashboard_live.html` have not yet been committed.

1. After the firmware folders are uploaded, copy each folder's `secrets.example.h` to `secrets.h` and enter the local credentials. Never commit `secrets.h`.
2. Create the Google Sheet, add the verified Apps Script source from `apps-script/Code.gs`, deploy it as a web app, and keep its deployment URL in the base-station's ignored `secrets.h`.
3. Flash the sensing, base-station, and drive sketches to their respective ESP32 DevKit boards. Flash the camera sketch to an AI-Thinker ESP32-CAM with the required PSRAM setting.
4. Power the decks separately and allow the MQ sensors to warm up according to the relevant sensor datasheets and the project's validated procedure.
5. Start the hotspot used by the base station for its internet uplink, then connect the base station to the operator laptop over USB.
6. Join the laptop to the rover access point. When the hardware dashboard is added, open `dashboard/dashboard_live.html` in Chrome or Edge, connect the base-station serial port, start the camera feed, and then operate the rover.

Do not use this sequence as a safety procedure for entry into a confined space. Validate wiring, voltage levels, radio configuration, and fail-safe behavior before testing.

## Current Dashboard Structure

The main dashboard files currently committed are:

```text
industrial-safety-rover/
├── public/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── GasMapPanel.tsx
│   │   │   ├── RGBCameraPanel.tsx
│   │   │   ├── SensorPanel.tsx
│   │   │   ├── ThermalPanel.tsx
│   │   │   └── TopNav.tsx
│   │   └── ui/
│   ├── hooks/
│   │   └── useRoverData.ts
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

`src/hooks/useRoverData.ts` is the current source of sample dashboard data. Replace or extend this hook with the real telemetry integration rather than embedding hardware communication logic directly into presentational components.

## Planned Full Repository Layout

The intended repository layout for the complete capstone project is shown below. **Only the React/Vite dashboard portion is currently present on `main`; the hardware, firmware, Apps Script, data, and documentation folders are pending upload.** This is a target layout, not a claim that these files already exist.

```text
industrial-safety-rover/
├── README.md
├── CITATION.cff
├── LICENSE                         # pending department/open-source approval
├── .gitignore
├── firmware/
│   ├── sensing_node/
│   │   ├── sensing_node.ino
│   │   └── secrets.example.h
│   ├── base_station/
│   │   ├── base_station.ino
│   │   └── secrets.example.h
│   ├── drive_node/
│   │   ├── drive_node.ino
│   │   └── secrets.example.h
│   └── camera_node/
│       ├── camera_node.ino
│       ├── app_httpd.cpp
│       ├── camera_pins.h
│       ├── camera_index.h
│       └── secrets.example.h
├── dashboard/
│   ├── dashboard_live.html
│   └── vendor/                      # local CSS and fonts for offline use
├── apps-script/
│   └── Code.gs
├── hardware/
│   ├── schematics/
│   └── bom.csv
├── data/
│   └── bench_run_2026-11-03.csv
├── docs/
│   ├── AAHARR_Capstone_Report.pdf
│   ├── images/
│   └── test_plan.md
├── src/                              # current React dashboard
└── package.json
```

Arduino sketch filenames should match their containing folder names. Keep each actual `secrets.h` local and ignored; commit only a placeholder template after the firmware source is added and its required macros are verified.

## Publication Readiness

The update plan marks the following work as outstanding before treating the repository as a complete public project:

| Task | Status |
|---|---|
| Ignore local `secrets.h` files and firmware build artifacts | Completed in `.gitignore` |
| Add citation metadata | Completed in `CITATION.cff` |
| Rotate rover AP and hotspot passwords; redeploy Apps Script if old credentials were exposed | Pending outside this repository |
| Review all branches and Git history for previously committed credentials | Not verified |
| Upload the renamed firmware sketches and camera support files | Pending |
| Upload the live HTML dashboard and Apps Script source | Pending |
| Upload schematics, BOM, raw bench CSV, photographs, and final report | Pending |
| Complete firmware and live-dashboard fixes from the update plan | Pending |
| Enable GitHub secret scanning and push protection | Pending repository settings review |
| Add an open-source license after department and contributor approval | Pending approval |

The repository's current default-branch files did not return matches for the searched credential indicators (password, `ROVER_AP_PASSWORD`, `APPS_SCRIPT_URL`, and Apps Script deployment URL patterns). This is **not a full secret audit**: current-file search does not establish that credentials are absent from every branch, commit, local copy, or Git history. Do not push firmware from an unreviewed working directory.

Before uploading firmware, rotate any credentials that may have been committed or shared, then move the new values into ignored local `secrets.h` files. A history rewrite may be required if a credential was committed; coordinate it with collaborators and force-push only after confirming that the repository history can safely be rewritten.

## Project Status

| Workstream | Status |
|---|---|
| 4WD rover hardware assembly | Completed in the hardware prototype |
| Wi-Fi drive control with command-timeout stop | Implemented in the hardware prototype |
| ESP32-CAM video streaming | Implemented on the hardware side |
| LoRa telemetry to the base station | Bench-tested; the reference notes report reception at the designed interval |
| Google Sheets logging | Implemented through Google Apps Script |
| React dashboard layout and panels | Implemented as a frontend prototype |
| React dashboard connected to live telemetry | Pending |
| React dashboard connected to live video | Pending |
| Sensor calibration and quantitative validation | Pending |
| Patrol / Sentinel LoRa profile switching | In development in the hardware notes |
| End-to-end validation in a controlled test environment | Pending |

The first bench-run notes dated **3 November 2026** report packet reception at the designed interval and identify issues requiring further work: weak RSSI (about −122 dBm), MQ-channel readings requiring investigation, and a flame-state polarity check.

## Bench Results

The project update notes for the **3 November 2026** bench run report:

| Measure | Reported result |
|---|---|
| LoRa packets received | 9 of 9 packets in the recorded run |
| Mean packet interval | 3.15 seconds |
| RSSI | Approximately −118 to −122 dBm; antenna seating or setup was suspected |
| MQ-135 channel | Clipped at 4095 counts in 3 packets |
| MQ-9 channel | Read 0 in the recorded test |
| Flame input | Flag polarity appeared inverted and requires verification |

The raw export `data/bench_run_2026-11-03.csv` and dashboard capture `docs/images/dashboard_live.png` are referenced in the update plan but are **not present in the current repository**. Add the original, unmodified export and an authentic capture before turning these into downloadable result links.

**Sensor-channel note:** the bench notes mention an MQ-135 channel, while the current hardware description lists MQ-2, MQ-5, MQ-7, and MQ-9 as the implemented array. Confirm whether MQ-135 was part of an earlier bench configuration before treating that reading as a result from the final sensor configuration.

## Estimated Performance

The following values are engineering estimates from the hardware notes, not guaranteed or fully validated field results.

| Metric | Estimate / reference |
|---|---|
| Sensing-deck endurance | Approximately 5 hours; MQ heater load is a major factor |
| Drive-deck endurance | Approximately 1–2 hours |
| Telemetry interval | Approximately 3.1 seconds |
| LoRa range | A few hundred metres to over 1 km depending on obstructions and radio configuration |
| No-load speed at PWM 200 | Approximately 0.13 m/s |

### Patrol / Sentinel mode concept

The hardware roadmap describes two possible LoRa profiles:

| Parameter | Patrol | Sentinel |
|---|---:|---:|
| Use | Rover moving | Rover parked |
| Spreading factor | SF7 | SF10 |
| Telemetry interval | Approximately 3.1 s | 30 s |
| Estimated range | Approximately 0.85 km | Approximately 1.7 km |

This mode switch is still in development and should not be considered an available dashboard feature.

## Known Limitations and Safety

### Sensor limitations

- MQ sensor values are raw ADC counts, not calibrated gas concentrations in ppm.
- MQ sensors are cross-sensitive and can drift with temperature, humidity, age, and operating conditions.
- MQ-9 heater cycling and sensor calibration require further work.
- Gas-sensor thresholds must not be treated as universal safety limits.
- The HC-SR04 reading is advisory; it does not currently provide a validated obstacle-avoidance or braking function.

### Electrical and mechanical limitations

- The rover uses open-loop drive control; wheel-encoder odometry is not yet implemented.
- Voltage-level protection for sensor outputs and the HC-SR04 echo line must be verified before extended operation.
- Battery management and protection require further validation.
- The current hardware is not enclosed or certified for hazardous atmospheres.

### Communication limitations

- Wi-Fi performance can degrade significantly inside metal tanks and other enclosed structures.
- LoRa settings must be checked against local radio regulations before use.
- The base station may miss or delay packets while performing cloud uploads.

### Dashboard limitations

- Current values, logs, map cells, and thermal data are generated locally for UI development.
- The online indicator and camera status are not connected to device health.
- The risk indicator is not a validated safety assessment.
- No live telemetry, live video, or actual thermal sensor feed is consumed by the React app at this stage.

> **Safety disclaimer:** AAHARR is a student research prototype. It is not certified gas-detection equipment, an explosion-protected robot, or a substitute for a confined-space entry program. Never use it to determine that a space is safe to enter. Follow applicable site procedures and use properly calibrated, certified instruments. Do not deploy non-certified electronics into potentially explosive atmospheres.

## Roadmap

- [ ] Complete and test the React-to-base-station telemetry interface.
- [ ] Replace generated sensor values and logs with received telemetry.
- [ ] Integrate the ESP32-CAM MJPEG stream into the React camera panel.
- [ ] Replace the generated thermal view when a supported thermal sensor and data path are available.
- [ ] Connect gas readings to calibrated channel metadata and gas-specific alarm logic.
- [ ] Add packet timestamps, stale-data detection, RSSI/SNR history, and connection diagnostics.
- [ ] Add robust rover drive controls with command timeout and emergency-stop behavior.
- [ ] Add voltage dividers / suitable level protection where required and verify all sensor input levels.
- [ ] Review LoRa frequency and transmit power for regulatory compliance.
- [ ] Add battery management and validate power endurance.
- [ ] Calibrate gas sensors and document repeatable response tests.
- [ ] Add wheel encoders, odometry, obstacle handling, and tilt warnings.
- [ ] Evaluate additional sensors for oxygen deficiency and hydrogen sulphide monitoring.
- [ ] Add LoRa acknowledgements/retries and verify cloud-upload responses.
- [ ] Complete controlled-environment tests for sensor response, radio range, mobility, and fail-safe behavior.

## Budget

The hardware reference records a **proposal estimate of ₹12,545**. Actual procurement costs may vary. Keep the detailed cost-analysis document as the source of truth for component-level pricing.

## Wiring and Schematics

The update plan identifies the following schematic exports for upload:

- `hardware/schematics/power_supply.png`
- `hardware/schematics/sensing_node.png`
- `hardware/schematics/lora_transmitter.png`

The schematic source files and exports are not currently in this repository. Add the EasyEDA source project and matching PDF/PNG exports before linking them as verified wiring references.

## Documentation

The final capstone report is planned at `docs/AAHARR_Capstone_Report.pdf`. It has not yet been uploaded. Publish it only after all report placeholders and incomplete sections have been resolved.

A test plan is also planned at `docs/test_plan.md`; its test cases should include a result field that is completed only after the corresponding test has been run.

## Team

**Group 11 — Electrical & Instrumentation Engineering, 7th Semester**

Ansh Gupta · Anushka Tiwari · Aryaveer Singh · Vedant

**Supervisor:** Dr. Parag Nijhawan, Electrical & Instrumentation Engineering Department, Thapar Institute of Engineering and Technology, Patiala.

## Acknowledgements

- Dr. Parag Nijhawan and the Electrical & Instrumentation Engineering Department, Thapar Institute of Engineering and Technology.
- Espressif Systems for the ESP32-CAM `CameraWebServer` example. Retain the upstream license and copyright notices with any reused or modified camera example source.

## License

No license has been added yet. Confirm that the department and all project contributors approve the intended open-source terms before adding a license file. Until then, do not assume that public visibility grants permission to reuse, modify, or redistribute the project.

## Citation

Citation metadata is provided in [`CITATION.cff`](CITATION.cff). GitHub can use this file to display citation information for the repository.

---

*Keywords: AAHARR, industrial safety rover, confined-space monitoring, gas sensing, ESP32, ESP32-CAM, LoRa, teleoperated rover, React dashboard, Google Sheets*
