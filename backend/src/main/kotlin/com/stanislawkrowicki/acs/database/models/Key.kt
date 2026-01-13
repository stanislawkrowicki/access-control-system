package com.stanislawkrowicki.acs.database.models

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name="keys")
data class Key(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    val description: String,

    @Column(length = 32)
    val payload: String,

    @ManyToOne
    val owner: User
)