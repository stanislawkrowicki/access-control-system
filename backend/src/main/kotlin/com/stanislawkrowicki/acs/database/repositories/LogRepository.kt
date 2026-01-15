package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.Log
import org.springframework.data.jpa.repository.JpaRepository

interface LogRepository : JpaRepository<Log, Long> {
    fun findByLockId(lockId: String): List<Log>
    fun findByUserId(userId: Long): List<Log>
}