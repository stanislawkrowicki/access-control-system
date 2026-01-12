package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Lock
import com.stanislawkrowicki.acs.database.repositories.LockRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service

private val logger = KotlinLogging.logger {}

@Service
class LockService(
    private val lockRepository: LockRepository
) {
    fun getAllLocks(): List<Lock> {
        return lockRepository.findAll()
    }

    fun getLockById(id: String): Lock? {
        return lockRepository.findByIdOrNull(id)
    }

    fun saveLock(lock: Lock) {
        lockRepository.save(lock)
        logger.info { "Successfully saved lock with id ${lock.id}"}
    }

    fun deleteLockById(id: String) {
        lockRepository.deleteById(id)
        logger.info { "Successfully deleted lock with ID $id" }
    }
}