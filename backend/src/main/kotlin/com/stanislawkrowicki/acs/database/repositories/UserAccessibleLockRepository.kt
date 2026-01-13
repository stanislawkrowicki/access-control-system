package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.UserAccessibleLock
import org.springframework.data.jpa.repository.JpaRepository

interface UserAccessibleLockRepository: JpaRepository<UserAccessibleLock, Long> {
    fun existsByUserIdAndLockId(userId: Long, lockId: String): Boolean
}