package com.stanislawkrowicki.acs.database.models

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "logs")
data class Log(
    @Id
    val id: Long? = null,

    @ManyToOne
    val user: User?,

    @ManyToOne
    val lock: Lock?,

    val hadAccess: Boolean?,

    val message: String?
)