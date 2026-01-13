#pragma once
#include <Adafruit_PN532.h>

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

static Preferences *keyStorage;

bool setupNFC(Adafruit_PN532 &nfc)
{
    nfc.begin();
    return nfc.getFirmwareVersion() > 0;
}

void setNFCPersistentStorage(Preferences &persistentStorage)
{
    keyStorage = &persistentStorage;
}

void openLock()
{
    Serial.println("Open!");

    digitalWrite(BUZZER_PIN, LOW);
    vTaskDelay(pdMS_TO_TICKS(150));

    for (int i = 0; i <= 3; ++i)
    {
        digitalWrite(BUZZER_PIN, HIGH);
        vTaskDelay(pdMS_TO_TICKS(150));
        digitalWrite(BUZZER_PIN, LOW);
        vTaskDelay(pdMS_TO_TICKS(150));
    }
}

void accessDenied()
{
    Serial.println("Access denied!");
    digitalWrite(BUZZER_PIN, HIGH);
    vTaskDelay(pdMS_TO_TICKS(1000));
    digitalWrite(BUZZER_PIN, LOW);
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

        bool opened = false;

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

                        int storedKeysCount = keyStorage->getInt("count");
                        for (int i = 0; i < storedKeysCount; ++i)
                        {
                            uint8_t storedKey[16];
                            keyStorage->getBytes(String(i).c_str(), storedKey, 16);

                            if (memcmp(data, storedKey, 16) == 0)
                            {
                                opened = true;
                                openLock();
                                break;
                            }
                        }
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
            }

            else
            {
                Serial.println("Unknown tag type!");
            }
        }

        if (!opened)
        {
            accessDenied();
        }
    }
}