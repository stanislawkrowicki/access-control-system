package com.stanislawkrowicki.acs.mqtt

import com.hivemq.client.mqtt.datatypes.MqttQos
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient
import com.hivemq.client.mqtt.mqtt5.message.publish.Mqtt5Publish
import com.stanislawkrowicki.acs.database.repositories.KeyRepository
import com.stanislawkrowicki.acs.database.repositories.LockRepository
import com.stanislawkrowicki.acs.mqtt.handlers.LogHandler
import com.stanislawkrowicki.acs.mqtt.handlers.MqttMessageHandler
import com.stanislawkrowicki.acs.services.DeviceStatusService
import com.stanislawkrowicki.acs.services.LockService
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import tools.jackson.databind.ObjectMapper
import java.nio.ByteBuffer

private val logger = KotlinLogging.logger {}

@Service
class MqttService(
    private val client: Mqtt5AsyncClient,
    private val deviceStatusService: DeviceStatusService,
    private val keyRepository: KeyRepository,
    private val objectMapper: ObjectMapper,
    private val handlers: List<MqttMessageHandler>,
    private val lockRepository: LockRepository
) {
    private val handlerMap = handlers.associateBy {
        it.javaClass.simpleName.removeSuffix("Handler").lowercase()
    }

    @PostConstruct
    fun start() {
        connect()
        subscribeToDiscovery()
        subscribeToDeviceMessages()
    }

    fun publish(message: String) {
        publish(MqttTopic.GENERAL, message)
    }

    fun publish(topic: MqttTopic, message: String) {
        client.publishWith()
            .topic(topic.string)
            .qos(MqttQos.AT_LEAST_ONCE)
            .payload(message.toByteArray())
            .send()
    }

    fun publishToDevice(deviceId: String, subtopic: String, message: String) {
            if (!deviceStatusService.isDeviceOnline(deviceId)) {
                logger.debug { "Tried to publish to an offline device: $deviceId" }
                return;
            }

            val topic = "private/$deviceId/$subtopic"

            client.publishWith()
                .topic(topic)
                .qos(MqttQos.AT_LEAST_ONCE)
                .payload(message.toByteArray())
                .send()
    }

    private fun connect() {
        client.connect()
            .whenComplete { _, ex ->
                if (ex != null) {
                    logger.error {"MQTT connection failed: $ex" }
                } else {
                    logger.info { "Connected to MQTT broker (MQTT 5)" }
                }
            }
    }

    private fun subscribeToDiscovery() {
        client.subscribeWith()
            .topicFilter(MqttTopic.DISCOVERY.string)
            .qos(MqttQos.AT_LEAST_ONCE)
            .callback { publish: Mqtt5Publish ->
                val payload = publish.payload.orElse(null)?.let { buffer ->
                    val bytes = ByteArray(buffer.remaining())
                    buffer.get(bytes)
                    String(bytes)
                }

                logger.info { "Received discovery message: $payload" }
                payload?.let { onDiscover(it) }
            }
            .send()

        logger.info { "MQTT subscribed to ${MqttTopic.DISCOVERY.string} topic"}
    }

    private fun subscribeToDeviceMessages() {
        client.subscribeWith()
            .topicFilter("$MQTT_CLIENT_MESSAGE_PREFIX/+/+")
            .qos(MqttQos.AT_LEAST_ONCE)
            .callback { publish: Mqtt5Publish ->
                val splitTopic = publish.topic.toString().split("/")

                if (splitTopic.size != 3) {
                    logger.error { "Received message on strange topic: ${publish.topic}"}
                    return@callback
                }

                val deviceId = splitTopic[1];

                if (!lockRepository.existsById(deviceId)) {
                    logger.warn { "Received a message on ${splitTopic[2]} from a device that does not exist: $deviceId" }
                    return@callback
                }

                val messageType = MqttClientMessageType.entries.find { it.string == splitTopic[2] }

                if (messageType == null) {
                    logger.warn { "Received unknown message type: ${splitTopic[2]}" }
                    return@callback
                }

                val payload = publish.payload

                if (payload.isPresent)
                    handleMessage(messageType, deviceId, payload.get())
                else
                    handleEmptyMessage(messageType, deviceId)
            }
            .send()

        logger.info { "MQTT subscribed to $MQTT_CLIENT_MESSAGE_PREFIX/+/+ topic"}
    }

    private fun onDiscover(deviceId: String) {
        deviceStatusService.markAsActive(deviceId)
        sendKeysToDevice(deviceId)
    }

    private fun sendKeysToDevice(deviceId: String) {
        val payloads = keyRepository.findAllKeyPayloadsByLockId(deviceId)

        payloads.ifEmpty {
            logger.info { "No keys to sync for device $deviceId" }
            return
        }

        try {
            val jsonPayload = objectMapper.writeValueAsString(payloads)
            publishToDevice(deviceId, "sync-keys", jsonPayload)

            logger.info { "Synced ${payloads.size} keys to device $deviceId" }
        } catch (e: Exception) {
            logger.error(e) { "Failed to sync keys with device $deviceId" }
        }
    }

    private fun handleEmptyMessage(messageType: MqttClientMessageType, deviceId: String) {
        logger.error { "Received empty message with type $messageType from $deviceId" }
    }

    private fun handleMessage(messageType: MqttClientMessageType, deviceId: String, buffer: ByteBuffer) {
        val payload = ByteArray(buffer.remaining())
        buffer.get(payload)

        val handler = handlerMap[messageType.string]
        if (handler != null)
            handler.handle(deviceId, payload)
        else
            logger.error { "No handler found for type $messageType.string" }
    }
}