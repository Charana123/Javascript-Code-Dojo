var camera, controls, scene, renderer;

var mouseX = 0, mouseY = 0;


scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.002 );

renderer = new THREE.WebGLRenderer();
renderer.setClearColor( scene.fog.color );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000 );
camera.position.z = 300;

scene.add(camera);


// lights
var ambientLight = new THREE.AmbientLight( 0xffffff );
scene.add( ambientLight );

var lights = [];
lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

lights[ 0 ].position.set( 0, 200, 0 );
lights[ 1 ].position.set( 100, 200, 100 );
lights[ 2 ].position.set( - 100, - 200, - 100 );

scene.add( lights[ 0 ] );
scene.add( lights[ 1 ] );
scene.add( lights[ 2 ] );



var materials = [
	new THREE.MeshLambertMaterial( { color: 0xEB5D68 } ), // red
	new THREE.MeshLambertMaterial( { color: 0xF3B236 } ), // Yellow
	new THREE.MeshLambertMaterial( { color: 0x268D75 } ), // Green
	new THREE.MeshLambertMaterial( { color: 0x156790 } ), // blue
];

// Pivots
var pivots = [];

// Rings
var rings = [];
rings[0] = new THREE.Mesh( new THREE.CylinderGeometry( 42, 42, 10, 42, 1, 1 ), materials[0] );
rings[1] = new THREE.Mesh( new THREE.CylinderGeometry( 69, 69, 10, 42, 1, 1 ), materials[1] );
rings[2] = new THREE.Mesh( new THREE.CylinderGeometry( 120, 120, 10, 42, 1, 1 ), materials[2] );
rings[3] = new THREE.Mesh( new THREE.CylinderGeometry( 208, 208, 10, 42, 1, 1 ), materials[3] );

for (var i = 0; i < rings.length; i++) {
	
	pivots[i] = new THREE.Object3D();
	pivots[i].position = scene.position;
	
	rings[i].material.side = THREE.DoubleSide;
	rings[i].rotation.x = 90 * Math.PI / 180;
	
	pivots[i].add( rings[i] );
}


// Circles
var circs = [];
var geometry = new THREE.CylinderGeometry( 1, 3, 0, 42, 1, 1 );
var pivot = new THREE.Object3D();

pivot.position = scene.position;

for ( var i = 0; i <= rings.length; i++ ) {
	
	(function(){
		for ( var j = 0; j <= 100*(i+1); j++ ) { 
			circs[j] = new THREE.Mesh( geometry, materials[i] );

			if (i !== rings.length) {
				var thisRad = rings[i].geometry.parameters.radiusTop;
			} else {
				var thisRad = rings[i-1].geometry.parameters.radiusTop;
			}
			
			var prevRad = (i == 0) ? 0 : rings[i-1].geometry.parameters.radiusTop;

			var pos_x = getRandom(-thisRad, thisRad);
			var pos_y = getRandom(-thisRad, thisRad);

			if (i !== 0) {

				while (Math.pow(pos_x, 2) + Math.pow(pos_y, 2) < Math.pow(prevRad, 2)) {
					pos_x = getRandom(-thisRad, thisRad);
					pos_y = getRandom(-thisRad, thisRad);
				}
			}

			circs[j].position.x = pos_x;
			circs[j].position.y = pos_y;

			circs[j].position.z = getRandom(-prevRad, thisRad);

			circs[j].rotation.x = ( Math.random() - 0.5 ) * 1000;
			circs[j].rotation.y = ( Math.random() - 0.5 ) * 1000;
			
			circs[j].lookAt(camera.position);

			if (i !== rings.length) {
				pivots[i].add( circs[j] );
			}
		}

		if (i !== rings.length) {
			scene.add(pivots[i]);
		}
	})();

}




var inc = 0.005;
function render() {
	
	camera.position.x += (mouseX - camera.position.x) * 0.05;
	camera.position.y += (-mouseY - camera.position.y) * 0.05;
	camera.lookAt(rings[0].position);
	
	for (var i = 0; i < pivots.length; i++) {
		
		if (i % 2 == 0) {
			rings[i].rotation.z += inc;
			rings[i].rotation.x += inc;
		} else {
			pivots[i].rotation.x += inc;
			rings[i].rotation.x += inc;
		}
		
		pivots[i].rotation.z += inc;
		pivots[i].rotation.x += inc;
		
		camera.lookAt(rings[0].position);
		
	}
	
	
	for (var j = 0; j < circs.length; j++) {
		
		circs[j].lookAt(camera.position);
		
	}
	
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}
render();


function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize, false );


function onDocumentMouseMove( event ) {
	mouseX = event.clientX - window.innerWidth / 2;
	mouseY = event.clientY - window.innerHeight / 2;
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );


function getRandom(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

