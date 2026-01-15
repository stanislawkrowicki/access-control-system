package com.stanislawkrowicki.acs.database.models

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "logs")
data class Log(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne
    @JsonIgnoreProperties("keys", "accessible_locks")
    val user: User?,

    @ManyToOne
    val lock: Lock?,

    val hadAccess: Boolean?,

    val message: String?
)