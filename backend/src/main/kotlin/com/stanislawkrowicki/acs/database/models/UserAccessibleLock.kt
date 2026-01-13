package com.stanislawkrowicki.acs.database.models

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name="user_accessible_locks")
data class UserAccessibleLock(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne
    val user: User,

    @ManyToOne
    val lock: Lock
)