/*
 * Industrial Safety Rover - ESP32 telemetry sender
 *
 * This sketch implements the network contract used by backend/server.js.
 * Replace the read*() functions with the actual calibrated sensor drivers
 * after wiring the hardware.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* TELEMETRY_URL = "http://YOUR_BACKEND_HOST:8787/api/telemetry";
const char* ROVER_TOKEN = "YOUR_LONG_RANDOM_ROVER_TOKEN";
const char* ROVER_ID = "rover-01";

unsigned long lastSendMs = 0;
constexpr unsigned long TELEMETRY_INTERVAL_MS = 1500;

struct GasReading {
  const char* name;
  float value;
  int raw;
  const char* unit;
  float threshold;
};

// Replace these with real sensor reads and calibrated engineering values.
float readTemperatureC() { return NAN; }
float readHumidityPct() { return NAN; }
float readPressureHpa() { return NAN; }
float readGasResistanceOhm() { return NAN; }
float readBatteryPct() { return NAN; }
float readPositionX() { return 0.0f; }
float readPositionY() { return 0.0f; }
int readMq2Raw() { return -1; }
int readMq5Raw() { return -1; }
int readMq7Raw() { return -1; }
float readCoPpm() { return NAN; }
float readCh4LelPct() { return NAN; }
float readH2sPpm() { return NAN; }
float readO2Pct() { return NAN; }
float readThermalMinC() { return NAN; }
float readThermalMaxC() { return NAN; }
int readCameraFps() { return 0; }

String jsonNumber(float value) {
  if (isnan(value) || isinf(value)) return "null";
  return String(value, 3);
}

unsigned long long unixTimeMs() {
  time_t now;
  time(&now);
  if (now < 1000000000) return 0;
  return static_cast<unsigned long long>(now) * 1000ULL;
}

String buildTelemetryJson() {
  GasReading gases[] = {
    {"CO", readCoPpm(), readMq7Raw(), "ppm", 50.0f},
    {"CH₄", readCh4LelPct(), readMq5Raw(), "%LEL", 5.0f},
    {"H₂S", readH2sPpm(), -1, "ppm", 10.0f},
    {"O₂", readO2Pct(), -1, "%", 19.5f},
  };

  String payload = "{";
  payload += "\"roverId\":\"" + String(ROVER_ID) + "\",";
  payload += "\"timestamp\":" + String(unixTimeMs()) + ",";
  payload += "\"gases\":[";

  for (size_t i = 0; i < 4; ++i) {
    if (i > 0) payload += ",";
    payload += "{\"name\":\"" + String(gases[i].name) + "\",";
    payload += "\"value\":" + jsonNumber(gases[i].value) + ",";
    payload += "\"raw\":" + String(gases[i].raw) + ",";
    payload += "\"unit\":\"" + String(gases[i].unit) + "\",";
    payload += "\"threshold\":" + String(gases[i].threshold, 3) + "}";
  }

  payload += "],";
  payload += "\"temperature\":" + jsonNumber(readTemperatureC()) + ",";
  payload += "\"humidity\":" + jsonNumber(readHumidityPct()) + ",";
  payload += "\"pressure\":" + jsonNumber(readPressureHpa()) + ",";
  payload += "\"gasResistance\":" + jsonNumber(readGasResistanceOhm()) + ",";
  payload += "\"x\":" + jsonNumber(readPositionX()) + ",";
  payload += "\"y\":" + jsonNumber(readPositionY()) + ",";
  payload += "\"battery\":" + jsonNumber(readBatteryPct()) + ",";
  payload += "\"camera\":{\"fps\":" + String(readCameraFps()) + "},";
  payload += "\"thermal\":{\"min\":" + jsonNumber(readThermalMinC()) + ",\"max\":" + jsonNumber(readThermalMaxC()) + ",\"frame\":null},";
  payload += "\"operatingMode\":\"manual\"";
  payload += "}";
  return payload;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // UTC is sufficient because timestamps are stored as Unix milliseconds.
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  HTTPClient http;
  http.begin(TELEMETRY_URL);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-rover-token", ROVER_TOKEN);

  const String payload = buildTelemetryJson();
  const int code = http.POST(payload);
  Serial.printf("Telemetry POST: HTTP %d\n", code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  connectWiFi();
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSendMs >= TELEMETRY_INTERVAL_MS) {
    lastSendMs = now;
    sendTelemetry();
  }
}
