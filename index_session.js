const HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.597'
// this is necessary in order that the module can find the Houdini dll libraries from the place it expects to:
process.env.PATH = `${HFS}\\bin;${process.env.PATH}`
// this might also be necessary at some point, I'm not sure:
process.env.HFS = HFS

const hapi = require('bindings')('hapi.node');

const net = require('net')
const HOST = 'localhost'
const PORT = 8080
const client = new net.Socket()

const path = require('path');
const fs = require('fs');
const directoryPath = path.join(__dirname, 'scenes');

const { spawn, exec, execFile } = require('child_process');
const { spawnSync, execSync, execFileSync } = require( 'child_process' );

let state = {
  files: {},
}
exports.state = state;

client.connect(PORT, HOST, function() {

  console.log('CONNECTED TO: ' + HOST +':'+ PORT)

  let session = hapi.open({
    onTest: function(eventID, ...args) {
      //function(eventID, buf)
      console.log("testing build", eventID, args.join(","));

      console.log('test');
      session.test();

      client.write(Buffer.from(session.test()));

      let regEx = /(\/*.obj)/;
      try {
        fs.readdir(directoryPath, function (err, files) {
            if (err) {
              return console.log('Unable to scan directory: ' + err);
            } 
            console.log(regEx);
            files.forEach(function (file) {
                let match = file.match(regEx);
                if ( match ) {
                  console.log(`\nattempting to convert to json`, file);
                  try {
                    const cmd = 'node -r esm obj2three.js scenes/' + file; 
                    const convert = execSync(
                      cmd,
                      {
                        //cwd: 'node-hapi/',
                        stdio: ['pipe', 'pipe', 'pipe']
                      });
                      state.file = convert;
                  } catch (error) {
                    console.log(`error: `, error);
                  }
                } 
            });
        });
      } catch( error ) {
        client.write( `file conversion error: ${error}` );
      }
      // console.log('testPoint');
      // session.testPoint();
    },

    onLoad: function(eventID, ...args) {

      console.log("loading", eventID, args.join(","))
      
      console.log('load');
      session.load();   

    },
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
  // setTimeout(()=>{
  // 	console.log("chao")
  // }, 100000)
})