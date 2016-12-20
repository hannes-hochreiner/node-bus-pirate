/** Bus Pirate SPI binary mode
 * @see {@link http://dangerousprototypes.com/docs/Bitbang}
 * @see {@link http://dangerousprototypes.com/docs/SPI_%28binary%29}
 */
let spi = {};

/** Initialize SPI */
spi.spiInit = function() {
  console.log('starting SPI');

  // Exit to bitbanging mode by sending 0x00.
  // Enter UART mode by sending 0x01.
  // The expected answer is "SPI1".
  this.port.write([0x00, 0x01]);
};

/** Set SPI speed
 * @param {String} speed - 30kHz (default), 125kHz, 250kHz, 1MHz, 2MHz, 2.6MHz,
 *                         4MHz, 8MHz;
 */
spi.spiSetSpeed = function(speed) {
  let speedByte = 0x60;

  if (speed === "125kHz") {
    speedByte |= 0x01;
  } else if (speed === "250kHz") {
    speedByte |= 0x02;
  } else if (speed === "1MHz") {
    speedByte |= 0x03;
  } else if (speed === "2MHz") {
    speedByte |= 0x04;
  } else if (speed === "2.6MHz") {
    speedByte |= 0x05;
  } else if (speed === "4MHz") {
    speedByte |= 0x06;
  } else if (speed === "8MHz") {
    speedByte |= 0x07;
  }

  this.port.write([speedByte])
}

/** Configure SPI
 *
 * The configuration object is expected to have one or more of the following
 * properties:
 *
 * pinOutput: HiZ (default) or 3V3;
 * clockIdlePhase: low (default) or high;
 * clockEdge: activeToIdle (default) or idleToActive;
 * sampleTime: middle (default) or end;
 *
 * @param {Object} opts - Configuration object.
 */
spi.spiConfig = function(opts) {
  if (typeof opts === "undefined") {
    return;
  }

  let optByte = 0x82;

  if (typeof opts.pinOutput !== "undefined") {
    if (opts.pinOutput === "3V3") {
      optByte |= 0x08;
    }
  }

  if (typeof opts.clockIdlePhase !== "undefined") {
    if (opts.clockIdlePhase === "high") {
      optByte |= 0x01 << 2;
    }
  }

  if (typeof opts.clockEdge !== "undefined") {
    if (opts.clockEdge === "idleToActive") {
      optByte &= 0xFF^0x02;
    }
  }

  if (typeof opts.sampleTime !== "undefined") {
    if (opts.sampleTime === "end") {
      optByte |= 0x01;
    }
  }

  this.port.write([optByte]);
};

/** Set the state of the cable select pin
 *
 * @param {Boolean} cs - "false" sets CS to ground;
 *                       "true" sets CS to 3.3 V or HiZ.
 */
spi.spiSetCableSelect = function (cs) {
  let csByte = 0x02;

  if (cs) {
    csByte = 0x03;
  }

  this.port.write([csByte]);
};

/** Configure peripherals
 * @param {Object} opts - Configuration object with one or more of the following
 *                        properties:
 *                        power: true or false (default)
 *                        pullups: true or false (default)
 *                        aux: true or false (default)
 *                        cs: true or false (defautl)
 */
spi.spiSetPeripherals = function (opts) {
  if (typeof opts === "undefined") {
    return;
  }

  let optByte = 0x40;

  if (opts.power) {
    optByte |= 0x08;
  }

  if (opts.pullups) {
    optByte |= 0x04;
  }

  if (opts.aux) {
    optByte |= 0x02;
  }

  if (opts.cs) {
    optByte |= 0x01;
  }

  this.port.write([optByte]);
};

/** Write to SPI
 * @param {Buffer} data - buffer with data to be written.
 */
spi.spiWrite = function(data) {
  if (typeof data === "undefined") {
    return;
  }

  let cntr = 0;
  let maxLength = 16;

  while (cntr < data.length) {
    let cnt = Math.min(maxLength, data.length - cntr);
    let buf = Buffer.alloc(cnt + 1);

    buf[0] = 16 + (cnt - 1);
    cntr += data.copy(buf, 1, cntr, cntr + cnt);
    this.port.write(buf);
  }
};

/** Sniff SPI traffic
 * @param {Boolean} all - if true, the state of the CS pin is ignore;
 *                        if false, the traffic is considered only if CS is low
 *                        (default);
 */
spi.spiSniff = function(all) {
  let sniffByte = 0x14;

  if (all) {
    sniffByte = 0x13;
  }

  this.port.write([sniffByte]);
};

module.exports = spi;
