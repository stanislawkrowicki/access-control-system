#pragma once

#include <PubSubClient.h>
#include "wifi.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");

    char buffer[length + 1];
    memcpy(buffer, payload, length);

    buffer[length] = '\0';

    Serial.printf("%s\n", buffer);
}

void setupMqtt(PubSubClient &mqttClient)
{
    mqttClient.setKeepAlive(60);
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
}

void connectToMqtt(PubSubClient &mqttClient)
{
    if (mqttClient.connected())
        return;

    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect("ESP32_Client_01"))
    {
        Serial.println("Connected to MQTT");
        mqttClient.subscribe("channel");
    }
    else
    {
        Serial.print("failed, rc=");
        Serial.print(mqttClient.state());
    }
}

void handleMqtt(PubSubClient &mqttClient)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi dropped!");
        connectWifi();
        connectToMqtt(mqttClient);
    }

    if (!mqttClient.connected())
    {
        Serial.println("Lost MQTT connection, reconnecting...");
        delay(1000);
    }

    if (!mqttClient.loop())
    {
        Serial.println("MQTT loop failed!");
    }
}