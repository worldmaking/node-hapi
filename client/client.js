import * as THREE from './js/three.module.js';

import { OrbitControls } from './js/OrbitControls.js';
import { TubePainter } from './js/TubePainter.js';
import { VRButton } from './js/VRButton.js';
//import { OBJExporter } from './js/OBJExporter.js';

// import fs from 'fs';
// import path from 'path';

//import { EnterXRButton } from './js/webxr-button.js';
//let EnterXRButton = new window.XRDeviceButton;

//  //*************************************** // SERVER // ********************************************//
let state = null;
let sock;

let log = document.getElementById( "log" );
let state_div = document.getElementById( "state" );

let msgs = [];

//

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


//  //************************************** // INITIALIZE // *****************************************//
let container;
let camera, scene, renderer;

let controller1, controller2;
let painter1, painter2;

let cursor = new THREE.Vector3();

let controls;

const mixers = [];
const clock = new THREE.Clock();

const regEx_INI = /(\/*.json)/;
const regEx_HOU = /(\/*_HOU.json)/;
const regEx_GPT = /(\/*_GPT.json)/;

//

function initialize() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x222222 );

  createCamera();
  createControls();
  createLights();
  createBaseScene();
  createRenderer();
  //loadModels_OBJ();// _GLTF _OBJ
  setControllers();

  //

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }

  play();


}

function createCamera() {

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
  camera.position.set( 0, 1.6, 3 );

}

function createControls() {
  
  controls = new OrbitControls( camera, container );
  controls.target.set( 0, 1.6, 0 );
  controls.update();

}

function createLights() {

  const ambientLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 5 );

  const mainLight = new THREE.DirectionalLight( 0xffffff, 5 );
  mainLight.position.set( 10, 10, 10 );

  scene.add( ambientLight, mainLight );

}

function createBaseScene() {

  var geometry = new THREE.BoxBufferGeometry( 0.5, 0.8, 0.5 );
  var material = new THREE.MeshStandardMaterial( {
    color: 0x444444,
    roughness: 1.0,
    metalness: 0.0
  } );
  let table = new THREE.Mesh( geometry, material );
  table.position.y = 0.35;
  table.position.z = 0.85;
  scene.add( table );

  var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
  var material = new THREE.MeshStandardMaterial( {
    color: 0x222222,
    roughness: 1.0,
    metalness: 0.0
  } );
  let floor = new THREE.Mesh( geometry, material );
  floor.rotation.x = - Math.PI / 2;
  scene.add( floor );

  let grid = new THREE.GridHelper( 10, 20, 0x111111, 0x111111 );
  // grid.material.depthTest = false; // avoid z-fighting
  scene.add( grid );

  //

  painter1 = new TubePainter();
  scene.add( painter1.mesh );

  painter2 = new TubePainter();
  scene.add( painter2.mesh );

}

function setControllers() {
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
  
    let geometry = new THREE.CylinderBufferGeometry( 0.01, 0.02, 0.08, 5 );
    geometry.rotateX( - Math.PI / 2 );
    let material = new THREE.MeshStandardMaterial( { flatShading: true } );
    let mesh = new THREE.Mesh( geometry, material );
  
    let pivot = new THREE.Mesh( new THREE.IcosahedronBufferGeometry( 0.01, 2 ) );
    pivot.name = 'pivot';
    pivot.position.z = - 0.05;
    mesh.add( pivot );
  
    controller1.add( mesh.clone() );
    controller2.add( mesh.clone() );

}

function createRenderer() {

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( container.clientWidth, container.clientHeight );
  //renderer.setSize( window.innerWidth, window.innerHeight );
  
  renderer.setPixelRatio( window.devicePixelRatio );
  
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;

  renderer.outputEncoding = THREE.sRGBEncoding;
  
  renderer.xr.enabled = true;

  container.appendChild( renderer.domElement );
  document.body.appendChild( VRButton.createButton( renderer ) );
  //document.body.appendChild( EnterXRButton.createButton( renderer ) );


}

//

function onWindowResize() {

  camera.aspect = container.clientWidth / container.clientHeight;
  //camera.aspect = window.innerWidth / window.innerHeight;
  
  // update the camera's frustum
  camera.updateProjectionMatrix();

  renderer.setSize( container.clientWidth, container.clientHeight );
  //renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function loadModels_OBJ() { //(file)
  console.log('loading...');
  // file to be an array? load multiple ?
  const loader = new THREE.ObjectLoader();
  loader.load(
    // resource URL
    'triangle.json',
    //file,
  
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
      console.error( 'A load error happened', err );
    }

  );

}

function exportModels_OBJ() {
  
  const exporter = new OBJExporter();

  let result = exporter.parse( scene );

  let file = 'scene/VR'
  //const content = JSON.stringify( loader.parse( text ).toJSON(), parseNumber );
  //fs.writeFileSync( file + '.obj', result, 'utf8' );

}

//

function loadModels_GLTF(file) {

  const loader = new THREE.GLTFLoader();
  // make file an array

  // A reusable function to set up the models. We're passing in a position parameter
  // so that they can be individually placed around the scene
  const onLoad = ( gltf, position ) => {

    const model = gltf.scene.children[ 0 ];
    model.position.copy( position );

    const animation = gltf.animations[ 0 ];

    const mixer = new THREE.AnimationMixer( model );
    mixers.push( mixer );

    const action = mixer.clipAction( animation );
    action.play();

    scene.add( model );

  };

  // the loader will report the loading progress to this function
  const onProgress = () => {};

  // the loader will send any error messages to this function, and we'll log
  // them to to console
  const onError = ( errorMessage ) => { console.log( errorMessage ); };

  //

  // load the first model. Each model is loaded asynchronously,
  // so don't make any assumption about which one will finish loading first
  const flamingoPosition = new THREE.Vector3( 7.5, 0, -10 );
  //loader.load( 'models/Flamingo.glb', gltf => onLoad( gltf, flamingoPosition ), onProgress, onError );


}

function exportModels_GLTF() {

  console.log('export GLTF');

}

//

function checkForScenes(match) {

  //joining path of directory 
  //const directoryPath = 'cd ..\\scenes\\';
  const directoryPath = 'cd ..';
  //const directoryPath = path.join(__dirname, 'scenes');

  const regEx = match; // /(\/*.json)/;

  try {
    
    //passsing directoryPath and callback function
    //fs.readdir(directoryPath, function (err, files) {
        
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
              
              console.log(`found new scene`, file);
              
              loadModels_OBJ(file);

            } 

        });

    //});

  } catch( error ) {

    write( `file conversion error: ${error}` );

  }    

  
}

function respondToScenes() {
  
  console.log(`output threejs scene as GLTF to AI check folder`);
  
  exportModels_GLTF();

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

//

function play() {

  renderer.setAnimationLoop( () => {

    update();
    render();

  } );

}

function stop() {

  renderer.setAnimationLoop( null );

}

// perform any updates to the scene, called once per frame
// avoid heavy computation here
function update() {

  const delta = clock.getDelta();

  // for ( const mixer of mixers ) {

  //   mixer.update( delta );

  // }

}

// render, or 'draw a still image', of the scene
function render() {

  handleController( controller1 );
  handleController( controller2 );

  //checkForScenes(regEx_INI);
  //checkForScenes(regEx_HOU);
  //checkForScenes(regEx_GPT);
  
  //respondToScenes();

  renderer.render( scene, camera );
  //stop();

}

window.addEventListener( 'resize', onWindowResize, false );

initialize();
