package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.database.models.UserAccessibleLock
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface UserAccessibleLockRepository: JpaRepository<UserAccessibleLock, Long> {
    fun existsByUserIdAndLockId(userId: Long, lockId: String): Boolean
    fun findAllByLockId(lockId: String): List<UserAccessibleLock>

    @Query("SELECT ual.user FROM UserAccessibleLock ual WHERE ual.lock.id = :lockId")
    fun findUsersByLockId(lockId: String): List<User>

    fun findByUserIdAndLockId(userId: Long, lockId: String): UserAccessibleLock?
}