import { GLTFLoader } from '../js/libs/GLTFLoader.js';
import { OrbitControls } from '../js/libs/OrbitControls.js';
import Stats from '../js/libs/stats.module.js';

let camera, renderer, scene, stats, controls;
let isLoadingModel;
let markerGroup, directionalLight;
let currentModelIndex = -1;
let currentObservingModelIndex = -1;

bodyScrollLock.disableBodyScroll(document.getElementById("canvas"));
// const slider = document.getElementById("myRange");
const loadingOverlay = document.getElementById('loading-overlay');
const loadingOverlayParent = loadingOverlay.parentNode;

const touchPad = document.getElementById("touchPad");
const touchPadParent = touchPad.parentNode;

document.addEventListener('touchmove',
    function(e) {
        e.preventDefault();
        //console.log("touchmove");
}, {passive:false});

var pickUpButton = document.getElementById('BtnClick');

var mc = new Hammer.Manager(touchPad);

    // add the pinch recognizer
    mc.add(new Hammer.Pinch({ threshold: 0 }));
    
    // listen to the events!
// const mc = new Hammer(slidecontainer); // init hammer.js
// get all 'pan' gestures with vertical direction
// mc.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 2 });
let modelSize;
mc.on("pinchmove", function (ev) {
    //console.log(ev.scale);
    const model = markerGroup.getObjectByName("model");//markerGroup.visible &&
    if( markerGroup.visible && model && modelSize){
        //console.log('pinchmove ' + modelSize);
        let size = Math.max(1, modelSize*ev.scale);
        size = Math.min(size, 5);
        model.scale.set(0.01*size, 0.01*size, 0.01*size);
        setDirectionligthSize(size);
    }
});

mc.on( "pinchstart", function( e ) {
    const model = markerGroup.getObjectByName("model");//markerGroup.visible &&
    //console.log('pinchstart');
    if( markerGroup.visible && model){
        modelSize = model.scale.x*100;
        //console.log('modelSize ' + modelSize);
    }else{
        modelSize = null;
    }
});


var models = [
    {
        markerUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/data/pattern-jiao3.patt',
        modelUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/model/jiaolou/2019_08_08_135350_position_recolor.gltf',
        scale: 1,
        offset: {x: 0.045, y:0, z:0.049}
    },
    {
        markerUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/data/pattern-tai3.patt',
        modelUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/model/taihe/2019_08_08_135350_position_recolor.gltf',
        scale: 1,
        offset: {x: -0.005, y:0, z:0.106}
    },
    {
        markerUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/data/pattern-bao3.patt',
        modelUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/model/baohe/2019_08_08_135350_position_recolor.gltf',
        scale: 1,
        offset: {x: 0, y:0, z:-0.129}
    },
    {
        markerUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/data/pattern-zhong3.patt',
        modelUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/model/zhonghe/2019_08_08_135350_position_recolor.gltf',
        scale: 1,
        offset: {x: 0.073, y:0, z:-0.085}
    },
    {
        markerUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/data/pattern-wu3.patt',
        modelUrl: 'https://arjianzhu.s3.cn-north-1.amazonaws.com.cn/model/wumen/2019_08_08_135350_position_recolor.gltf',
        scale: 1,
        offset: {x: 0, y:0, z:0}
    }
];

function initLoadingManager() {

    const manager = new THREE.LoadingManager();
    const progressBar = document.querySelector('#progress');
    let percentComplete = 1;
    let frameID = null;

    const updateAmount = 0.5; // in percent of bar width, should divide 100 evenly

    manager.onStart = () => {
        // prevent the timer being set again
        // if onStart is called multiple times
        if (frameID !== null) return;
        //console.log('start');
        loadingOverlay.style.visibility = 'visible';
    };

    manager.onLoad = function () {
        //console.log('load');
        loadingOverlay.style.visibility = 'hidden';
    };

    manager.onError = function (e) {

        console.error(e);
        //progressBar.style.backgroundColor = 'red';

    }

    return manager;
}

function setDirectionligthSize(size)
{
    if(!directionalLight || size<0||size>5)
        return;
    directionalLight.shadow.camera.bottom = -1-size;
    directionalLight.shadow.camera.top = 1+size;
    directionalLight.shadow.camera.right = 1+size;
    directionalLight.shadow.camera.left = -1-size;
}

function pickup(){
     //markerGroup.visible &&
    var model = markerGroup.getObjectByName("model");
    if (model !== null){
        //difference between attach and remove+add is wether keeping the localposition or not
        markerGroup.remove(model);
        scene.add(model);
        //markerGroup.remove(directionalLight);
        scene.attach(directionalLight);
        directionalLight.position.set(0.3, 0.8, 0.3);
        //console.log(directionalLight.getWorldPosition());
        model = scene.getObjectByName("model");
        directionalLight.target = model;
        touchPadParent.removeChild(touchPad);
        loadingOverlayParent.removeChild(loadingOverlay);
        camera.position.set( 0, 0.5, 1.5 );
        camera.up = new THREE.Vector3(0,1,0);
        camera.lookAt(new THREE.Vector3(0,2,0));
        controls.minDistance = 1;
        // var tween = new TWEEN.Tween(model.position)
        // .to(THREE.Vector3(0,0,0), 1000)
        // .start();
        // .set(0, 0, 0);
        controls.target.set( 0, 0, 0);
        controls.update();
        currentObservingModelIndex = currentModelIndex;
        currentModelIndex = -1;
        pickUpButton.textContent = "放下";
    }
     
}

function putdown(){
    //markerGroup.visible &&
    var model = scene.getObjectByName("model");
    if (model !== null){
        //console.log("putdown");
        model.dispose();
        scene.remove(model);

        // markerGroup.attach(directionalLight);
        touchPadParent.prepend(touchPad);
        loadingOverlayParent.prepend(loadingOverlay);
        controls.minDistance = 0;
        camera.position.set( 0, 0, 0 );
        camera.up = new THREE.Vector3(0,1,0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        currentObservingModelIndex = -1;
        currentModelIndex = -1;
        pickUpButton.textContent = "拾起";
    }
    
}

function loadModel(index) {
    if (index < 0 || index >= models.length) {
        console.error('marker index is not valid');
        return;
    }
    if (isLoadingModel || index===currentModelIndex) { //model already loaded
        //console.log('model is loading');
        return;
    }
    isLoadingModel = true;
    var manager = initLoadingManager();
    var loader = new GLTFLoader(manager);
    loader.load(models[index].modelUrl, function (gltf) {

        gltf.scene.traverse(function (child) {
            // if(!child.name.includes("RootNode")&&!child.name.includes("polySurface"))
            //  	gltf.scene.remove(child);
            if (child.name.includes('ground')) {
                child.material = new THREE.ShadowMaterial({ opacity: 0.7 });
            }
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        gltf.scene.name = "model";
        var oldModel = markerGroup.getObjectByName("model");
        if (oldModel !== null)
            markerGroup.remove(oldModel);
        markerGroup.add(gltf.scene);
        markerGroup.attach(directionalLight);
        directionalLight.position.set(0.3, 0.8, 0.3);
        directionalLight.target = markerGroup;

        // scene.add(gltf.scene);
        var scale = models[index].scale;
        gltf.scene.position.set(models[index].offset.x, models[index].offset.y, models[index].offset.z);
        gltf.scene.scale.set(0.01, 0.01, 0.01);

        gltf.scene.scale.set(0.01*scale, 0.01*scale, 0.01*scale);
        currentModelIndex = index;
        isLoadingModel = false;
        
    }, manager.onProgress, manager.onError);
}

function update(){
    // console.log("currentObservingModelIndex " + currentObservingModelIndex);
    // console.log("currentModelIndex " + currentModelIndex);
    if(!markerGroup){
        currentObservingModelIndex = -1;
        currentModelIndex = -1;
        return;
    }
    if( (markerGroup.visible && currentModelIndex>=0) ||currentObservingModelIndex>=0 ){
        if(pickUpButton.style.visibility!=="visible")
            pickUpButton.style.visibility = "visible";
    }else {
        currentModelIndex = -1;
        pickUpButton.style.visibility = "hidden";
    }
    if(pickUpButton.style.visibility!=="visible")
        return;
    if(currentModelIndex>=0){
        pickUpButton.textContent = "拾起";
        pickUpButton.removeEventListener("click", pickup);
        pickUpButton.removeEventListener("click", putdown);
        pickUpButton.addEventListener("click", pickup);
    }else if(currentObservingModelIndex>=0){
        pickUpButton.textContent = "放下";
        pickUpButton.removeEventListener("click", putdown);
        pickUpButton.removeEventListener("click", pickup);
        pickUpButton.addEventListener("click",  putdown);
    }
}

function init() {

    // stats = new Stats();
    // document.body.appendChild(stats.dom);
    isLoadingModel = false;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // init scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
    // camera.position.set( 0, 0.5, 1.5 );
    // camera.up = new THREE.Vector3(0,1,0);
    // camera.lookAt(new THREE.Vector3(0,1,0));
    scene.add(camera);

    markerGroup = new THREE.Group();
    scene.add(markerGroup);

    controls = new OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = false;

    controls.minDistance = 0;
    controls.maxDistance = 4;

    controls.maxPolarAngle = Math.PI / 2;
    var light = new THREE.HemisphereLight(0xffffff, 0x9797A0, 1);
    scene.add(light);
    directionalLight = new THREE.DirectionalLight(0xffffff, 1, 10);
    directionalLight.name = "directionaLight";

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.target = markerGroup;

    directionalLight.shadow.camera.bottom = -2;
    directionalLight.shadow.camera.top = 2; //5;
    directionalLight.shadow.camera.right = 2;
    directionalLight.shadow.camera.left = -2;
    markerGroup.add(directionalLight);
    
    directionalLight.position.set(0.3, 0.8, 0.3);
    
    var source = new THREEAR.Source({ renderer, camera });
    THREEAR.initialize({ source: source, lostTimeout: 5000 }).then((controller) => {

        for (var i = 0; i < models.length; i++) {
            var markerUrl = models[i].markerUrl;
            //console.log(markerUrl);
            var patternMarker = new THREEAR.PatternMarker({
                patternUrl: markerUrl,
                markerObject: markerGroup,
                patternRatio: 0.8,
                minConfidence: 0.5
            });
            controller.trackMarker(patternMarker);
        }
        controller.addEventListener('markerFound', function (event) {
            if(currentObservingModelIndex<0){
                var index = models.findIndex( model => model.markerUrl===event.marker.patternUrl);
                
                loadModel(index);
            }
        });

        // controller.addEventListener('markerLost', function (event) {
        //     //console.log('markerLost', event);
        //     var index = models.findIndex( model => model.markerUrl===event.marker.patternUrl);
        //     //displaySlider(false, index);
        // });

        // run the rendering loop
        var lastTimeMsec = 0;
        requestAnimationFrame(function animate(nowMsec) {
            // stats.update();
            // keep looping
            update();
            // TWEEN.update(nowMsec);
            requestAnimationFrame(animate);
            // measure time
            lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
            var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
            lastTimeMsec = nowMsec;
            // call each update function
            controls.update();
            controller.update(source.domElement);
            renderer.render(scene, camera);
        });
    });
}

init();