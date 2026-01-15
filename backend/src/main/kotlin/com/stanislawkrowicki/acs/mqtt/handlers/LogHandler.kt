package com.stanislawkrowicki.acs.mqtt.handlers

import com.stanislawkrowicki.acs.services.LogService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue

private val logger = KotlinLogging.logger {}

data class LogMessage(
    val hadAccess: Boolean?,
    val userId: Long?,
    val message: String?
)

@Component
class LogHandler(
    private val logService: LogService,
    private val objectMapper: ObjectMapper
): MqttMessageHandler {
    override fun handle(deviceId: String, payload: ByteArray) {
        val log = objectMapper.readValue<LogMessage>(payload)

        if (log.userId == null) {
            if (log.message == null) {
                logger.error { "Received log without user and message " }
                return
            }

            logService.new(deviceId, log.message)
        } else {
            logService.new(log.userId, deviceId, log.hadAccess, log.message)
        }
    }
}