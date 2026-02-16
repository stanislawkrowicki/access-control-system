#include "logger.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

MqttHandler *Logger::mqttHandler = nullptr;
String Logger::deviceName = "";

void Logger::init(MqttHandler &mqtt)
{
    mqttHandler = &mqtt;
    deviceName = DEVICE_NAME.c_str();
}

void Logger::debug(const String &message)
{
    Serial.print("[DEBUG] ");
    Serial.println(message);
}

void Logger::info(const String &message)
{
    Serial.print("[INFO] ");
    Serial.println(message);

    JsonDocument doc;
    doc["message"] = message;

    char payload[256];
    serializeJson(doc, payload);

    String topic = getLogTopic();
    mqttHandler->sendMessage(topic, payload);
}

void Logger::info(const String &topic, const String &payload)
{
    Serial.print("[INFO -> " + topic + "]");
    Serial.println(payload);

    mqttHandler->sendMessage(topic, payload.c_str());
}

void Logger::error(const String &message)
{
    Serial.print("[ERROR] ");
    Serial.println(message);
}

String Logger::getLogTopic()
{
    return "client/" + deviceName + "/log";
}