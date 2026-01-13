package com.stanislawkrowicki.acs.database.repositories

import com.stanislawkrowicki.acs.database.models.Key
import org.springframework.data.jpa.repository.JpaRepository

interface KeyRepository: JpaRepository<Key, Long> {
}