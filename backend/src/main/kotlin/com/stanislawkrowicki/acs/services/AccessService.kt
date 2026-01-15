package com.stanislawkrowicki.acs.services

import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.models.UserAccessibleLock
import com.stanislawkrowicki.acs.database.repositories.KeyRepository
import com.stanislawkrowicki.acs.database.repositories.LockRepository
import com.stanislawkrowicki.acs.database.repositories.UserAccessibleLockRepository
import com.stanislawkrowicki.acs.database.repositories.UserRepository
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import jakarta.transaction.Transactional
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AccessService(
    private val userAccessRepository: UserAccessibleLockRepository,
    private val userRepository: UserRepository,
    private val lockRepository: LockRepository,
    private val keyRepository: KeyRepository
) {
    fun canUserAccessLock(userId: Long, lockId: String): Boolean {
        return userAccessRepository.existsByUserIdAndLockId(userId, lockId)
    }

    fun getAllKeysWithAccessToLock(lockId: String): Set<String> {
        return keyRepository.findAllKeysByLockId(lockId)
            .map { it.payload }
            .toSet()
    }

    fun getAllUsersWithAccessToLock(lockId: String): List<UsersWithAccessResponse> {
        val users = userAccessRepository.findUsersByLockId(lockId)

        return users.map { user ->
            UsersWithAccessResponse(
                userId = user.id!!,
                username = user.username
            )
        }
    }

    @Transactional
    fun grantAccess(userId: Long, lockId: String): UserAccessibleLock {
        if (canUserAccessLock(userId, lockId)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "User already has access to this lock")
        }

        val user = userRepository.findByIdOrNull(userId)
            ?: throw ResourceNotFoundException("User $userId not found")

        val lock = lockRepository.findByIdOrNull(lockId)
            ?: throw ResourceNotFoundException("Lock $lockId not found")

        val accessRecord = UserAccessibleLock(
            user = user,
            lock = lock
        )
        return userAccessRepository.save(accessRecord)
    }
}

data class UsersWithAccessResponse(
    val userId: Long,
    val username: String
)