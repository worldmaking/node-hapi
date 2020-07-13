import * as THREE from './js/three.module.js';
import { OrbitControls } from './js/OrbitControls.js';
import { TubePainter } from './js/TubePainter.js';
import { VRButton } from './js/VRButton.js';
//import { EnterXRButton } from './js/webxr-button.js';
//let EnterXRButton = new window.XRDeviceButton;

let state = null;
let sock;

let log = document.getElementById( "log" );
let state_div = document.getElementById( "state" );

let msgs = [];

//  //*************************************** // SERVER // ********************************************//
function write( ...args ) {

  if( msgs.length > 15 ) {

    msgs.shift();
  
  }

  let msg = args.join( ", " );
  msgs.push( msg );
  let fMsg = msgs.join( "\n" );

  log.innerText = "";
  log.innerText +=  "Log: \n " + fMsg;
  
  console.log( msg );
}

function connect_to_server( opt, log ) {

	let self = {
    transport: opt.transport || "wss",
		hostname: opt.hostname || window.location.hostname,
		port: opt.port || window.location.port,
		protocols: opt.protocols || [],
		reconnect_period: 50000,
		reload_on_disconnect: true,
		socket: null,
  };
  
  self.addr = self.transport + '://' + self.hostname + ':' + self.port;
	
	let connect = function() {
  
    self.socket = new WebSocket( self.addr, self.protocols );
		self.socket.binaryType = 'arraybuffer';
    //self.socket.onerror = self.onerror;
    
		self.socket.onopen = function() {

			log( "websocket connected to " + self.addr );
			// ...
  
    }
  
    self.socket.onmessage = function( e ) { 
  
      if ( e.data instanceof ArrayBuffer ) {
  
        // if (onbuffer) {
				// 	//onbuffer(e.data, e.data.byteLength);
				// } else {

        log( "ws received arraybuffer of " + e.data.byteLength + " bytes" )

        //}

      } 
      // else {
  
      //   let msg = e.data;
			// 	let obj;
  
      //   try {
  
      //     obj = JSON.parse( msg );
  
      //   } catch( e ) {}
  
      //   if ( obj.cmd == "newData" ) {
  
      //     state = obj.state;
  
			// 	} else {
          
      //     log( "ws received", msg );
  
      //   }
			// } 
		}
  
    self.socket.onclose = function( e ) {
  
      self.socket = null;

			setTimeout( function() {
  
        if ( self.reload_on_disconnect ) {
  
          window.location.reload( true );
  
        } else {
  
          log( "websocket reconnecting" );

					connect();
  
        }
			}, self.reconnect_period );		
  
      //if (onclose) onclose(e);
			log( "websocket disconnected from " + self.addr );
  
    }

		self.send = function( msg ) {
  
      if ( !self.socket ) { console.warn( "socket not yet connected" ); return; }
			if ( self.socket.readyState != 1 ) { console.warn( "socket not yet ready" ); return; }
			if ( typeof msg !== "string" ) msg = JSON.stringify( msg );
  
      self.socket.send( msg );
  
    }
	}

	connect();

	return self;
}

//  //*************************************** // INITIALIZE // ********************************************//

var container;
var camera, scene, renderer;
var controller1, controller2;

var cursor = new THREE.Vector3();

var controls;

init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x222222 );

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
  camera.position.set( 0, 1.6, 3 );

  controls = new OrbitControls( camera, container );
  controls.target.set( 0, 1.6, 0 );
  controls.update();

  var geometry = new THREE.BoxBufferGeometry( 0.5, 0.8, 0.5 );
  var material = new THREE.MeshStandardMaterial( {
    color: 0x444444,
    roughness: 1.0,
    metalness: 0.0
  } );
  var table = new THREE.Mesh( geometry, material );
  table.position.y = 0.35;
  table.position.z = 0.85;
  scene.add( table );

  var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
  var material = new THREE.MeshStandardMaterial( {
    color: 0x222222,
    roughness: 1.0,
    metalness: 0.0
  } );
  var floor = new THREE.Mesh( geometry, material );
  floor.rotation.x = - Math.PI / 2;
  scene.add( floor );

  var grid = new THREE.GridHelper( 10, 20, 0x111111, 0x111111 );
  // grid.material.depthTest = false; // avoid z-fighting
  scene.add( grid );

  scene.add( new THREE.HemisphereLight( 0x888877, 0x777788 ) );

  var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
  light.position.set( 0, 4, 0 );
  scene.add( light );

  //

  var painter1 = new TubePainter();
  scene.add( painter1.mesh );

  var painter2 = new TubePainter();
  scene.add( painter2.mesh );

  //


  ////////////////////
  // get triangle from houdini .obj output ?

  var loader = new THREE.ObjectLoader();

  loader.load(
    // resource URL
    "geometry.json",

    // onLoad callback
    // Here the loaded data is assumed to be an object
    function ( obj ) {
      // Add the loaded object to the scene
      scene.add( obj );
    },

    // onProgress callback
    function ( xhr ) {
      console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // onError callback
    function ( err ) {
      console.error( 'An error happened' );
    }
  );



  ///////////////////


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  document.body.appendChild( VRButton.createButton( renderer ) );
  //document.body.appendChild( EnterXRButton.createButton( renderer ) );

  // controllers

  function onSelectStart() {

    this.userData.isSelecting = true;

  }

  function onSelectEnd() {

    this.userData.isSelecting = false;

  }

  function onSqueezeStart() {

    this.userData.isSqueezing = true;
    this.userData.positionAtSqueezeStart = this.position.y;
    this.userData.scaleAtSqueezeStart = this.scale.x;

  }

  function onSqueezeEnd() {

    this.userData.isSqueezing = false;

  }

  controller1 = renderer.xr.getController( 0 );
  controller1.addEventListener( 'selectstart', onSelectStart );
  controller1.addEventListener( 'selectend', onSelectEnd );
  controller1.addEventListener( 'squeezestart', onSqueezeStart );
  controller1.addEventListener( 'squeezeend', onSqueezeEnd );
  controller1.userData.painter = painter1;
  scene.add( controller1 );

  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  controller2.addEventListener( 'squeezestart', onSqueezeStart );
  controller2.addEventListener( 'squeezeend', onSqueezeEnd );
  controller2.userData.painter = painter2;
  scene.add( controller2 );

  //

  var geometry = new THREE.CylinderBufferGeometry( 0.01, 0.02, 0.08, 5 );
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshStandardMaterial( { flatShading: true } );
  var mesh = new THREE.Mesh( geometry, material );

  var pivot = new THREE.Mesh( new THREE.IcosahedronBufferGeometry( 0.01, 2 ) );
  pivot.name = 'pivot';
  pivot.position.z = - 0.05;
  mesh.add( pivot );

  controller1.add( mesh.clone() );
  controller2.add( mesh.clone() );

  //

  window.addEventListener( 'resize', onWindowResize, false );

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }


}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function handleController( controller ) {

  var userData = controller.userData;
  var painter = userData.painter;

  var pivot = controller.getObjectByName( 'pivot' );

  if ( userData.isSqueezing === true ) {

    var delta = ( controller.position.y - userData.positionAtSqueezeStart ) * 5;
    var scale = Math.max( 0.1, userData.scaleAtSqueezeStart + delta );

    pivot.scale.setScalar( scale );
    painter.setSize( scale );

  }

  cursor.setFromMatrixPosition( pivot.matrixWorld );

  if ( userData.isSelecting === true ) {

    painter.lineTo( cursor );
    painter.update();

  } else {

    painter.moveTo( cursor );

  }

}

function animate() {

  renderer.setAnimationLoop( render );

}

function render() {

  handleController( controller1 );
  handleController( controller2 );

  renderer.render( scene, camera );

}
