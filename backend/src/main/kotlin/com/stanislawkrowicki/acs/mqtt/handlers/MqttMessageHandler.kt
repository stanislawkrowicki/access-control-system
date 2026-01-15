package com.stanislawkrowicki.acs.mqtt.handlers

import java.nio.ByteBuffer

interface MqttMessageHandler {
    fun handle(deviceId: String, payload: ByteArray)
}