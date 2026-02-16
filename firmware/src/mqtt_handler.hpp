#pragma once

#include <WiFi.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <string>

class MqttHandler
{
public:
    MqttHandler(WiFiClient &wifiClient, Preferences &keyStorage);

    void begin();
    void loop();

    void sendMessage(std::string topic, const char *payload);
    void sendMessage(String topic, const char *payload);

private:
    WiFiClient &wifiClient;
    PubSubClient mqttClient;
    Preferences &keyStorage;
    String deviceName;

    std::string getTopic(const char *subtopic);

    void connect();
    void subscribeAll();
    void sendDiscovery();

    void router(char *topic, byte *payload, unsigned int length);
    void handleSyncKeys(byte *payload, unsigned int length);
    void handleAddKey(byte *payload, unsigned int length);
    void handleRemoveKey(byte *payload, unsigned int length);

    uint8_t hexCharToInt(char c);

    static MqttHandler *_instance;
    static void onMessage(char *topic, byte *payload, unsigned int length);
};