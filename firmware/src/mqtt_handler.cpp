#include "mqtt_handler.hpp"
#include "logger.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

MqttHandler *MqttHandler::_instance = nullptr;

MqttHandler::MqttHandler(WiFiClient &wifiClient, Preferences &keyStorage)
    : wifiClient(wifiClient),
      mqttClient(wifiClient),
      keyStorage(keyStorage),
      deviceName(DEVICE_NAME.c_str())
{
    _instance = this;
}

void MqttHandler::begin()
{
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(MqttHandler::onMessage);
    mqttClient.setKeepAlive(60);
}

void MqttHandler::onMessage(char *topic, byte *payload, unsigned int length)
{
    if (_instance)
    {
        _instance->router(topic, payload, length);
    }
}

void MqttHandler::loop()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Logger::debug("WiFi lost in MqttHandler loop...");
        delay(150);
        return;
    }

    if (!mqttClient.connected())
    {
        connect();
    }

    mqttClient.loop();
}

void MqttHandler::sendMessage(std::string topic, const char *payload)
{
    mqttClient.publish(topic.c_str(), payload);
}

void MqttHandler::sendMessage(String topic, const char *payload)
{
    mqttClient.publish(topic.c_str(), payload);
}

void MqttHandler::connect()
{
    Logger::debug("Attempting MQTT connection...");

    if (mqttClient.connect(deviceName.c_str()))
    {
        Logger::debug("Connected to MQTT");

        subscribeAll();
        sendDiscovery();
        Logger::info("Device connected to network");
    }
    else
    {
        String err = "MQTT failed, rc=" + String(mqttClient.state()) + " try again in 5s";
        Logger::error(err);
        delay(5000);
    }
}

void MqttHandler::subscribeAll()
{
    const std::string topics[] = {getTopic("sync-keys"), getTopic("add-key"), getTopic("remove-key")};

    for (const auto topic : topics)
    {
        Logger::debug("Subscribing to " + String(topic.c_str()));
        mqttClient.subscribe(topic.c_str());
    }
}

void MqttHandler::sendDiscovery()
{
    mqttClient.publish("discovery", deviceName.c_str());
}

void MqttHandler::router(char *topicPtr, byte *payload, unsigned int length)
{
    std::string topic(topicPtr);
    std::string syncTopic = getTopic("sync-keys");
    std::string addTopic = getTopic("add-key");
    std::string removeTopic = getTopic("remove-key");

    if (topic == syncTopic)
    {
        handleSyncKeys(payload, length);
    }
    else if (topic == addTopic)
    {
        handleAddKey(payload, length);
    }
    else if (topic == removeTopic)
    {
        handleRemoveKey(payload, length);
    }
    else
    {
        char buffer[length + 1];
        memcpy(buffer, payload, length);
        buffer[length] = '\0';
        Logger::info("Unknown Topic: " + String(topicPtr));
    }
}

void MqttHandler::handleSyncKeys(byte *payload, unsigned int length)
{
    std::vector<char> buffer(length);
    memcpy(buffer.data(), payload, length);

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, buffer.data(), length);

    if (error)
    {
        Logger::error("deserializeJson() failed: " + String(error.c_str()));
        return;
    }

    if (doc.is<JsonArray>())
    {
        JsonArray array = doc.as<JsonArray>();

        Logger::debug("Syncing " + String(array.size()) + " keys");

        int i = 0;
        for (JsonVariant v : array)
        {
            const char *keyPayload = v.as<const char *>();
            if (!keyPayload || strlen(keyPayload) != 32)
                continue;

            uint8_t binaryKey[16];
            for (int j = 0; j < 16; j++)
            {
                binaryKey[j] = (hexCharToInt(keyPayload[j * 2]) << 4) |
                               hexCharToInt(keyPayload[j * 2 + 1]);
            }
            keyStorage.putBytes(String(i).c_str(), binaryKey, 16);
            i++;
        }
        keyStorage.putInt("count", i);
    }
}

void MqttHandler::handleAddKey(byte *payload, unsigned int length)
{
    if (length != 32)
    {
        Logger::error("handleAddKey: Invalid payload length");
        return;
    }

    uint8_t newKeyBin[16];
    for (int j = 0; j < 16; j++)
    {
        newKeyBin[j] = (hexCharToInt(payload[j * 2]) << 4) | hexCharToInt(payload[j * 2 + 1]);
    }

    int count = keyStorage.getInt("count", 0);
    uint8_t storedKey[16];

    for (int i = 0; i < count; i++)
    {
        keyStorage.getBytes(String(i).c_str(), storedKey, 16);
        if (memcmp(newKeyBin, storedKey, 16) == 0)
        {
            Logger::debug("handleAddKey: Key already exists. Skipping.");
            return;
        }
    }

    size_t written = keyStorage.putBytes(String(count).c_str(), newKeyBin, 16);
    if (written == 16)
    {
        keyStorage.putInt("count", count + 1);
        Logger::debug("Added new key at index " + String(count));
    }
    else
    {
        Logger::error("handleAddKey: Failed to write.");
    }
}

void MqttHandler::handleRemoveKey(byte *payload, unsigned int length)
{
    if (length != 32)
    {
        Logger::error("handleRemoveKey: Invalid payload length.");
        return;
    }

    uint8_t targetKey[16];
    for (int j = 0; j < 16; j++)
    {
        targetKey[j] = (hexCharToInt(payload[j * 2]) << 4) | hexCharToInt(payload[j * 2 + 1]);
    }

    int count = keyStorage.getInt("count", 0);
    int foundIndex = -1;
    uint8_t tempKey[16];

    for (int i = 0; i < count; i++)
    {
        keyStorage.getBytes(String(i).c_str(), tempKey, 16);
        if (memcmp(tempKey, targetKey, 16) == 0)
        {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex == -1)
    {
        Logger::error("handleRemoveKey: Key not found.");
        return;
    }

    int lastIndex = count - 1;
    if (foundIndex != lastIndex)
    {
        uint8_t lastKey[16];
        keyStorage.getBytes(String(lastIndex).c_str(), lastKey, 16);
        keyStorage.putBytes(String(foundIndex).c_str(), lastKey, 16);
        Logger::debug("Moved key from " + String(lastIndex) + " to " + String(foundIndex));
    }

    keyStorage.remove(String(lastIndex).c_str());
    keyStorage.putInt("count", lastIndex);
    Logger::debug("Key removed.");
}

uint8_t MqttHandler::hexCharToInt(char c)
{
    if (c >= '0' && c <= '9')
        return c - '0';
    if (c >= 'a' && c <= 'f')
        return c - 'a' + 10;
    if (c >= 'A' && c <= 'F')
        return c - 'A' + 10;
    return 0;
}

std::string MqttHandler::getTopic(const char *subtopic)
{
    return "private/" + std::string(deviceName.c_str()) + "/" + subtopic;
}
