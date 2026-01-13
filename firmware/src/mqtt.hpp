#pragma once

#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "wifi.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

static Preferences *persistentStore = nullptr;

uint8_t hexCharToInt(char c)
{
    if (c >= '0' && c <= '9')
        return c - '0';
    if (c >= 'a' && c <= 'f')
        return c - 'a' + 10;
    if (c >= 'A' && c <= 'F')
        return c - 'A' + 10;
    return 0;
}

std::string getSyncKeysTopicName()
{
    std::string topic = "private/" + DEVICE_NAME + "/sync-keys";
    return topic;
}

void subscribeToSyncKeys(PubSubClient &mqttClient)
{
    std::string topic = getSyncKeysTopicName();

    Serial.print("Subscribing to MQTT topic ");
    Serial.println(topic.c_str());

    mqttClient.subscribe(topic.c_str());
}

void handleSyncKeys(byte *payload, unsigned int length)
{
    char buffer[length] = {};
    memcpy(buffer, payload, length);

    JsonDocument doc;

    DeserializationError error = deserializeJson(doc, buffer, length);

    if (error)
    {
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.c_str());
        return;
    }

    if (doc.is<JsonArray>())
    {
        JsonArray array = doc.as<JsonArray>();

        Serial.print("Received ");
        Serial.print(array.size());
        Serial.println(" keys.");

        if (array.size() == 0)
            return;

        int i = 0;

        for (JsonVariant v : array)
        {
            const char *keyPayload = v.as<const char *>();

            if (!keyPayload)
                return;

            if (strlen(keyPayload) != 32)
            {
                Serial.println("Received key of size different than 16 bytes! Actual size: " + String(strlen(keyPayload)));
                continue;
            }

            uint8_t binaryKey[16];

            for (int j = 0; j < 16; j++)
            {
                binaryKey[j] = (hexCharToInt(keyPayload[j * 2]) << 4) |
                               hexCharToInt(keyPayload[j * 2 + 1]);
            }

            Serial.print("Authorized Key: ");
            Serial.println(keyPayload);

            persistentStore->putBytes(String(i).c_str(), binaryKey, 16);
            i++;
        }

        persistentStore->putInt("count", i);
    }
}

void sendDiscoveryRequest(PubSubClient &mqttClient)
{
    mqttClient.publish("discovery", DEVICE_NAME.c_str());
}

void mqttCallback(char *topicPtr, byte *payload, unsigned int length)
{
    std::string topic(topicPtr);

    Serial.print("Received message on topic: ");
    Serial.println(topicPtr);

    if (topic == getSyncKeysTopicName())
    {
        handleSyncKeys(payload, length);
    }
    else
    {
        Serial.print("Message arrived [");
        Serial.print(topic.c_str());
        Serial.print("] ");

        char buffer[length + 1];
        memcpy(buffer, payload, length);

        buffer[length] = '\0';

        Serial.printf("%s\n", buffer);
    }
}

void setupMqtt(PubSubClient &mqttClient, Preferences &persistence)
{
    mqttClient.setKeepAlive(60);
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);

    persistentStore = &persistence;
}

void connectToMqtt(PubSubClient &mqttClient)
{
    if (mqttClient.connected())
        return;

    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect(DEVICE_NAME.c_str()))
    {
        Serial.println("Connected to MQTT");
        subscribeToSyncKeys(mqttClient);
        sendDiscoveryRequest(mqttClient);
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
