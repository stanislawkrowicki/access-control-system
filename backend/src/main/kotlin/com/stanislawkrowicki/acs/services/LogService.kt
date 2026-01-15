package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Lock
import com.stanislawkrowicki.acs.database.models.Log
import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.repositories.LogRepository
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class LogService(
    private val logRepository: LogRepository,
    private val entityManager: EntityManager
) {

    @Transactional
    fun new(userId: Long, lockId: String, hadAccess: Boolean?, message: String?) {
        val userProxy = entityManager.getReference(User::class.java, userId)
        val lockProxy = entityManager.getReference(Lock::class.java, lockId)

        logRepository.save(Log(
            user = userProxy,
            lock = lockProxy,
            hadAccess = hadAccess,
            message = message
        ))
    }

    @Transactional
    fun new(lockId: String, message: String) {
        val lockProxy = entityManager.getReference(Lock::class.java, lockId)

        logRepository.save(Log(
            user = null,
            lock = lockProxy,
            hadAccess = null,
            message = message
        ))
    }

    fun findAll(): List<Log> {
        return logRepository.findAll()
    }

    fun findAllForUser(userId: Long): List<Log> {
        return logRepository.findByUserId(userId)
    }

    fun findAllForLock(lockId: String): List<Log> {
        return logRepository.findByLockId(lockId)
    }
}