package com.stanislawkrowicki.acs.mqtt

const val MQTT_CLIENT_MESSAGE_PREFIX = "client"

/* Every type should be lowercase
and every type should have a handler with naming convention like TypeHandler.
Example type:
SHUTDOWN("shutdown")
should have a handler named ShutdownHandler
 */
enum class MqttClientMessageType(val string: String) {
    LOG("log")
}