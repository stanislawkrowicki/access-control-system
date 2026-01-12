package com.stanislawkrowicki.acs

import io.github.cdimascio.dotenv.dotenv
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class AcsApplication

fun main(args: Array<String>) {
	val dotenv = dotenv{
		directory = ".."
	}

	dotenv.entries().forEach { entry ->
		System.setProperty(entry.key, entry.value)
	}

	runApplication<AcsApplication>(*args)
}
