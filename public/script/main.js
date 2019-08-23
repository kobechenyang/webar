import { GLTFLoader } from '../js/libs/GLTFLoader.js';

var camera, renderer, scene;
var isLoadingModel;
var markerGroup;

var models = [
    {
        markerUrl: './data/pattern-jiao.patt',
        modelUrl: './model/jiaolou/2019_08_08_135350_position_recolor.gltf',
        model: null
    },
    {
        markerUrl: './data/pattern-tai.patt',
        modelUrl: './model/taihedian/2019_08_08_135350_position_recolor.gltf',
        model: null
    },
    // last is the cloud
    {
        markerUrl: 'cloud',
        modelUrl: './model/cloud/2019_08_08_135350_position_recolor.gltf',
        model: null
    },
];

function initLoadingManager() {

    const manager = new THREE.LoadingManager();
    const progressBar = document.querySelector('#progress');
    const loadingOverlay = document.querySelector('#loading-overlay');

    let percentComplete = 1;
    let frameID = null;

    const updateAmount = 0.5; // in percent of bar width, should divide 100 evenly

    const animateBar = (from, to) => {
        percentComplete = Math.max(percentComplete, from);
        percentComplete += updateAmount;
        percentComplete = Math.min(percentComplete, to);
        progressBar.style.width = percentComplete + '%';

        frameID = requestAnimationFrame(animateBar);
    }

    manager.onStart = () => {
        // prevent the timer being set again
        // if onStart is called multiple times
        if (frameID !== null) return;
        //console.log('start');
        loadingOverlay.style.visibility = 'visible';
        if(models[models.length-1].model!=null)
        {
            var oldModel = markerGroup.getObjectByName("model");
            if (oldModel !== null)
                markerGroup.remove(oldModel);
            markerGroup.add(models[models.length-1].model);
        }
    };

    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        progressBar.style.width = (itemsLoaded / itemsTotal * 100) + '%';
        //animateBar( (itemsLoaded-1)*100/itemsTotal, itemsLoaded*100/itemsTotal);
        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };

    manager.onLoad = function () {
        //console.log('load');
        loadingOverlay.style.visibility = 'hidden';
        //loadingOverlay.classList.add('loading-overlay-hidden');

        // reset the bar in case we need to use it again
        percentComplete = 0;
        progressBar.style.width = 0;
        cancelAnimationFrame(frameID);

    };

    manager.onError = function (e) {

        console.error(e);

        progressBar.style.backgroundColor = 'red';

    }

    return manager;
}

function loadModel(index) {
    if (index < 0 || index >= models.length) {
        console.error('marker index is not valid');
        return;
    }
    if (isLoadingModel) {
        //console.log('model is loading');
        return;
    }
    var oldModel = markerGroup.getObjectByName("model");
    if (oldModel !== null && oldModel === models[index].model) {
        //console.log(models[index].model.name + 'already on marker');
        return;
    }
    if (models[index].model !== null) {
        //console.log(models[index].model.name);
        if (oldModel !== null)
            markerGroup.remove(oldModel);
        markerGroup.add(models[index].model);
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
            // 	gltf.scene.remove(child);
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        //gltf.scene.position.set(-0.8, 0, 0.5);
        gltf.scene.scale.set(0.01, 0.01, 0.01);
        gltf.scene.name = "model";
        var oldModel = markerGroup.getObjectByName("model");
        if (oldModel !== null)
            markerGroup.remove(oldModel);
        markerGroup.add(gltf.scene);
        var newModel = {...models[index], model:gltf.scene};
        models[index] = newModel;
        isLoadingModel = false;
    }, manager.onProgress, manager.onError);
}

function init() {
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
    camera = new THREE.Camera();
    scene.add(camera);

    markerGroup = new THREE.Group();
    scene.add(markerGroup);

    var light = new THREE.HemisphereLight(0xffffff, 0x9797A0, 1);
    scene.add(light);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5, 100);
    directionalLight.position.set(0.3, 0.8, 0.3).setLength(2);

    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(512, 512);
    directionalLight.target = markerGroup;
    markerGroup.add(directionalLight);

    directionalLight.shadow.camera.bottom = -0.5;
    directionalLight.shadow.camera.top = 2; //5;
    directionalLight.shadow.camera.right = 1.5;
    directionalLight.shadow.camera.left = -1.5;

    var source = new THREEAR.Source({ renderer, camera });
    THREEAR.initialize({ source: source, lostTimeout: 100000 }).then((controller) => {

        loadModel(models.length-1);

        for (var i = 0; i < models.length-1; i++) {
            var markerUrl = models[i].markerUrl;
            console.log(markerUrl);
            var patternMarker = new THREEAR.PatternMarker({
                patternUrl: markerUrl,
                markerObject: markerGroup,
                patternRatio: 0.8,
                minConfidence: 0.5
            });
            controller.trackMarker(patternMarker);
        }

        controller.addEventListener('markerFound', function (event) {
            console.log('markerFound', event.marker.patternUrl);
            loadModel(event.marker.id);
        });

        // controller.addEventListener('markerLost', function (event) {
        //     console.log('markerLost', event);
        // });

        // run the rendering loop
        var lastTimeMsec = 0;
        requestAnimationFrame(function animate(nowMsec) {
            // keep looping
            requestAnimationFrame(animate);
            // measure time
            lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
            var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
            lastTimeMsec = nowMsec;
            // call each update function
            controller.update(source.domElement);
            renderer.render(scene, camera);
        });
    });
}

init();