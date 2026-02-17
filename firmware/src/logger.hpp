#pragma once

#include <Arduino.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "mqtt_handler.hpp"

class Logger
{
public:
    static void init(MqttHandler &mqtt);

    // Logs to Serial only
    static void debug(const String &message);

    // Logs to Serial and MQTT
    static void info(const String &message);
    static void info(const String &topic, const String &payload);
    static void info(const JsonDocument &json);

    // Logs to Serial
    // TODO: Implement error logs server-side
    static void error(const String &message);

private:
    static MqttHandler *mqttHandler;
    static String deviceName;

    static String getLogTopic();
};