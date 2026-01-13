package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Key
import com.stanislawkrowicki.acs.database.repositories.KeyRepository
import com.stanislawkrowicki.acs.database.repositories.UserRepository
import com.stanislawkrowicki.acs.exceptions.BadRequestException
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import jakarta.transaction.Transactional
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service

@Service
class KeyService(
    private val keyRepository: KeyRepository,
    private val userRepository: UserRepository
) {
    fun findAll(): List<KeyResponse> {
        val keys = keyRepository.findAll()
        return keys.map { it.toResponse() }
    }

    fun findById(id: Long): KeyResponse? = keyRepository.findByIdOrNull(id)?.toResponse()

    @Transactional
    fun createKey(userId: Long, description: String, payload: String): KeyResponse {
        if (payload.length != 32)
            throw BadRequestException("Payload should be 32 bytes.")

        val owner = userRepository.findByIdOrNull(userId)
            ?: throw ResourceNotFoundException("User with ID $userId not found")

        val newKey = Key(
            description = description,
            payload = payload,
            owner = owner
        )

        return keyRepository.save(newKey).toResponse()
    }

    @Transactional
    fun deleteKey(id: Long) {
        if (!keyRepository.existsById(id)) {
            throw ResourceNotFoundException("Key with ID $id not found")
        }

        keyRepository.deleteById(id)
    }
}

fun Key.toResponse() = KeyResponse(
    id = this.id!!,
    description = this.description,
    payload = this.payload,
    ownerId = this.owner.id!!,
)

data class KeyResponse(
    val id: Long,
    val description: String,
    val payload: String,
    val ownerId: Long
)