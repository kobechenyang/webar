// import { init } from 'gltfModel.js';

window.addEventListener('camera-init', (data) => {
    console.log('camera-init', data);
});
window.addEventListener('camera-error', (error) => {
    console.log('camera-error', error);
});

AFRAME.registerComponent('registerevents', {
    init: function () {
        var marker = this.el;
        marker.addEventListener('markerFound', function() {
            var markerId = marker.id;
            console.log('markerFound', markerId);
            //init();
            // TODO: Add your own code here to react to the marker being found.
        });
        marker.addEventListener('markerLost', function() {
            var markerId = marker.id;
            console.log('markerLost', markerId);
            // TODO: Add your own code here to react to the marker being lost.
        });
    },
    tick: function (time, timeDelta) {
        
    }
});