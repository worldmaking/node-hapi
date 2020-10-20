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
const regEx = /(\/*e.json)/;
const directoryPath = path.join(__dirname, 'client/load');

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

				console.log("hi")

				//ws.send(JSON.stringify({ cmd:"newData", state: manus.state }))
				//ws.send(JSON.stringify({ cmd: "trackingData", state:getTrackingData() }))

			} else if (msg == "sendHaptics") {

				console.log("hi")

			} else if (msg == "loadOBJ") {

				//console.log("loading OBJ...");

				try {
					//passing directoryPath and callback function
					fs.readdir(directoryPath, function (err, files) {
							//handling error
							if (err) {
									return console.log('Unable to scan directory: ' + err);
							}
							//listing all files using forEach
							files.forEach(function (file) {
									// Do whatever you want to do with the file
									let match = file.match(regEx);
									if ( match ) {
										try {

												hapi.state.file = file;//'triangle.json'
												//console.log(hapi.state.file);
												ws.send(JSON.stringify({ cmd: "load", state: hapi.state }))

										} catch (error) {
											console.log(`error: `, error);
										}
									} else {
										hapi.state.file = {};
										//console.log(hapi.state.file);
									}
							});
					});
				} catch( error ) {
					console.log( `nothing to find: ${error}` );
				}

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