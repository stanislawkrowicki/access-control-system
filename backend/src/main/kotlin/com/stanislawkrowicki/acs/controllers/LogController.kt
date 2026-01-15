package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.database.models.Log
import com.stanislawkrowicki.acs.services.LogService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("logs")
class LogController(
    private val logService: LogService
) {
    @GetMapping
    fun getAllLogs(
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) lockId: String?
    ): List<Log> {
        return if (userId != null)
            logService.findAllForUser(userId)
        else if (lockId != null)
            logService.findAllForLock(lockId)
        else
            logService.findAll()
    }
}