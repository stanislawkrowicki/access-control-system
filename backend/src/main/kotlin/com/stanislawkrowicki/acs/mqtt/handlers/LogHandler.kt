package com.stanislawkrowicki.acs.mqtt.handlers

import com.stanislawkrowicki.acs.services.LogService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import java.nio.ByteBuffer

private val logger = KotlinLogging.logger {}

@Component
class LogHandler(
    private val logService: LogService
): MqttMessageHandler {
    override fun handle(deviceId: String, payload: ByteArray) {
        logger.info { "Received log from $deviceId with payload ${String(payload)}" }
    }
}