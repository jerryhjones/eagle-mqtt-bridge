const mqtt = require('mqtt')
const logger = require('./logger.js');

let discoveryPayload = {
    state_topic: "eagle/meter/demand",
    device_class: "power",
    state_class: "measurement",
    unit_of_measurement: "kW",
    device: {
        identifiers: ["LegacyEagle"],
        manufacturer: "Rainforest",
        model: "Rainforest Eagle-100",
        name: "Eagle Engergy Monitor",
        sw_version: "0.1"
    },
    name: "Eagle Power Demand",
    unique_id: "Eagle1002MQTT"
}

let discoveryPayloadFromGrid = {
  state_topic: "eagle/meter/delivered",
  device_class: "energy",
  state_class: "total_increasing",
  unit_of_measurement: "kWh",
  device: {
      identifiers: ["LegacyEagle"],
      manufacturer: "Rainforest",
      model: "Rainforest Eagle-100",
      name: "Eagle Engergy Monitor",
      sw_version: "0.1"
  },
  name: "Eagle From Grid",
  unique_id: "Eagle1002MQTTFromGrid"
}

let discoveryPayloadToGrid = {
  state_topic: "eagle/meter/received",
  device_class: "energy",
  state_class: "total_increasing",
  unit_of_measurement: "kWh",
  device: {
      identifiers: ["LegacyEagle"],
      manufacturer: "Rainforest",
      model: "Rainforest Eagle-100",
      name: "Eagle Engergy Monitor",
      sw_version: "0.1"
  },
  name: "Eagle To Grid",
  unique_id: "Eagle1002MQTTToGrid"
}

class MqttClient {
  constructor(host, port, username, password, topic_base) {
    this.client = null
    this.topic_base = topic_base
    this.host = 'mqtt://' + host
    this.port = port
    if (username && password) {
      this.username = username
      this.password = password
    } else {
      logger.warn('Missing or incomplete credentials provided for MQTT connection.')
      logger.warn('Will attempt unauthenticated connection.')
    }
  }

  connect() {
    var connectOptions = {
        will: {topic: this.topic_base + '/bridge/status', payload: 'offline', retain: true}
    }

    if (this.port) {
      connectOptions.port = this.port
    }

    if (this.username && this.password) {
      connectOptions.username = this.username
      connectOptions.password = this.password
    }

    let portMessage = this.port || 1883
    logger.info("Connecting to " + this.host + " port: " + portMessage)
    this.client = mqtt.connect(this.host, connectOptions)

    this.client.on('error', (err) => {
      logger.error('MQTT Error: ' + err.message)
    })

    this.client.on('connect', () => {
      logger.info('MQTT client connected')
      logger.info('Publishing to topic base: ' + this.topic_base)
      this.client.publish(this.topic_base + '/bridge/status', 'online', {retain: true})



      this.client.publish('homeassistant/sensor/eagle_power_demand/config', JSON.stringify(discoveryPayload) , {retain: true})
      this.client.publish('homeassistant/sensor/eagle_to_grid/config', JSON.stringify(discoveryPayloadFromGrid) , {retain: true})
      this.client.publish('homeassistant/sensor/eagle_from_grid/config', JSON.stringify(discoveryPayloadToGrid) , {retain: true})
    })

    this.client.on('close', () => {
      logger.info('MQTT client connection closed')
    })
  }

  sendMessage(topic, message, flag=false) {
      this.client.publish(this.topic_base + '/' + topic, message.toString(), {retain: flag})
  }
}

module.exports = MqttClient
