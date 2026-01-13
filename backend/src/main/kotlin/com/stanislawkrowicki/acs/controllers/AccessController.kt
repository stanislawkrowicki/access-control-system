package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.services.AccessService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/access")
class AccessController(private val accessService: AccessService) {
    @GetMapping("/check")
    fun checkAccess(
        @RequestParam userId: Long,
        @RequestParam lockId: String
    ): ResponseEntity<Boolean> {
        val hasAccess = accessService.canUserAccessLock(userId, lockId)

        return if (hasAccess)
            ResponseEntity.ok().build()
        else
            ResponseEntity.status(HttpStatus.FORBIDDEN).build()
    }

    @PostMapping("/grant")
    fun grantAccess(@RequestBody request: AccessRequest): ResponseEntity<Unit> {
        accessService.grantAccess(request.userId, request.lockId)
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }
}

data class AccessRequest(val userId: Long, val lockId: String)