package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Lock
import com.stanislawkrowicki.acs.database.models.Log
import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.repositories.LogRepository
import com.stanislawkrowicki.acs.database.repositories.UserAccessibleLockRepository
import com.stanislawkrowicki.acs.database.repositories.UserRepository
import jakarta.persistence.EntityManager
import jakarta.transaction.Transactional
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class LogService(
    private val logRepository: LogRepository,
    private val entityManager: EntityManager,
    private val userRepository: UserRepository
) {

    @Transactional
    fun new(keyPayload: String, lockId: String, hadAccess: Boolean?, message: String?) {
        val user = userRepository.findByKeysPayload(keyPayload)
        val lockProxy = entityManager.getReference(Lock::class.java, lockId)

        logRepository.save(Log(
            user = user,
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

    fun searchLogs(userId: Long?, username: String?, lockId: String?, pageable: Pageable): Page<Log> {
        return logRepository.searchLogs(userId, username, lockId, pageable)
    }
}