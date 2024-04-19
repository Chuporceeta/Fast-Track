// Canvas pan and zoom code from https://codepen.io/chengarda/pen/wRxoyB
let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }
let cameraZoom = 1
let zoomLoc = {x: innerWidth/2, y: innerHeight/2};
let MIN_ZOOM = 0.5
let SCROLL_SENSITIVITY = 0.0005
let isDragging = false
let dragStart = { x: 0, y: 0 }
let lastZoom = cameraZoom

function getEventLocation(e) {
    if (e.clientX && e.clientY)
        return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e){
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(){
    isDragging = false
    lastZoom = cameraZoom
}

function onPointerMove(e){
    if (isDragging) {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    }
}

function adjustZoom(e, zoomAmount){
    if (!isDragging) {
        cameraZoom += zoomAmount*cameraZoom;
        zoomLoc = {x: e.offsetX, y: e.offsetY};
        cameraZoom = Math.max(cameraZoom, MIN_ZOOM);
    }
}

let page = document.getElementById('canvas');
page.addEventListener('mousedown', onPointerDown);
page.addEventListener('mouseup', onPointerUp);
page.addEventListener('mousemove', onPointerMove);
page.addEventListener( 'wheel', e => adjustZoom(e,-e.deltaY*SCROLL_SENSITIVITY));