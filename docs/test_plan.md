# AHARR Hardware and Integration Test Plan

Test results must be recorded only after the corresponding test is performed on the physical prototype. Run gas-response tests only in a controlled, approved test setup; never use this rover to certify a confined space as safe.

| ID | Test | Procedure / acceptance evidence | Result | Date / notes |
|---|---|---|---|---|
| T01 | Power rails | Measure regulated 5 V rails on both decks under load; record minimum/maximum voltage | Pending | |
| T02 | ESP32 input protection | Verify measured divider ratios and maximum output voltage on every MQ analog line and HC-SR04 ECHO; confirm no ESP32 input can exceed its permitted voltage | Pending | |
| T03 | MQ sensor startup / wiring | Record warm-up time and stable raw ADC baselines for MQ-2 (GPIO34), MQ-5 (GPIO35), MQ-9 (GPIO32), and MQ-135 (GPIO33); specifically investigate the prior MQ-9 zero readings | Pending | |
| T04 | MQ response | Apply controlled test gas under approved lab supervision; record raw counts and recovery behavior | Pending | |
| T05 | Flame input polarity | Record digital input with no flame and with a controlled flame source; confirm firmware polarity | Pending | |
| T06 | DHT22 | Compare temperature/humidity readings with a reference instrument | Pending | |
| T07 | MPU6050 startup calibration | Keep rover stationary through the 100-sample gyro bias calibration; verify near-zero stationary gyro | Pending | |
| T08 | Ultrasonic distance | Compare HC-SR04 output with measured distances over a documented range | Pending | |
| T09 | LoRa packet integrity | Run both LoRa nodes at the selected compliant frequency/power; record received/expected packets, interval, RSSI and SNR | Pending | |
| T10 | LoRa antenna setup | Verify antennas are connected and suitable for the selected frequency before range testing | Pending | |
| T11 | Google Sheets logging | Verify Apps Script response JSON reports `status: success` and row appears in Sheet1 | Pending | |
| T12 | USB dashboard telemetry | Connect Node 2 at 115200 baud; confirm each `AHARR:` JSON line updates the matching fields | Pending | |
| T13 | No-packet indication | Stop the sensing node; confirm the dashboard marks telemetry stale after 15 seconds | Pending | |
| T14 | Camera stream | Join ESP32-CAM to `ESP32_CAR`; verify MJPEG at `http://192.168.4.2:81/stream` | Pending | |
| T15 | Drive controls | Verify forward/reverse/left/right/stop and keyboard commands at safe low speed | Pending | |
| T16 | Drive fail-safe | Stop sending movement commands; verify the drive node stops within the firmware timeout (500 ms) | Pending | |
| T17 | Browser focus loss | Move rover, switch browser tab/blur window; confirm dashboard sends stop | Pending | |
| T18 | Endurance | Record sensing and drive battery endurance separately under documented loads | Pending | |
| T19 | Enclosed-space radio behavior | Evaluate Wi-Fi and LoRa performance only in an approved test environment; document link losses | Pending | |
| T20 | Browser-to-drive origin policy | Serve the console from `http://localhost:8000`; confirm drive commands work from that origin and requests from an unrelated web origin are rejected | Pending | |
| T21 | Cloud upload / receive timing | Record HTTP upload duration and compare expected vs received LoRa packets during repeated Sheet writes | Pending | |

## Reference bench run (3 November 2026)

The update notes report 9/9 packets received at a mean interval of 3.15 s, RSSI between approximately −118 and −122 dBm, MQ-135 clipping at 4095 counts for three packets, MQ-9 readings of zero, and a flame-flag polarity issue. The raw CSV was not provided with the source archive, so these reported values are not independently recalculated here.
