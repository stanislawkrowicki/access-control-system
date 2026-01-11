#include <Wire.h>
#include <SPI.h>
#include <Adafruit_PN532.h>
#include <WiFi.h>
#include <PubSubClient.h>

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setupWifi()
{
  constexpr uint8_t MAX_ATTEMPTS = 20;

  Serial.println("");
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  bool success = false;

  for (uint8_t i = 0; i < MAX_ATTEMPTS; ++i)
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

  if (success)
  {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println("Failed to connect to WiFi. Device will use stored access keys until reboot.");
  }
}

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

void setupMqtt()
{
  mqttClient.setKeepAlive(60);
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void connectToMqtt()
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

void setup(void)
{
  Serial.begin(115200);

  while (!Serial)
    ;

  pinMode(BUZZER_PIN, OUTPUT);

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata)
  {
    Serial.print("Failed to connect to PN532");
    while (true)
      ;
  }

  setupWifi();
  setupMqtt();
  connectToMqtt();

  Serial.println("");
  Serial.println("Ready to receive NFC");
}

void loop(void)
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi dropped!");
    setupWifi();
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

  return;

  uint8_t success;
  uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
  uint8_t uidLength;

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success)
  {
    digitalWrite(BUZZER_PIN, HIGH);

    Serial.print("Found NFC tag. UID Value: ");
    nfc.PrintHex(uid, uidLength);
    Serial.println("");

    if (uidLength == 4)
    {
      success = nfc.mifareclassic_AuthenticateBlock(uid, uidLength, 4, 0, SECRET_KEY_A);

      if (success)
      {
        Serial.println("Sector 1 (Blocks 4..7) has been authenticated");
        uint8_t data[16];

        success = nfc.mifareclassic_ReadDataBlock(4, data);

        if (success)
        {
          Serial.println("Reading Block 4:");
          nfc.PrintHexChar(data, 16);
          Serial.println("");

          delay(1000);
        }
        else
        {
          Serial.println("Ooops ... unable to read the requested block.  Try another key?");
        }
      }
      else
      {
        Serial.println("Ooops ... authentication failed: Try another key?");
      }

      digitalWrite(BUZZER_PIN, LOW);
    }

    else
    {
      Serial.println("Unknown tag type!");
    }
  }
}
