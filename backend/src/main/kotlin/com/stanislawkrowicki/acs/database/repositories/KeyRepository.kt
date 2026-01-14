package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.Key
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface KeyRepository: JpaRepository<Key, Long> {

    @Query("""
        SELECT k from Key AS k
        JOIN k.owner AS owner
        JOIN owner.accessibleLocks AS al
        WHERE al.lock.id = :lockId
    """)
    fun findAllKeysByLockId(lockId: String): Set<Key>

    @Query("""
        SELECT k.payload from Key AS k
        JOIN k.owner AS owner
        JOIN owner.accessibleLocks AS al
        WHERE al.lock.id = :lockId
    """)
    fun findAllKeyPayloadsByLockId(lockId: String): Set<String>

    fun findAllByOwnerId(ownerId: Long): Set<Key>
}