const util = require('util')
const EventEmitter = require('events').EventEmitter
const SerialPort = require('serialport')
const async = require('async')

const i2c = require('./lib/i2c.js')

/** 
 * Main BusPirate module
 * @module BusPirate
 * @author nodebotanist
 */

/**
 * Represents a BusPirate object
 * @constructor
 * @function
 * @param {Object} options
 * @param {String} options.port -- the absolute path to the serial port of the bus pirate (e.g. /dev/tty.usbserial-xxxx)
 */
function BusPirate(options) {
    EventEmitter.call(this)

    // Queue input from the bus pirate for stuff that needs to be synchronus
    this.inputQueue = []

    // Initial state setup
    this._ready = false

    this.port = new SerialPort(
        options.port, {
            baudRate: 115200,
        }
    )

    // TODO: change these to () => syntax
    this.port.on('open', function() { this.emit('open') }.bind(this))

    this.port.on('data', function(data) {
        data = Buffer.from(data).toString()
        this.inputQueue.push(data)
        console.log('Queue: ', this.inputQueue)
    }.bind(this))
}

util.inherits(BusPirate, EventEmitter)

// Add in the I2C module
Object.assign(BusPirate.prototype, i2c)

/**
 * Sends a reset code to the bus pirate
 * @method reset
 */
BusPirate.prototype.reset = function() {
    this.port.write([0x0F])
}

BusPirate.prototype._flush = function() {
    this.inputQueue = []
}

/**
 * Starts the bus pirate.
 * @method start
 * @fires ready
 */
BusPirate.prototype.start = function() {
    async.until(
        () => this._ready,
        (cb) => {
            if (this.inputQueue.length === 0) {
                this.port.write([0x00], () => { setTimeout(cb, 100) })
            } else {
                let message = this.inputQueue.shift()
                if (message.indexOf('BBIO1') !== -1) {
                    console.log('ready')
                    this._ready = true
                        /**
                         * Ready event -- signals the bus pirate is ready to recieve commands
                         * 
                         * @event ready
                         */
                    this.emit('ready')
                    this._flush()
                }
                cb(null)
            }
        }
    )
}

module.exports = BusPirate