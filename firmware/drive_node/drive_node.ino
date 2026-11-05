#include <WiFi.h>
#include <WebServer.h>
#include "secrets.h"

const char* ssid = ROVER_AP_SSID;
const char* password = ROVER_AP_PASSWORD;
WebServer server(80);

#define IN1 26
#define IN2 27
#define ENA 33
#define IN3 14
#define IN4 25
#define ENB 32
#define LIGHT_PIN 4

int motorSpeed = 200;
bool lightState = false;
unsigned long lastMoveCommand = 0;
constexpr unsigned long FAILSAFE_TIME_MS = 500;

void stopCar() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
  analogWrite(ENA, 0); analogWrite(ENB, 0);
  lastMoveCommand = millis();
}

void moveForward() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  analogWrite(ENA, motorSpeed); analogWrite(ENB, motorSpeed);
  lastMoveCommand = millis();
}

void moveBackward() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
  analogWrite(ENA, motorSpeed); analogWrite(ENB, motorSpeed);
  lastMoveCommand = millis();
}

void moveLeft() {
  // Turn direction is matched to the assembled motor wiring.
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
  analogWrite(ENA, motorSpeed); analogWrite(ENB, motorSpeed);
  lastMoveCommand = millis();
}

void moveRight() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  analogWrite(ENA, motorSpeed); analogWrite(ENB, motorSpeed);
  lastMoveCommand = millis();
}

bool isDashboardOriginAllowed() {
  const String origin = server.header("Origin");
  // The documented dashboard is served from localhost:8000.
  // Requests without an Origin header (for example, direct local diagnostics) are allowed.
  return origin.length() == 0 ||
         origin == "http://localhost:8000" ||
         origin == "http://127.0.0.1:8000";
}

bool rejectUntrustedOrigin() {
  if (isDashboardOriginAllowed()) return false;
  server.send(403, "text/plain; charset=utf-8", "Origin not allowed");
  return true;
}

void sendCorsHeaders() {
  const String origin = server.header("Origin");
  if (origin.length() > 0 && isDashboardOriginAllowed()) {
    server.sendHeader("Access-Control-Allow-Origin", origin);
    server.sendHeader("Vary", "Origin");
    // Required by browsers that preflight requests from localhost to the rover's private IP.
    server.sendHeader("Access-Control-Allow-Private-Network", "true");
  }
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendText(int code, const String& body) {
  sendCorsHeaders();
  server.send(code, "text/plain; charset=utf-8", body);
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(LIGHT_PIN, LOW);
  stopCar();

  WiFi.mode(WIFI_AP);
  IPAddress apIP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, gateway, subnet);
  if (!WiFi.softAP(ssid, password)) {
    Serial.println("Rover access point failed to start");
  }
  Serial.print("Rover AP IP: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("The AP password is intentionally not printed.");

  const char* requestHeaders[] = {"Origin"};
  server.collectHeaders(requestHeaders, 1);

  server.on("/", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    sendText(200, "AHARR drive node online");
  });
  server.on("/forward", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    moveForward(); sendText(200, "FORWARD");
  });
  server.on("/backward", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    moveBackward(); sendText(200, "BACKWARD");
  });
  server.on("/left", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    moveLeft(); sendText(200, "LEFT");
  });
  server.on("/right", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    moveRight(); sendText(200, "RIGHT");
  });
  server.on("/stop", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    stopCar(); sendText(200, "STOP");
  });
  server.on("/speed", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    if (server.hasArg("value")) motorSpeed = constrain(server.arg("value").toInt(), 0, 255);
    sendText(200, String("SPEED ") + motorSpeed);
  });
  server.on("/light", HTTP_GET, []() {
    if (rejectUntrustedOrigin()) return;
    lightState = !lightState;
    digitalWrite(LIGHT_PIN, lightState ? HIGH : LOW);
    sendText(200, lightState ? "LIGHT ON" : "LIGHT OFF");
  });
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      if (rejectUntrustedOrigin()) return;
      sendCorsHeaders();
      server.send(204, "text/plain", "");
      return;
    }
    if (rejectUntrustedOrigin()) return;
    sendText(404, "Unknown drive command");
  });
  server.begin();
  lastMoveCommand = millis();
  Serial.println("Drive web server ready");
}

void loop() {
  server.handleClient();
  if (millis() - lastMoveCommand > FAILSAFE_TIME_MS) stopCar();
}
