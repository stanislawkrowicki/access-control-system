package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.database.models.Key
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import com.stanislawkrowicki.acs.services.KeyService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/keys")
class KeyController(private val keyService: KeyService) {

    @GetMapping
    fun getAllKeys(): List<Key> = keyService.findAll()

    @GetMapping("/{id}")
    fun getKey(@PathVariable id: Long): Key {
        return keyService.findById(id)
            ?: throw ResourceNotFoundException("Key not found")
    }

    @PostMapping
    fun createKey(@RequestBody request: CreateKeyRequest): ResponseEntity<Key> {
        val created = keyService.createKey(
            userId = request.userId,
            description = request.description,
            payload = request.payload
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(created)
    }

    @DeleteMapping("/{id}")
    fun deleteKey(@PathVariable id: Long) {
        keyService.deleteKey(id)
    }
}

data class CreateKeyRequest(
    val userId: Long,
    val description: String,
    val payload: String
)