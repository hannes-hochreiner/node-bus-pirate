var BusPirate = require('../BusPirate');

var busPirate = new BusPirate({
  port: '/dev/buspirate'
});

busPirate.on('open', () => {
  busPirate.start();
});

busPirate.on('ready', () => {
  busPirate.spiInit();
  busPirate.spiSetPeripherals({
    power: true,
    cs: false
  });
  busPirate.spiConfig({
    pinOutput: "HiZ"
  });
  //busPirate.spiSniff(true);
  busPirate.spiWrite(Buffer.from([0x5a, 0xFF]));
});

process.on('SIGINT', function(){
  busPirate.reset();
  setTimeout(() => { process.exit(); }, 1000);
});
