#pragma once

#include <Adafruit_PN532.h>
#include <Preferences.h>

class AccessController
{
public:
    AccessController(Adafruit_PN532 &nfc, Preferences &keyStorage, uint8_t openLedPin, uint8_t closeLedPin, uint8_t buzzerPin);

    bool begin();

    void startTask(const char *taskName = "NFC_Task",
                   uint32_t stackSize = 4096,
                   UBaseType_t priority = 1,
                   BaseType_t coreId = 0);

private:
    Adafruit_PN532 &nfc;
    Preferences *keyStorage = nullptr;

    const uint8_t openLedPin;
    const uint8_t closeLedPin;
    const uint8_t buzzerPin;

    void loop();
    void unlockSequence();
    void denySequence();
    bool authenticateTag(uint8_t *uid, uint8_t uidLength, uint8_t *keyUsedOut);
    void setDefaultLedStates();

    static void taskEntry(void *pvParameters);
};