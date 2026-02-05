#include "access_controller.hpp"

#if __has_include("secrets.hpp")
#include "secrets.hpp"
#else
#error "secrets.hpp not found! Create it in the ./private directory by copying secrets.example.hpp and fill it with your own secrets."
#endif

AccessController::AccessController(Adafruit_PN532 &nfc, Preferences &persistentStorage, uint8_t openLedPin, uint8_t closeLedPin, uint8_t buzzerPin)
    : nfc(nfc),
      keyStorage(&persistentStorage),
      openLedPin(openLedPin),
      closeLedPin(closeLedPin),
      buzzerPin(buzzerPin)
{
    pinMode(openLedPin, OUTPUT);
    pinMode(closeLedPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);

    digitalWrite(buzzerPin, LOW);
}

bool AccessController::begin()
{
    nfc.begin();
    auto versionData = nfc.getFirmwareVersion();

    if (!versionData)
        return false;

    Serial.print("Found chip PN5");
    Serial.println((versionData >> 24) & 0xFF, HEX);
    Serial.print("Firmware ver. ");
    Serial.print((versionData >> 16) & 0xFF, DEC);
    Serial.print('.');
    Serial.println((versionData >> 8) & 0xFF, DEC);
    return true;
}

void AccessController::startTask(const char *taskName, uint32_t stackSize, UBaseType_t priority, BaseType_t coreId)
{
    setDefaultLedStates();

    xTaskCreatePinnedToCore(
        AccessController::taskEntry,
        taskName,
        stackSize,
        this,
        priority,
        nullptr,
        coreId);
}

void AccessController::taskEntry(void *pvParameters)
{
    AccessController *controller = static_cast<AccessController *>(pvParameters);

    controller->loop();

    Serial.println("exited loop");

    vTaskDelete(nullptr);
}

void AccessController::loop()
{
    while (true)
    {
        uint8_t success;
        uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
        uint8_t uidLength;

        success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

        if (success)
        {
            digitalWrite(buzzerPin, HIGH);

            Serial.print("Found NFC tag. UID Value: ");
            nfc.PrintHex(uid, uidLength);
            Serial.println("");

            uint8_t keyUsed[16] = {0};
            bool accessGranted = false;

            if (uidLength == 4)
            {
                accessGranted = authenticateTag(uid, uidLength, keyUsed);
            }
            else
            {
                Serial.println("Unknown tag type length!");
            }

            // logOpenAttempt(keyUsed, accessGranted);

            if (accessGranted)
            {
                unlockSequence();
            }
            else
            {
                denySequence();
            }
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

bool AccessController::authenticateTag(uint8_t *uid, uint8_t uidLength, uint8_t *keyUsedOut)
{
    if (keyStorage == nullptr)
    {
        Serial.println("Can not authenticate - key storage is not initialized!");
        return false;
    }

    uint8_t success = nfc.mifareclassic_AuthenticateBlock(uid, uidLength, 4, 0, SECRET_KEY_A);

    if (!success)
    {
        Serial.println("Tag authentication failed.");
        return false;
    }

    success = nfc.mifareclassic_ReadDataBlock(4, keyUsedOut);

    if (!success)
    {
        Serial.println("Read failed.");
        return false;
    }

    nfc.PrintHexChar(keyUsedOut, 16);

    int storedKeysCount = keyStorage->getInt("count", 0);

    for (int i = 0; i < storedKeysCount; ++i)
    {
        uint8_t storedKey[16];
        if (keyStorage->getBytes(String(i).c_str(), storedKey, 16) == 16)
        {
            if (memcmp(keyUsedOut, storedKey, 16) == 0)
            {
                return true;
            }
        }
    }

    return false;
}

void AccessController::setDefaultLedStates()
{
    digitalWrite(closeLedPin, HIGH);
    digitalWrite(openLedPin, LOW);
}

void AccessController::unlockSequence()
{
    digitalWrite(buzzerPin, LOW);
    digitalWrite(closeLedPin, LOW);
    digitalWrite(openLedPin, HIGH);

    vTaskDelay(pdMS_TO_TICKS(150));

    for (int i = 0; i < 3; ++i)
    {
        digitalWrite(buzzerPin, HIGH);
        vTaskDelay(pdMS_TO_TICKS(150));
        digitalWrite(buzzerPin, LOW);
        vTaskDelay(pdMS_TO_TICKS(150));
    }

    vTaskDelay(pdMS_TO_TICKS(300));
    digitalWrite(openLedPin, LOW);
    digitalWrite(closeLedPin, HIGH);
}

void AccessController::denySequence()
{
    digitalWrite(buzzerPin, HIGH);
    vTaskDelay(pdMS_TO_TICKS(1000));
    digitalWrite(buzzerPin, LOW);
}