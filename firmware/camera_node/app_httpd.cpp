// AAHARR camera HTTP server for the AI-Thinker ESP32-CAM.
// MJPEG uses the multipart frame pattern demonstrated by Espressif's camera examples.
// Retain Espressif source notices if any upstream example code is incorporated.
#include "esp_http_server.h"
#include "esp_camera.h"
#include "img_converters.h"
#include <Arduino.h>
#include <stdlib.h>
#include <stdio.h>

static httpd_handle_t camera_httpd = nullptr;
static httpd_handle_t stream_httpd = nullptr;
static const char* BOUNDARY = "aaHarrFrameBoundary";

static esp_err_t root_handler(httpd_req_t* req) {
  httpd_resp_set_type(req, "text/plain; charset=utf-8");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  const char* message = "AAHARR ESP32-CAM online. MJPEG: port 81 /stream; still: port 80 /capture";
  return httpd_resp_send(req, message, HTTPD_RESP_USE_STRLEN);
}

static esp_err_t capture_handler(httpd_req_t* req) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) return httpd_resp_send_500(req);

  uint8_t* jpg = nullptr;
  size_t jpg_len = 0;
  const bool converted = fb->format != PIXFORMAT_JPEG;
  if (converted) {
    if (!frame2jpg(fb, 80, &jpg, &jpg_len)) {
      esp_camera_fb_return(fb);
      return httpd_resp_send_500(req);
    }
  } else {
    jpg = fb->buf;
    jpg_len = fb->len;
  }

  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  const esp_err_t result = httpd_resp_send(req, reinterpret_cast<const char*>(jpg), jpg_len);
  if (converted) free(jpg);
  esp_camera_fb_return(fb);
  return result;
}

static esp_err_t stream_handler(httpd_req_t* req) {
  httpd_resp_set_type(req, "multipart/x-mixed-replace;boundary=aaHarrFrameBoundary");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store, no-cache, must-revalidate");

  while (true) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) return ESP_FAIL;

    uint8_t* jpg = nullptr;
    size_t jpg_len = 0;
    const bool converted = fb->format != PIXFORMAT_JPEG;
    if (converted) {
      if (!frame2jpg(fb, 80, &jpg, &jpg_len)) {
        esp_camera_fb_return(fb);
        return ESP_FAIL;
      }
    } else {
      jpg = fb->buf;
      jpg_len = fb->len;
    }

    char part_header[128];
    const int header_len = snprintf(part_header, sizeof(part_header),
      "--%s\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n",
      BOUNDARY, static_cast<unsigned>(jpg_len));

    esp_err_t result = httpd_resp_send_chunk(req, part_header, header_len);
    if (result == ESP_OK) {
      result = httpd_resp_send_chunk(req, reinterpret_cast<const char*>(jpg), jpg_len);
    }
    if (result == ESP_OK) result = httpd_resp_send_chunk(req, "\r\n", 2);

    if (converted) free(jpg);
    esp_camera_fb_return(fb);
    if (result != ESP_OK) return result;
    vTaskDelay(1);
  }
}

void startCameraServer() {
  httpd_config_t stillConfig = HTTPD_DEFAULT_CONFIG();
  stillConfig.server_port = 80;
  stillConfig.max_uri_handlers = 4;
  httpd_uri_t rootUri = { .uri = "/", .method = HTTP_GET, .handler = root_handler, .user_ctx = nullptr };
  httpd_uri_t captureUri = { .uri = "/capture", .method = HTTP_GET, .handler = capture_handler, .user_ctx = nullptr };
  if (httpd_start(&camera_httpd, &stillConfig) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &rootUri);
    httpd_register_uri_handler(camera_httpd, &captureUri);
  }

  httpd_config_t streamConfig = HTTPD_DEFAULT_CONFIG();
  streamConfig.server_port = 81;
  streamConfig.ctrl_port = 32769;
  streamConfig.max_uri_handlers = 2;
  httpd_uri_t streamUri = { .uri = "/stream", .method = HTTP_GET, .handler = stream_handler, .user_ctx = nullptr };
  if (httpd_start(&stream_httpd, &streamConfig) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &streamUri);
  }
}
