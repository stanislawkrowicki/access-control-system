#pragma once

#include <stdint.h>
#include <string>

inline uint8_t SECRET_KEY_A[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
inline const char *WIFI_SSID = "YOUR_WIFI_SSID";
inline const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
inline const char *MQTT_SERVER = "192.168.0.1";
inline const uint16_t MQTT_PORT = 1883;
inline const std::string DEVICE_NAME = "esp-device-1";