package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.Lock
import com.stanislawkrowicki.acs.database.models.Log
import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.repositories.LogRepository
import org.springframework.stereotype.Service

@Service
class LogService(
    private val logRepository: LogRepository
) {
    fun new(user: User?, lock: Lock?, hadAccess: Boolean, message: String?) {
        logRepository.save(Log(
            user = user,
            lock = lock,
            hadAccess = hadAccess,
            message = message
        ))
    }
    fun new(lock: Lock, message: String) {
        logRepository.save(Log(
            user = null,
            lock = lock,
            hadAccess = null,
            message = message
        ))
    }
}