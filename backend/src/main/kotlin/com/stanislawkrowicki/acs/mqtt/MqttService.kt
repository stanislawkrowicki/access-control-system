package com.stanislawkrowicki.acs.mqtt

import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient
import com.hivemq.client.mqtt.mqtt5.message.publish.Mqtt5Publish
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MqttService(
    private val client: Mqtt5AsyncClient
) {
    private val log = LoggerFactory.getLogger(javaClass);

    @PostConstruct
    fun start() {
        connect()
        subscribe()
    }

    private fun connect() {
        client.connect()
            .whenComplete { _, ex ->
                if (ex != null) {
                    log.error("MQTT connection failed", ex)
                } else {
                    log.info("Connected to MQTT broker (MQTT 5)")
                }
            }
    }

    private fun subscribe() {
        client.subscribeWith()
            .topicFilter(MqttTopic.GENERAL.string)
            .qos(com.hivemq.client.mqtt.datatypes.MqttQos.AT_LEAST_ONCE)
            .callback { publish: Mqtt5Publish ->
                val payload = publish.payload.orElse(null)?.let { buffer ->
                    val bytes = ByteArray(buffer.remaining())
                    buffer.get(bytes)
                    String(bytes)
                }
                log.info("Received message: $payload")
            }
            .send()
    }

    fun publish(message: String) {
        publish(MqttTopic.GENERAL, message)
    }

    fun publish(topic: MqttTopic, message: String) {
        client.publishWith()
            .topic(topic.string)
            .qos(com.hivemq.client.mqtt.datatypes.MqttQos.AT_LEAST_ONCE)
            .payload(message.toByteArray())
            .send()
    }
}