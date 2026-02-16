#include <Wire.h>
#include <SPI.h>
#include <Preferences.h>
#include <Adafruit_PN532.h>

#include "wifi.hpp"
#include "access_controller.hpp"
#include "mqtt_handler.hpp"
#include "logger.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
WiFiClient wifiClient;

Preferences keyStorage;

AccessController accessController(nfc, keyStorage, OPEN_LED_PIN, CLOSE_LED_PIN, BUZZER_PIN);
MqttHandler mqttHandler(wifiClient, keyStorage);

void enableConnectingLeds()
{
  digitalWrite(OPEN_LED_PIN, HIGH);
  digitalWrite(CLOSE_LED_PIN, HIGH);
}

void setup(void)
{
  Serial.begin(115200);

  while (!Serial)
    ;

  pinMode(WIFI_FAIL_PIN, OUTPUT);

  keyStorage.begin("keys", false);

  if (!accessController.begin())
  {
    Serial.println("NFC setup failed! Halting.");
    while (true)
      ;
  }

  Logger::init(mqttHandler);

  enableConnectingLeds();

  const bool wifiSuccess = connectWifi();

  if (wifiSuccess)
  {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    mqttHandler.begin();
  }
  else
  {
    Serial.println("Failed to connect to WiFi. Device will use stored access keys until reboot.");
    digitalWrite(WIFI_FAIL_PIN, HIGH);
  }

  accessController.startTask();

  Serial.println("");
  Serial.println("Ready to receive NFC");
}

void loop(void)
{
  mqttHandler.loop();
}
