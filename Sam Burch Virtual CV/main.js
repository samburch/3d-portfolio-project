import './style.css'

import * as THREE from 'three'
import { Perlin } from './perlin-helper'
import { OrbitControls } from 'three/examples/jsm/controls//OrbitControls'
import * as dat from 'dat.gui'

let camera, scene, renderer;

let mesh, geometry, material, clock, pointlight, scrollDown;

const width = window.innerWidth, height = window.innerHeight;

let perlin = new Perlin();

const params = {

  peak: 15,
  smooth: 50,
  speed: 10,
  segmentX: 80,
  segmentY: 80,
  color: 0xFF866C

}

init()
animate()

function init() {

  clock = new THREE.Clock();

  // Scene

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xffffff, 1, 500)

  // Renderer

  const canvas = document.querySelector('#bg');
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
  });

  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )

  // Camera

  camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 800 )
  camera.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2.2)
  camera.translateY(150);

  // Lighting

  const ambient = new THREE.AmbientLight(0xffffff);
  pointlight = new THREE.PointLight(0xffffff);
  pointlight.position.set(-10,100,10);
  scene.add( ambient, pointlight);

  const sphereSize = 1;
  const pointLightHelper = new THREE.PointLightHelper( pointlight, sphereSize );
  scene.add( pointLightHelper );

  // Helpers

  const camhelper = new THREE.CameraHelper( camera )
  scene.add( camhelper )

  const controls = new OrbitControls(camera, renderer.domElement)
  const gsize = 1000
  const gdivisions = 1000
  const gridHelper = new THREE.GridHelper( gsize, gdivisions )
  const axesHelper = new THREE.AxesHelper(10);
  scene.add( gridHelper, axesHelper )
  const dir = new THREE.Vector3( 0, 0, 1 );
  //normalize the direction vector (convert to vector of length 1)
  dir.normalize();

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize( window.innerWidth, window.innerHeight )

  }

  window.addEventListener( 'resize', onWindowResize )

  // Geometry setup

  geometry = new THREE.PlaneBufferGeometry(300, 300, params.segmentX, params.segmentY);
  material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide, color: params.color } );
  mesh = new THREE.Mesh( geometry, material );
  mesh.rotation.x = Math.PI / 2;

  mesh.geometry.attributes.position.setUsage( THREE.DynamicDrawUsage );
  mesh.geometry.computeVertexNormals();
  scene.add(mesh);

  // DAT.GUI Related Stuff

  var options = {
    velx: 0,
    vely: 0,
    camera: {
      speed: 0.0001
    },
    stop: function() {
      this.velx = 0;
      this.vely = 0;
    },
    reset: function() {
      this.velx = 0.1;
      this.vely = 0.1;
      camera.position.z = 75;
      camera.position.x = 0;
      camera.position.y = 0;
      mesh.scale.x = 1;
      mest.scale.y = 1;
      mesh.scale.z = 1;
      mesh.material.wireframe = true;
    }
  };


  var gui = new dat.GUI();

  var cam = gui.addFolder('Camera');
  cam.add(options.camera, 'speed', 0, 0.0010).listen();
  cam.add(camera.position, 'x', 0, 100).name('Pos X').listen();
  cam.add(camera.position, 'y', 0, 100).name('Pos Y').listen();
  cam.close();

  var velocity = gui.addFolder('Velocity');
  velocity.add(options, 'velx', -0.2, 0.2).name('X').listen();
  velocity.add(options, 'vely', -0.2, 0.2).name('Y').listen();
  velocity.close();

  var noise = gui.addFolder('Perlin noise');
  noise.add(params, 'peak', 0, 100).name('Peak').listen();
  noise.add(params, 'smooth', 0, 100).name('Smoothness').listen();
  noise.add(params, 'segmentX', 0, 250).name('Segments').onChange(function( value ) {

    scene.remove( mesh );
    geometry = new THREE.PlaneBufferGeometry(300, 300, value, value);
    mesh = new THREE.Mesh( geometry, material );
    mesh.rotation.x = Math.PI / 2;
    scene.add( mesh );

  });
  noise.add(params, 'speed', 0, 100).name('Speed').listen();
  noise.open();

  var col = gui.addFolder( 'Material colour' );
  col.addColor( params, 'color' ).name('Colour').onChange( function() { 
    
    mesh.material.color.set( params.color );
  
  });
  col.open();

  var box = gui.addFolder('Mesh');
  box.add(mesh.scale, 'x', 0, 3).name('Width').listen();
  box.add(mesh.scale, 'y', 0, 3).name('Height').listen();
  box.add(mesh.scale, 'z', 0, 3).name('Length').listen();
  box.add(mesh.material, 'wireframe').listen();
  box.close();

  gui.add(options, 'stop');
  gui.add(options, 'reset');

}

function terrain() {

  const geoArray = geometry.attributes.position.array;

  for (var i = 0; i < geoArray.length; i += 3) {

    geoArray[i + 2] = params.peak * perlin.noise(

      ( mesh.position.x + geoArray[i])/ params.smooth, 
      ( mesh.position.z + geoArray[i+1])/ params.smooth

    )

  }

  mesh.geometry.computeVertexNormals();
  mesh.geometry.attributes.position.needsUpdate = true;

}

  // Camera scroll
  function moveCamera() {

    var lastScrollTop = 0;

      window.addEventListener("scroll", function() {

        var st = window.pageYOffset || document.documentElement.scrollTop;

        if (st > lastScrollTop){

            console.log("Down scroll");
            scrollDown = true;
            // downscroll code
        } else {
            // upscroll code
            console.log("Up scroll");
            scrollDown = false;
        }
        lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling

      }, true);
      
    const top = document.body.getBoundingClientRect().top;

    }

  // document.body.onscroll = moveCamera;

function update() {

  let delta = clock.getDelta();

  switch(scrollDown) {

    case false: 

      mesh.position.z += params.speed * delta;
      camera.position.z += params.speed * delta;
      pointlight.position.z += params.speed * delta;
      break;

    case true:

      mesh.position.z -= params.speed * delta;
      camera.position.z -= params.speed * delta;
      pointlight.position.z -= params.speed * delta;
      break;

  }

  terrain();

}

// Animate scene

function animate() {

  render();
  moveCamera();
  terrain();
  update();
  requestAnimationFrame( animate );

}

// Render scene

function render() {

  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

}