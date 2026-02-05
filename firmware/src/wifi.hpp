#pragma once

#include <WiFi.h>

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

constexpr uint8_t MAX_CONNECTION_ATTEMPTS = 20;

bool wifiConnected = false;

bool connectWifi()
{

    Serial.println("");
    Serial.print("Connecting to ");
    Serial.println(WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    bool success = false;

    for (uint8_t i = 0; i < MAX_CONNECTION_ATTEMPTS; ++i)
    {
        if (WiFi.status() == WL_CONNECTED)
        {
            success = true;
            break;
        }

        Serial.print(".");
        delay(500);
    }

    Serial.println("");

    wifiConnected = success;

    return success;
}