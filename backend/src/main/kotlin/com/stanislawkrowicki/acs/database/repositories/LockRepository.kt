package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.Lock
import org.springframework.data.jpa.repository.JpaRepository

interface LockRepository: JpaRepository<Lock, String> {
}