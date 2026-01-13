package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.database.models.User
import com.stanislawkrowicki.acs.exceptions.ResourceNotFoundException
import com.stanislawkrowicki.acs.services.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(private val userService: UserService) {

    @GetMapping
    fun getAllUsers(): List<UserResponse> {
        return userService.findAll().map { it.toResponse() }
    }

    @GetMapping("/{id}")
    fun getUser(@PathVariable id: Long): UserResponse {
        val user = userService.findById(id)
            ?: throw ResourceNotFoundException("User $id not found")
        return user.toResponse()
    }

    @PostMapping
    fun createUser(@RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
        val user = userService.createUser(request.username)
        return ResponseEntity.status(HttpStatus.CREATED).body(user.toResponse())
    }

    @DeleteMapping("/{id}")
    fun deleteUser(@PathVariable id: Long) = userService.deleteUser(id)
}

data class CreateUserRequest(val username: String)

data class UserResponse(
    val id: Long?,
    val username: String,
    val keyCount: Int,
    val lockCount: Int
)

fun User.toResponse() = UserResponse(
    id = this.id,
    username = this.username,
    keyCount = this.keys.size,
    lockCount = this.accessibleLocks.size
)