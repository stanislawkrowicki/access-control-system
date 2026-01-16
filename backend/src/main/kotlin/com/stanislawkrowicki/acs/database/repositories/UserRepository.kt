package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository: JpaRepository<User, Long> {
    fun existsByUsername(username: String): Boolean
    fun findByKeysPayload(payload: String): User?
}