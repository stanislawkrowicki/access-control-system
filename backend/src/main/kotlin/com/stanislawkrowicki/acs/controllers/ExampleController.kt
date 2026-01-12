package com.stanislawkrowicki.acs.controllers

import com.stanislawkrowicki.acs.mqtt.MqttService
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class ExampleController(
    private val mqttService: MqttService
) {
    private val log = LoggerFactory.getLogger(javaClass);

    @GetMapping("/")
    fun testMqtt(): String {
        log.info("Sending hello")
        mqttService.publish("Hello world!")
        return "OK"
    }
}