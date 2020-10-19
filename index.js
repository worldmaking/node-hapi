const HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.597';
// this is necessary in order that the module can find the Houdini dll libraries from the place it expects to:
process.env.PATH = `${HFS}\\bin;${process.env.PATH}`;
process.env.HFS = HFS;

const hapi = require('bindings')('hapi.node');

const net = require('net');

const HOST = 'localhost';
const PORT = 8080;

const client = new net.Socket();

let state = {
  files: {},
}

exports.state = state;

client.connect(PORT, HOST, function() {

  console.log('CONNECTED TO: ' + HOST +':'+ PORT);

    // GPT will create the kind of data used and sent by these calls in and out of node-hapi.cpp
    console.log('test');

    //TODO: make one import and one export after testing FBX
    //for now "make" an object/scene and save as .hip .obj .FBX
    //TODO: use pass-in for declaring what ext type

    hapi.make_OBJ();
    hapi.load_hdanc();
    hapi.import_FBX();
    hapi.export_FBX();

    //console.log('testPoint');
    hapi.testPoint();
    // setTimeout(()=>{
    // 	console.log("chao")
    // }, 100000)

})

  client.on('data', function(data) {

      console.log('on "DATA":', typeof data, data.byteLength, data.byteOffset, data)

      // let pkt = data.buffer
      // session.process(pkt)
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

  console.log(exports.state);