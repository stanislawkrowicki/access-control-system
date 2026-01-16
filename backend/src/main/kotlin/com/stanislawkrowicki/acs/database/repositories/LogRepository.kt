package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.Log
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface LogRepository : JpaRepository<Log, Long> {
    fun findByLockId(lockId: String): List<Log>
    fun findByUserId(userId: Long): List<Log>

    @Query("""
        SELECT l FROM Log l
        LEFT JOIN l.user u
        LEFT JOIN l.lock k
        WHERE (:userId IS NULL OR u.id = :userId)
          AND (:username IS NULL OR u.username LIKE %:username%)
          AND (:lockId IS NULL OR k.id  LIKE %:lockId%)
    """)
    fun searchLogs(
        @Param("userId") userId: Long?,
        @Param("username") username: String?,
        @Param("lockId") lockId: String?,
        pageable: Pageable
    ): Page<Log>
}