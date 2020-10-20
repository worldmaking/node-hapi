import * as THREE from './js/three.module.js';

import { OrbitControls } from './js/OrbitControls.js';
import { TubePainter } from './js/TubePainter.js';
import { VRButton } from './js/VRButton.js';
//import { OBJExporter } from './js/OBJExporter.js';
import { OBJLoader } from './js/OBJLoader.js';
//import { GLTFLoader } from './js/GLTFLoader.js';

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

const regEx_INI = /(\/*.json)/;
const regEx_HOU = /(\/*_HOU.json)/;
const regEx_GPT = /(\/*_GPT.json)/;
const directoryPath_WAITING = 'data/forLoading/done/'; //dump when done processing
const directoryPath_THREEJS = 'data/forLoading/THREE/'; //get
const directoryPath_HOUDINI = 'data/forLoading/HOUDINI/'; //give

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
      else {

        let msg = e.data;
				let obj;

        try {

          obj = JSON.parse( msg );
          if ( obj.cmd == "newFile" ) {

            state = obj.state;

          } else {

            log( "ws received", msg );

          }

        } catch( e ) {

        }

			}
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
let camera, controls, scene, renderer;
let table, floor, grid, box, light, fFx, tl, gui;

let controller1, controller2;
let painter1, painter2;
let cursor = new THREE.Vector3();

let result;

let vec2, vec3, vec4, quat, mat3, mat4;
vec3 = new THREE.Vector3();
vec3.set(0,0,0);

const mixers = [];
const clock = new THREE.Clock();

//
//TODO: setup for future
let arrayCamera;
let scenes = []; //scenes.add(scene);
let sceneObj = new THREE.Scene();
//

let model1, model2, model3;
let p1, p2, p3;
let data = null;

let i = 0;
let j = 0.5;
let k = -2;

//

function initialize() {

  console.log('initialize');
  //container = document.querySelector( '#scene-container' );
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x222222 );

  grid = new THREE.GridHelper(10, 10);
  scene.add(grid);
  box = new THREE.Box3Helper(new THREE.Box3(), 0x555555);
  box.visible = false;
  scene.add(box);

  createCamera();
  createControls();
  createLights();
  createBaseScene();
  createRenderer();
  setControllers();
  //openGui();
  loadModels();

  //

  try {
    sock = connect_to_server( {}, write );
  } catch ( e ) {
    console.error( e );
  }

  play();

}

//

function createCamera() {

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
  camera.position.set( 0, 1.6, 3 );

}

function createControls() {

  controls = new OrbitControls( camera, container ); //container
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
  table = new THREE.Mesh( geometry, material );
  table.position.y = 0.35;
  table.position.z = 0.85;
  scene.add( table );

  var geometry = new THREE.PlaneBufferGeometry( 4, 4 );
  var material = new THREE.MeshStandardMaterial( {
    color: 0x222222,
    roughness: 1.0,
    metalness: 0.0
  } );
  floor = new THREE.Mesh( geometry, material );
  floor.rotation.x = - Math.PI / 2;
  scene.add( floor );

  grid = new THREE.GridHelper( 10, 20, 0x111111, 0x111111 );
  // grid.material.depthTest = false; // avoid z-fighting
  scene.add( grid );

  //

  painter1 = new TubePainter();
  scene.add( painter1.mesh );

  painter2 = new TubePainter();
  scene.add( painter2.mesh );

}

function createRenderer() {

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  //renderer.setSize( container.clientWidth, container.clientHeight );
  renderer.setSize( window.innerWidth, window.innerHeight );

  renderer.setPixelRatio( window.devicePixelRatio );

  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;

  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.xr.enabled = true;

  container.appendChild( renderer.domElement );
  //document.body.appendChild( renderer.domElement );
  document.body.appendChild( VRButton.createButton( renderer ) );
  //document.body.appendChild( EnterXRButton.createButton( renderer ) );

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

//

function onWindowResize() {

  //camera.aspect = container.clientWidth / container.clientHeight;
  camera.aspect = window.innerWidth / window.innerHeight;

  // update the camera's frustum
  camera.updateProjectionMatrix();

  //renderer.setSize( container.clientWidth, container.clientHeight );
  renderer.setSize( window.innerWidth, window.innerHeight );

}

function openGui() {

  // gui
  gui = new dat.GUI();
  var guiProxy = { background: "#"+scene.background.getHexString() };
  var fScene = gui.addFolder("Scene");
  fScene.open();
  fScene.add(grid, "visible").name("Display Grid");
  fScene.add(box, "visible").name("Display BBox");
  fScene.add(light, "intensity", 0, 1).name("Light Intensity");
  fScene.addColor(guiProxy, "background").name("Background").onChange(() =>
    scene.background.set(guiProxy.background));
  fFx;

  // timeline
  tl = new dat.GUI({autoPlace: false, closeOnTop: true});
  var tlProxy = { val: 0 };
  tl.domElement.id = "tl_gui";
  timeline.appendChild(tl.domElement);
  tlController = tl.add(tlProxy, "val", 0, 1).name("Frame").listen().onChange(function(v) {
    data.fframe = v;
  }); 

}

//

function loadModels() {

  let n = 22
  // let vec = new THREE.Vector3();
  // vec.set(1,1,1);
  // console.log(`${vec.x} ${vec.y} ${vec.z}`)

  var v = new THREE.Vector3();
  var f = 'triangle1.obj';
  var d = 'data/forLoading/done/';
  n ++;
  v.set(-1,1,-1);
  console.log(`v1: ${v.x} ${v.y} ${v.z}`);
  load( n, f, d, v );

  var v = new THREE.Vector3();
  var f = 'triangle2.obj';

  n ++;
  v.set(-1,1.5,-1);
  console.log(`v2: ${v.x} ${v.y} ${v.z}`);
  load( n, f, d, v );

  var v = new THREE.Vector3();
  var f = 'triangle3.obj';

  n ++;
  v.set(-1,2,-1);
  console.log(`v3: ${v.x} ${v.y} ${v.z}`);
  load( n, f, d, v );

}

function load( n, f, d, v ) { //name, file, dir
  let modelName = 'TEST_' + n; //name
  //let f = 'triangle1.obj'; //file
  //let d = 'load/'; // dir
  let l = d + f;
  //let vec = v;
  // file to be an array? load multiple ?
  let loader = new OBJLoader();
  loader.name = modelName
  //let file = 'load/' + f;
  loader.load(
    l,
    // onLoad callback
    // Here the loaded data is assumed to be an object
    function ( obj ) {
      // Add the loaded object to the scene
      console.log(`${modelName} : ${loader.name} adding.. not yet, vecLoad:, ${v.x}, ${v.y}, ${v.z}`);

      obj.translateX(v.getComponent(0));
      obj.translateY(v.getComponent(1));
      obj.translateZ(v.getComponent(2));

      scene.add( obj );
    },

    // onProgress callback
    function ( xhr ) {
      console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },

    // onError callback
    function ( err ) {
      console.error( 'A load error happened', err );
    },

    // onMtl callback
    // function ( mtl ) {
    //   console.log('mtl');
    // }

  );
  //loader.setModelName( modelName );
  //loader.setLogging( true, true );
  //loader.setMaterials(;)

}

function exportModels_OBJ() {

  const exporter = new OBJExporter();

  let result = exporter.parse( scene );

  let file = 'scene/VR'
  //const content = JSON.stringify( loader.parse( text ).toJSON(), parseNumber );
  //fs.writeFileSync( file + '.obj', result, 'utf8' );

}

//

function checkForScenes() {

  try{
    sock.send("fileCheck");
  } catch( e ) {
    write( e );
  }

  if ( !state ) return;
  
  // var v = new THREE.Vector3();
  // v.set(-1, 0.5, -1.5);
  // v.set(-1, 0.5, -1.0);
  // v.set(-1, 0.5, -0.5);
  // v.set(-1, 0.5, 0.0);

  let z = k+j;
  let file = state.files;
  console.log(state.files);
  console.log(`client: ${file}`);
  var n = 'dynam_'+ i;
  var v = new THREE.Vector3();
  var f = file;
  var d = directoryPath_THREEJS;
  v.set(-1, 0.5, z);
  load( n, f, d, v );
  // .then( result => {
  //       try{
  //         sock.send("doneImport");
  //       } catch( e ) {
  //         write( e );
  //       }
  //     ;}).catch(err => console.error(err));
  i++;
  j+=0.5;
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
  console.log('end animation');

}

// perform any updates to the scene, called once per frame
// avoid heavy computation here
function update() {

  const delta = clock.getDelta();

  for ( const mixer of mixers ) {

    mixer.update( delta );

  }

}

// render, or 'draw a still image', of the scene
function render() {

  handleController( controller1 );
  handleController( controller2 );

  if ( i <= 4 ) checkForScenes();
  //checkForScenes(regEx_HOU);
  //checkForScenes(regEx_GPT);

  //respondToScenes();

  renderer.render( scene, camera );

  //if ( i == 4 ) stop();

}

window.addEventListener( 'resize', onWindowResize, false );

console.log('client VR');
initialize();
