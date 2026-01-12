package com.stanislawkrowicki.acs.database.models

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "locks")
data class Lock(
    @Id
    val id: String,
    val name: String
)
