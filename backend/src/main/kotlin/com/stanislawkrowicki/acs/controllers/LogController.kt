package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.database.models.Log
import com.stanislawkrowicki.acs.services.LogService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
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
        @RequestParam(required = false) username: String?,
        @RequestParam(required = false) lockId: String?,
        @PageableDefault(size = 10, sort = ["id"], direction = Sort.Direction.DESC) pageable: Pageable
    ): Page<Log> {
        return logService.searchLogs(userId, username, lockId, pageable)
    }
}