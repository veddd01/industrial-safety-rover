#include "esp_camera.h"
#include <WiFi.h>
#include "secrets.h"
#include "camera_pins.h"

const char* ssid = ROVER_AP_SSID;
const char* password = ROVER_AP_PASSWORD;
void startCameraServer();

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\nAHARR ESP32-CAM boot");

  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_RGB565;
  config.frame_size = FRAMESIZE_240X240;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  const esp_err_t cameraError = esp_camera_init(&config);
  if (cameraError != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", cameraError);
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  IPAddress cameraIP(192, 168, 4, 2);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  if (!WiFi.config(cameraIP, gateway, subnet)) {
    Serial.println("Warning: camera static IP configuration failed");
  }
  WiFi.begin(ssid, password);

  Serial.print("Connecting to rover AP");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nCamera joined AP at %s\n", WiFi.localIP().toString().c_str());
  startCameraServer();
  Serial.println("Camera stream: http://192.168.4.2:81/stream");
}

void loop() {
  delay(10000);
}
