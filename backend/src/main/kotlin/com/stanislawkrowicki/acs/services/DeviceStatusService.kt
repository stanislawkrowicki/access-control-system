package com.stanislawkrowicki.acs.services

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

const val MARK_AS_OFFLINE_AFTER_MINUTES = 5L

private val logger = KotlinLogging.logger {}

@Service
class DeviceStatusService(
    private val lockService: LockService
) {
    private val activeDevices = ConcurrentHashMap<String, LocalDateTime>()

    fun markAsActive(deviceId: String) {
        if (!lockService.existsById(deviceId)) {
            logger.warn { "Tried to mark as active a device that does not exist, id: $deviceId" }
            return
        }

        activeDevices[deviceId] = LocalDateTime.now()
    }

    fun getActiveDevices(): Set<String> = activeDevices.keys

    fun isDeviceOnline(deviceId: String): Boolean {
        val lastSeen = activeDevices[deviceId] ?: return false

        return lastSeen.isAfter(LocalDateTime.now().minusMinutes(MARK_AS_OFFLINE_AFTER_MINUTES))
    }
}