package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Key
import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.repositories.KeyRepository
import com.stanislawkrowicki.acs.database.repositories.UserRepository
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import jakarta.transaction.Transactional
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class UserService(
    private val userRepository: UserRepository
) {
    fun findAll(): List<User> = userRepository.findAll()

    fun findById(id: Long): User? = userRepository.findByIdOrNull(id)

    @Transactional
    fun createUser(username: String): User {
        if (userRepository.existsByUsername(username)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Username already exists")
        }

        val user = User(
            username = username,
            keys = mutableListOf(),
            accessibleLocks = mutableListOf()
        )
        return userRepository.save(user)
    }

    @Transactional
    fun deleteUser(id: Long) {
        if (!userRepository.existsById(id)) {
            throw ResourceNotFoundException("User with id $id not found")
        }
        userRepository.deleteById(id)
    }
}