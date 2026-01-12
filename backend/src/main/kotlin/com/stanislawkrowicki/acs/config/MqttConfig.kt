package com.stanislawkrowicki.acs.config

import com.hivemq.client.mqtt.MqttClient
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class MqttConfig(

    @Value("\${mqtt.host}")
    private val host: String,

    @Value("\${mqtt.port}")
    private val port: Int,

    @Value("master-server")
    private val clientId: String
) {

    @Bean
    fun mqttClient(): Mqtt5AsyncClient =
        MqttClient.builder()
            .useMqttVersion5()
            .identifier(clientId)
            .serverHost(host)
            .serverPort(port)
            .buildAsync()
}