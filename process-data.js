const ctx = document.getElementById('canvas').getContext('2d');
function dist(lon1, lat1, lon2, lat2) {
    return Math.round(7912.2*Math.asin(Math.sqrt(
            Math.pow(Math.sin(Math.PI*(lat1-lat2)/360), 2)
            + Math.cos(Math.PI*lat1/180)
                *Math.cos(Math.PI*lat2/180)
                *Math.pow(Math.sin(Math.PI*(lon2-lon1)/360), 2))));
}

let graph;

init();

async function getCityData() {
    // Data taken from https://bridgesdata.herokuapp.com/api/us_cities
    const response = await fetch('us_cities.json');
    if (!response.ok)
        throw new Error(response.statusText);
    return response.json();
}

async function getUSBorders() {
    // Data taken and modified from https://eric.clst.org/tech/usgeojson/
    const response = await fetch('us_borders.json');
    if (!response.ok)
        throw new Error(response.statusText);
    return response.json();
}

function onResize() {
    graph.onResize();
}

function draw() {
    graph.draw();
    requestAnimationFrame(draw);
}

function init() {
    window.addEventListener('resize', onResize, false);

    Promise.all([getCityData(), getUSBorders()])
    .then(([cityData, borderData]) => {
        graph = new AdjList(cityData['data'], borderData);
        onResize();
        graph.onMinPopChange();
        draw();
    });
}

function launch() {
    graph.calculateEdges();
    graph.search();
}
