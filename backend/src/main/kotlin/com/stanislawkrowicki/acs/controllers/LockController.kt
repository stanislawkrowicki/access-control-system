package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.database.models.Lock
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import com.stanislawkrowicki.acs.services.LockService
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/locks")
@Validated
class LockController(
    private val lockService: LockService
) {
    @GetMapping("/")
    fun getLocks(): ResponseEntity<List<Lock>> {
        return ResponseEntity.ok().body(lockService.getAllLocks())
    }

    @GetMapping("/{id}")
    fun getLockById(@PathVariable id: String): ResponseEntity<Lock> {
        return lockService.getLockById(id)
            ?.let { ResponseEntity.ok(it) }
            ?: throw ResourceNotFoundException("Lock with id $id not found")
    }

    @PostMapping("/")
    fun saveLock(@RequestBody lock: Lock): ResponseEntity<Unit> {
        return ResponseEntity.ok().body(lockService.saveLock(lock));
    }

    @DeleteMapping("/{id}")
    fun deleteLockById(@PathVariable id: String): ResponseEntity<Unit> {
        lockService.deleteLockById(id)
        return ResponseEntity.ok().build()
    }
}