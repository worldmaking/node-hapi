const HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.499'
// this is necessary in order that the module can find the Houdini dll libraries from the place it expects to:
process.env.PATH = `${HFS}\\bin;${process.env.PATH}`
// this might also be necessary at some point, I'm not sure:
//process.env.HFS = HFS

const hapi = require('bindings')('hapi.node');

const net = require('net')

const HOST = 'localhost'
const PORT = 8080

const client = new net.Socket()

let state = {
  devices: {},
}

exports.state = state;

client.connect(PORT, HOST, function() {

  console.log('CONNECTED TO: ' + HOST +':'+ PORT)
  
  //let session = hapi.open({
    // just a quick test to make sure it works

    //client.write(Buffer.from(session.test())
    //session.load();
    
    hapi.test()
    
    //hapi.load()
    //hapi.testPoint()

    // setTimeout(()=>{

    // 	console.log("chao")
    // }, 100000)

//})

  client.on('data', function(data) {

      console.log('on "DATA":', typeof data, data.byteLength, data.byteOffset, data)

      let pkt = data.buffer
      //session.process(pkt)
    // console.log('NODE: after process data.buffer')

  })

  client.on('close', function() {
      //session.close()
      console.log('session.close | Connection closed')
  })

  client.on('error', function(err) {
      console.log("socket error", err) 
      //session.close()
      client.disconnect()
      socket.close()
      // disconnect client & session.close() ?
  })

  console.log("ok")
  //client.write(Buffer.from(session.handshake(1)))

})