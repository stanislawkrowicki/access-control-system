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

PubSubClient *mqttClient;
bool connected = false;

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

std::string getAddKeyTopicName()
{
    std::string topic = "private/" + DEVICE_NAME + "/add-key";
    return topic;
}

std::string getRemoveKeyTopicName()
{
    std::string topic = "private/" + DEVICE_NAME + "/remove-key";
    return topic;
}

void logInfo(String message)
{
    JsonDocument doc;

    doc["message"] = message;

    char payload[256];
    serializeJson(doc, payload);

    std::string topic = "client/" + DEVICE_NAME + "/log";

    Serial.println("Publishing info");
    Serial.println(payload);
    Serial.println(topic.c_str());

    if (!mqttClient->connected())
        return;

    bool success = mqttClient->publish(topic.c_str(), payload);

    if (!success)
    {
        Serial.println("[Error] log info publish failed (returned false).");
    }
    else
    {
        Serial.println("[Info] Log info publish success.");
    }
}

void logOpenAttempt(const uint8_t *key, bool success)
{
    // offline mode
    if (!connected)
        return;

    // 16 bytes * 2 chars/byte + 1 null terminator = 33 chars
    char keyHex[33];
    for (int i = 0; i < 16; i++)
    {
        sprintf(&keyHex[i * 2], "%02X", key[i]);
    }

    String message = "Attempted to open the lock";

    JsonDocument doc;

    doc["key"] = keyHex;
    doc["had_access"] = success;
    doc["message"] = message;

    char payload[256];
    serializeJson(doc, payload);

    std::string topic = "client/" + DEVICE_NAME + "/log";

    if (mqttClient->connected())
        mqttClient->publish(topic.c_str(), payload);
}

void subscribeToSyncKeys()
{
    std::string topic = getSyncKeysTopicName();

    Serial.print("Subscribing to MQTT topic ");
    Serial.println(topic.c_str());

    mqttClient->subscribe(topic.c_str());
}

void subscribeToAddAccess()
{
    std::string topic = getAddKeyTopicName();
    Serial.print("Subscribing to MQTT topic ");
    Serial.println(topic.c_str());
    mqttClient->subscribe(topic.c_str());
}

void subscribeToRemoveAccess()
{
    std::string topic = getRemoveKeyTopicName();
    Serial.print("Subscribing to MQTT topic ");
    Serial.println(topic.c_str());
    mqttClient->subscribe(topic.c_str());
}

void handleAddKey(byte *payload, unsigned int length)
{
    if (length != 32)
    {
        Serial.print(F("handleAddKey: Invalid payload length. Expected 32, got: "));
        Serial.println(length);
        return;
    }

    uint8_t newKeyBin[16];
    for (int j = 0; j < 16; j++)
    {
        char highNibbleChar = (char)payload[j * 2];
        char lowNibbleChar = (char)payload[j * 2 + 1];

        newKeyBin[j] = (hexCharToInt(highNibbleChar) << 4) |
                       hexCharToInt(lowNibbleChar);
    }

    int count = persistentStore->getInt("count", 0);
    uint8_t storedKey[16];

    for (int i = 0; i < count; i++)
    {
        persistentStore->getBytes(String(i).c_str(), storedKey, 16);
        if (memcmp(newKeyBin, storedKey, 16) == 0)
        {
            Serial.println(F("handleAddKey: Key already exists. Skipping."));
            return;
        }
    }

    size_t written = persistentStore->putBytes(String(count).c_str(), newKeyBin, 16);

    if (written == 16)
    {
        persistentStore->putInt("count", count + 1);
        Serial.print(F("Added new key at index: "));
        Serial.println(count);
    }
    else
    {
        Serial.println(F("handleAddKey: Failed to write to storage."));
    }
}

void handleRemoveKey(byte *payload, unsigned int length)
{
    if (length != 32)
    {
        Serial.print(F("handleRemoveKey: Invalid payload length. Expected 32, got: "));
        Serial.println(length);
        return;
    }

    uint8_t targetKey[16];
    for (int j = 0; j < 16; j++)
    {
        char highNibbleChar = (char)payload[j * 2];
        char lowNibbleChar = (char)payload[j * 2 + 1];

        targetKey[j] = (hexCharToInt(highNibbleChar) << 4) |
                       hexCharToInt(lowNibbleChar);
    }

    int count = persistentStore->getInt("count", 0);
    int foundIndex = -1;
    uint8_t tempKey[16];

    for (int i = 0; i < count; i++)
    {
        persistentStore->getBytes(String(i).c_str(), tempKey, 16);
        if (memcmp(tempKey, targetKey, 16) == 0)
        {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex == -1)
    {
        Serial.println(F("handleRemoveKey: Key not found."));
        return;
    }

    int lastIndex = count - 1;

    // To avoid reordering the keys, we put the last one in place of the deleted one
    if (foundIndex != lastIndex)
    {
        uint8_t lastKey[16];
        persistentStore->getBytes(String(lastIndex).c_str(), lastKey, 16);

        persistentStore->putBytes(String(foundIndex).c_str(), lastKey, 16);
        Serial.print(F("Moved key from index "));
        Serial.print(lastIndex);
        Serial.print(F(" to "));
        Serial.println(foundIndex);
    }

    persistentStore->remove(String(lastIndex).c_str());

    persistentStore->putInt("count", lastIndex);
    Serial.println(F("Key removed successfully."));
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

void sendDiscoveryRequest()
{
    mqttClient->publish("discovery", DEVICE_NAME.c_str());
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
    else if (topic == getAddKeyTopicName())
    {
        handleAddKey(payload, length);
    }
    else if (topic == getRemoveKeyTopicName())
    {
        handleRemoveKey(payload, length);
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

void setupMqtt(WiFiClient &wifiClient, Preferences &persistence)
{
    mqttClient = new PubSubClient(wifiClient);

    mqttClient->setKeepAlive(60);
    mqttClient->setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient->setCallback(mqttCallback);

    persistentStore = &persistence;
}

void connectToMqtt()
{
    if (mqttClient->connected())
        return;

    Serial.print("Attempting MQTT connection...");
    if (mqttClient->connect(DEVICE_NAME.c_str()))
    {
        Serial.println("Connected to MQTT");
        subscribeToSyncKeys();
        subscribeToAddAccess();
        subscribeToRemoveAccess();
        sendDiscoveryRequest();
        logInfo("Device connected to the network");
        connected = true;
        digitalWrite(WIFI_FAIL_PIN, LOW);
    }
    else
    {
        Serial.print("failed, rc=");
        Serial.print(mqttClient->state());
    }
}

void handleMqtt()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi dropped!");
        connectWifi();
        connectToMqtt();
        digitalWrite(WIFI_FAIL_PIN, HIGH);
    }

    if (!mqttClient->connected())
    {
        Serial.println("Lost MQTT connection, reconnecting...");
        digitalWrite(WIFI_FAIL_PIN, HIGH);
        delay(1000);
    }

    if (!mqttClient->loop())
    {
        Serial.println("MQTT loop failed!");
        Serial.print("Error code: ");
        Serial.println(mqttClient->state());
    }
}
