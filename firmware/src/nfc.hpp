#pragma once
#include <Adafruit_PN532.h>

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

bool setupNFC(Adafruit_PN532 &nfc)
{
    nfc.begin();
    return nfc.getFirmwareVersion() > 0;
}

void listenToNFC(void *pvParameters)
{
    while (true)
    {

        Adafruit_PN532 *nfc = static_cast<Adafruit_PN532 *>(pvParameters);

        uint8_t success;
        uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
        uint8_t uidLength;

        success = nfc->readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

        if (success)
        {
            digitalWrite(BUZZER_PIN, HIGH);

            Serial.print("Found NFC tag. UID Value: ");
            nfc->PrintHex(uid, uidLength);
            Serial.println("");

            if (uidLength == 4)
            {
                success = nfc->mifareclassic_AuthenticateBlock(uid, uidLength, 4, 0, SECRET_KEY_A);

                if (success)
                {
                    Serial.println("Sector 1 (Blocks 4..7) has been authenticated");
                    uint8_t data[16];

                    success = nfc->mifareclassic_ReadDataBlock(4, data);

                    if (success)
                    {
                        Serial.println("Reading Block 4:");
                        nfc->PrintHexChar(data, 16);
                        Serial.println("");

                        vTaskDelay(1000);
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
}