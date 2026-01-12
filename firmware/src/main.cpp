#include <Wire.h>
#include <SPI.h>

#include "nfc.hpp"
#include "wifi.hpp"
#include "mqtt.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

bool wifiConnected = false;

void setup(void)
{
  Serial.begin(115200);

  while (!Serial)
    ;

  pinMode(BUZZER_PIN, OUTPUT);

  if (!setupNFC(nfc))
  {
    Serial.println("Failed to connect NFC module! Halting...");
    while (true)
      ;
  }

  const bool wifiSuccess = connectWifi();

  if (wifiSuccess)
  {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    setupMqtt(mqttClient);
    connectToMqtt(mqttClient);

    wifiConnected = true;
  }
  else
  {
    Serial.println("Failed to connect to WiFi. Device will use stored access keys until reboot.");
  }

  xTaskCreatePinnedToCore(listenToNFC, "NFC_Task", 4096, static_cast<void *>(&nfc), 1, nullptr, 0);

  Serial.println("");
  Serial.println("Ready to receive NFC");
}

void loop(void)
{
  if (wifiConnected)
  {
    handleMqtt(mqttClient);
  }
}
