const HFS = 'C:\\Program Files\\Side Effects Software\\Houdini 18.0.499'
// this is necessary in order that the module can find the Houdini dll libraries from the place it expects to:
process.env.PATH = `${HFS}\\bin;${process.env.PATH}`
// this might also be necessary at some point, I'm not sure:
process.env.HFS = HFS

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
    
    // GPT will create the kind of data used and sent by these calls in and out of node-hapi.cpp
    console.log('test');
    //hapi.test();
    console.log('testPoint');
    //hapi.testPoint();
    console.log('load');
    //hapi.load();    

    // setTimeout(()=>{
    // 	console.log("chao")
    // }, 100000)

    //requiring path and fs modules
    const path = require('path');
    const fs = require('fs');
    //joining path of directory 
    const directoryPath = path.join(__dirname, 'scenes');
    //const executionPath = path.join();

    const { spawn, exec, execFile } = require('child_process');
    const { spawnSync, execSync, execFileSync } = require( 'child_process' );

    let regEx = /(\/*.obj)/;

    try {
      //passsing directoryPath and callback function
      fs.readdir(directoryPath, function (err, files) {
          //handling error
          if (err) {
              return console.log('Unable to scan directory: ' + err);
          } 
          //listing all files using forEach
          console.log(regEx);
          files.forEach(function (file) {
              // Do whatever you want to do with the file
              let match = file.match(regEx);
              if ( match ) {
                console.log(`\nattempting to convert to json`, file);
                // useage
                // node -r esm obj2three.js model.obj

                try {
                  //let directoryFile = path.join(directoryPath, 'obj2three.js');
                  //var convert = spawn('node',['-r','esm', directoryFile, file],[{shell: true},  { stdio: ['pipe', 'pipe', 'pipe'] }]);
                  const cmd = 'node -r esm obj2three.js scenes/' + file; 
                  const convert = execSync(
                    cmd,
                    {
                      //cwd: 'node-hapi/',
                      stdio: ['pipe', 'pipe', 'pipe']
                    });
                  
                  // convert.stdin.on('data', (data) => {
                  //   console.log(`stdin: ${data}`);
                  // });
                  
                  // convert.stderr.on('data', (data) => {
                  //   console.log(`stderr: ${data}`);
                  // });                  

                  // convert.stdout.on('data', (data) => {
                  //   console.log(`stdout: ${data}`);
                  // });
                  
                  // convert.on('close', (code) => {
                  //   console.log(`child process close all stdio with code ${code}`);
                  // });
                  
                  // convert.on('exit', (code) => {
                  //   console.log(`child process exited with code ${code}`);
                  // });

                } catch (error) {
                  console.log(`error: `, error);
                }

              } 
          });
      });
    } catch( error ) {
      write( `file conversion error: ${error}` );
    }  


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