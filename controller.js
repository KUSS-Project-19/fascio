const logger = require('./logger')

const onoff = (process.env.DEBUG !== '1') ? require('onoff') : null

class Gpio {
    constructor(gpio, direction) {
        if (onoff !== null) {
            this.impl = new onoff.Gpio(gpio, direction)
        }
        this.number = gpio
    }

    writeSync(value) {
        logger.info(`Gpio #${this.number} is written with ${value === 1 ? 'on' : 'off'}`)
        if (this.impl !== undefined) {
            this.impl.writeSync(value)
        }
    }

    readSync() {
        let value = 0
        let sensorStr = ""
        let content = null

        if (this.impl !== undefined) {
            value = this.impl.readSync()
        }
        else {
            value = Math.random()
        }
        logger.info(`Gpio #${this.number} is read as ${value}`)

        if (value < 0.3) {
            sensorStr = "[Door Sound]"
        }

        else if (value < 0.7) {
            sensorStr = "[Misc Sound]"
        }

        else {
            sensorStr = "[No Sound]"
        }
        logger.info(`String is given as ${sensorStr}`)

        content = {
            value: value,
            sensorStr: sensorStr
        }

        return content
    }
}

const sensor = new Gpio(10, 'in')
const led = new Gpio(11, 'low')
let ledStatus = 0

function readSensor() {
    return sensor.readSync()
}
module.exports.readSensor = readSensor

function performAction() {
    ledStatus = 1 - ledStatus
    led.writeSync(ledStatus)
}
module.exports.performAction = performAction
