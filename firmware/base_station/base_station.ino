#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <LoRa.h>
#include "secrets.h"

// Wi-Fi uplink and Apps Script URL are supplied by the ignored local secrets.h.
const char* WIFI_SSID = UPLINK_SSID;
const char* WIFI_PASSWORD = UPLINK_PASSWORD;
const char* GOOGLE_SCRIPT_URL = APPS_SCRIPT_URL;

#define LORA_SCK   18
#define LORA_MISO  19
#define LORA_MOSI  23
#define LORA_SS     5
#define LORA_RST   14
#define LORA_DIO0   2

// This packed packet definition must remain identical to sensing_node.ino.
struct __attribute__((packed)) SensorPacket {
  uint16_t magic;
  uint8_t source;
  uint8_t destination;
  uint16_t packetID;
  uint8_t ttl;
  int32_t mq2;
  int32_t mq5;
  int32_t mq9;
  int32_t mq135;
  uint8_t fire;
  float distance;
  float temperature;
  float humidity;
  float ax;
  float ay;
  float az;
  float gx;
  float gy;
  float gz;
};

void connectWiFi() {
  Serial.println();
  Serial.println("Connecting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int count = 0;
  while (WiFi.status() != WL_CONNECTED && count < 40) {
    delay(500);
    Serial.print(".");
    count++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WIFI CONNECTED");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WIFI FAILED - USB telemetry remains available");
  }
}

void sendToGoogleSheets(SensorPacket &packet, int rssi, float snr) {
  String json = "{";
  json += "\"source\":" + String(packet.source) + ",";
  json += "\"destination\":" + String(packet.destination) + ",";
  json += "\"packetID\":" + String(packet.packetID) + ",";
  json += "\"ttl\":" + String(packet.ttl) + ",";
  json += "\"mq2\":" + String(packet.mq2) + ",";
  json += "\"mq5\":" + String(packet.mq5) + ",";
  json += "\"mq9\":" + String(packet.mq9) + ",";
  json += "\"mq135\":" + String(packet.mq135) + ",";
  json += "\"fire\":" + String(packet.fire) + ",";
  json += "\"distance\":" + String(packet.distance, 2) + ",";
  json += "\"temperature\":" + String(packet.temperature, 2) + ",";
  json += "\"humidity\":" + String(packet.humidity, 2) + ",";
  json += "\"ax\":" + String(packet.ax, 3) + ",";
  json += "\"ay\":" + String(packet.ay, 3) + ",";
  json += "\"az\":" + String(packet.az, 3) + ",";
  json += "\"gx\":" + String(packet.gx, 3) + ",";
  json += "\"gy\":" + String(packet.gy, 3) + ",";
  json += "\"gz\":" + String(packet.gz, 3) + ",";
  json += "\"rssi\":" + String(rssi) + ",";
  json += "\"snr\":" + String(snr, 2);
  json += "}";

  // Web Serial dashboard consumes one JSON object per AAHARR-prefixed line.
  Serial.print("AAHARR:");
  Serial.println(json);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WIFI NOT CONNECTED - packet sent to USB dashboard only");
    return;
  }

  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setRedirectLimit(5);
  http.setTimeout(2500);
  http.begin(GOOGLE_SCRIPT_URL);
  http.addHeader("Content-Type", "application/json");

  const int httpCode = http.POST(json);
  Serial.print("HTTP CODE: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    const String response = http.getString();
    Serial.print("GOOGLE RESPONSE: ");
    Serial.println(response);

    const bool appScriptSuccess = response.indexOf("\"status\":\"success\"") >= 0;
    if (httpCode == 200 && appScriptSuccess) {
      Serial.println("GOOGLE SHEETS: SUCCESS");
    } else {
      Serial.println("GOOGLE SHEETS: APPLICATION ERROR OR UNEXPECTED RESPONSE");
    }
  } else {
    Serial.print("HTTP ERROR: ");
    Serial.println(http.errorToString(httpCode));
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println();
  Serial.println("======================================");
  Serial.println("     AAHARR NODE 2 - BASE STATION");
  Serial.println("======================================");

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  Serial.println("Starting LoRa...");

  if (!LoRa.begin(433.5E6)) {
    Serial.println("LORA FAILED!");
    while (true) delay(1000);
  }

  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.setTxPower(10);

  Serial.print("Packet structure size: ");
  Serial.println(sizeof(SensorPacket));

  connectWiFi();
  LoRa.receive();
  Serial.println("NODE 2 READY - WAITING FOR NODE 1...");
}

void loop() {
  const int packetSize = LoRa.parsePacket();
  if (packetSize > 0) {
    Serial.println();
    Serial.println("--------------------------------------");
    Serial.print("RECEIVED PACKET SIZE: ");
    Serial.println(packetSize);

    if (packetSize != sizeof(SensorPacket)) {
      Serial.println("ERROR: WRONG PACKET SIZE - packet ignored");
      while (LoRa.available()) LoRa.read();
      LoRa.receive();
      return;
    }

    SensorPacket packet;
    const int bytesRead = LoRa.readBytes(reinterpret_cast<uint8_t*>(&packet), sizeof(SensorPacket));
    if (bytesRead != sizeof(SensorPacket) || packet.magic != 0xABCD) {
      Serial.println("ERROR: INVALID PACKET - packet ignored");
      LoRa.receive();
      return;
    }

    const int rssi = LoRa.packetRssi();
    const float snr = LoRa.packetSnr();

    Serial.print("Packet ID: "); Serial.println(packet.packetID);
    Serial.print("MQ-2: "); Serial.println(packet.mq2);
    Serial.print("MQ-5: "); Serial.println(packet.mq5);
    Serial.print("MQ-9: "); Serial.println(packet.mq9);
    Serial.print("MQ-135: "); Serial.println(packet.mq135);
    Serial.print("Flame flag: "); Serial.println(packet.fire);
    Serial.print("Distance: "); Serial.println(packet.distance);
    Serial.print("Temperature: "); Serial.println(packet.temperature);
    Serial.print("Humidity: "); Serial.println(packet.humidity);
    Serial.print("RSSI: "); Serial.println(rssi);
    Serial.print("SNR: "); Serial.println(snr);

    sendToGoogleSheets(packet, rssi, snr);
    LoRa.receive();
  }
  delay(10);
}
