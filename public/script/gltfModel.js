import Stats from '../js/libs/stats.module';

import { OrbitControls } from '../js/libs/OrbitControls';
import { GLTFLoader } from '../js/libs/GLTFLoader.js';

var container, stats, controls;
var camera, scene, renderer;

export function init() {
    console.log('gltfmodel');

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
    camera.position.set(- 1.8, 0.9, 2.7);

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xCCCCCC));
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-0.289, 0.5, -1);
    scene.add(directionalLight);
    // model

    var loader = new GLTFLoader().setPath('models/gltf/2019_08_01_182228_fin_2sfab/');
    loader.load('scene.gltf', function (gltf) {
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                // child.castShadow = true;
                // child.receiveShadow = true;
            }
        });
        gltf.scene.scale.set(0.001, 0.001, 0.001);
        scene.add(gltf.scene);
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaOutput = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize, false);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

export function animate() {

    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    stats.update();

}