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
    fun findAll(): List<Key> = keyRepository.findAll()

    fun findById(id: Long): Key? = keyRepository.findByIdOrNull(id)

    @Transactional
    fun createKey(userId: Long, description: String, payload: String): Key {
        if (payload.length != 32)
            throw BadRequestException("Payload should be 32 bytes.")

        val owner = userRepository.findByIdOrNull(userId)
            ?: throw ResourceNotFoundException("User with ID $userId not found")

        val newKey = Key(
            description = description,
            payload = payload,
            owner = owner
        )

        return keyRepository.save(newKey)
    }

    @Transactional
    fun deleteKey(id: Long) {
        if (!keyRepository.existsById(id)) {
            throw ResourceNotFoundException("Key with ID $id not found")
        }

        keyRepository.deleteById(id)
    }
}