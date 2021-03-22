#!/usr/bin/env node

const hapi = require("./index.js")

//const http = require('http');
const https = require('https');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");

const express = require('express');
const WebSocket = require('ws');

// const { JSDOM } = require( "jsdom" );
// const { window } = new JSDOM( "" );
// const $ = require( "jquery" )( window );
//const regEx = /(\/dynamic*)/;
const directoryPath_WAITING = path.join(__dirname, 'client/data/forLoading/done/'); //dump when done processing
const directoryPath_THREEJS = path.join(__dirname, 'client/data/forLoading/THREE/'); //alert if new
const directoryPath_HOUDINI = path.join(__dirname, 'client/data/forLoading/HOUDINI/'); //alert if new

console.log(directoryPath_THREEJS);

const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");

const useAuth = true;
const options = {
	key: fs.readFileSync('certs/server-key.pem'),
	cert: fs.readFileSync('certs/server-crt.pem'),
	ca: fs.readFileSync('certs/ca_client-crt.pem'),
	//crl: fs.readFileSync('certs/ca-crl.pem'),
  //requestCert: false, //true,
  //rejectUnauthorized: false
};

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
	res.sendFile(path.join(client_path, 'index.html'));
});

app.use(function (req, res, next) {
	var log = new Date() + ' ' + req.connection.remoteAddress + ' ' + req.method + ' ' + req.url;
	var cert = req.socket.getPeerCertificate();
	if (cert.subject) {
			log += ' ' + cert.subject.CN;
	}
	console.log(log);
	next();
});


if (useAuth) {
	//cert authorization
	app.use(function (req, res, next) {
			if (!req.client.authorized) {
					return res.status(401).send('User is not authorized');
			}
			next();
	});

	options.requestCert = true;
	options.rejectUnauthorized = false;
}

app.use(function (req, res, next) {
	res.writeHead(200);
	res.end("hello world\n");
	next();
});

//app.get('*', function(req, res) { console.log(req); });
//const server = http.createServer(app);
const server = https.createServer(options, app);
//const server = https.createServer( app );
const wss = new WebSocket.Server({
	server: server,
	maxPayload: 1024 * 1024,
});

function send_all_clients(msg, ignore) {
	wss.clients.forEach(function each(client) {
		if (client == ignore) return;
		try {
			client.send(msg);
		} catch (e) {
			console.error(e);
		};
	});
}


// whenever a client connects to this websocket:
let sessionId = 0;
wss.on('connection', function(ws, req) {

	// do any
	console.log("server received a connection");

	console.log("server has "+wss.clients.size+" connected clients");
	//	ws.id = uuid.v4();
	const id = ++sessionId;
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	ws.on('error', function (e) {
		if (e.message === "read ECONNRESET") {
			// ignore this, client will still emit close event
		} else {
			console.error("websocket error: ", e.message);
		}
	});

	// what to do if client disconnects?
	ws.on('close', function(connection) {
		console.log("connection closed");
        console.log("server has "+wss.clients.size+" connected clients");
	});

	// respond to any messages from the client:
	ws.on('message', function(msg) {
		if (msg instanceof Buffer) {
			// get an arraybuffer from the message:
			const ab = msg.buffer.slice(msg.byteOffset,msg.byteOffset+msg.byteLength);
			console.log("received arraybuffer", ab);
			// as float32s:
			//console.log(new Float32Array(ab));

		} else {

			if (msg == "getData") {
				// reply:

				console.log("hi");

				//ws.send(JSON.stringify({ cmd:"newData", state: manus.state }))
				//ws.send(JSON.stringify({ cmd: "trackingData", state:getTrackingData() }))

			} else if (msg == "sendHaptics") {

				console.log("hi");
				//ws.send(JSON.stringify({ cmd:"newData", state: haptics.state }))
				//ws.send(JSON.stringify({ cmd: "trackingData", state:getHapticsData() }))

			} else if (msg == "fileCheck") {

				console.log("SERVER SEES REQUEST FOR FILE CHECK");
				let regEx = /(\/*.obj)/;

				try {

					fs.readdir(directoryPath_THREEJS, function (err, files) {

						if (err) {
							return console.log('Unable to scan directory: ' + err);
						}

						console.log(regEx);

						files.forEach(function (file) {

							//console.log(file);
							let match = file.match(regEx);

							if ( match ) {

								let b = path.basename(file, '.obj');
								let f = path.join('THREE', path.basename(file, '.obj'));

								try {

										hapi.state.files = file;
										console.log(hapi.state.file);
										ws.send(JSON.stringify({ cmd: "newFile", state: hapi.state }));

								} catch (error) {

									console.log(`error: `, error);

								}
							} else {

								//console.log('no match');
								//hapi.state.files = {};

							}

						});

					});

				} catch( error ) {
					client.write( `file conversion error: ${error}` );
				}

			} else if (msg == "doneImport") {

				console.log(`\nattempting to moving file out of directory`, file);
				// try {
				// 	const cmd = 'node -r esm obj2three.js scenes/' + file;
				// 	const convert = execSync(
				// 		cmd,
				// 		{
				// 			//cwd: 'node-hapi/',
				// 			stdio: ['pipe', 'pipe', 'pipe']
				// 		});
				// 		state.file = convert;
				// } catch (error) {
				// 	console.log(`error: `, error);
				// }

			} else {
				console.log("received message from client:", id, msg);
			}
		}
	});

	// Example sending binary:
	const array = new Float32Array(5);
	for (var i = 0; i < array.length; ++i) {
		array[i] = i / 2;
	}
    ws.send(array);

    send_all_clients("hi")
});

server.listen(8080, function() {
	console.log(`\n\n\n****************`);
	console.log(`****************`);
	console.log(`server listening`);
	console.log(`client view on https://localhost:${server.address().port}/index.html\n\n`);
});