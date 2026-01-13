package com.stanislawkrowicki.acs.database.models

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    val username: String,

    @OneToMany(mappedBy = "owner")
    val keys: MutableList<Key>,

    @OneToMany(mappedBy = "user")
    val accessibleLocks: MutableList<UserAccessibleLock>
)
