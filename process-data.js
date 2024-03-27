const svg = document.getElementById('graph-svg');
let graph, geojson;

init();

async function getCityData() {
    // Data taken from https://bridgesdata.herokuapp.com/api/us_cities
    const response = await fetch("us_cities.json");
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

function resizeSVG(firstTime=false) {
    svg.setAttribute('width', ''+window.innerWidth);
    svg.setAttribute('height', ''+window.innerHeight);

    graph.onResize(firstTime);
}

function translateOnly(obj) {
    let x = obj.attr('cx') ?? obj.attr('x');
    let y = obj.attr('cy') ?? obj.attr('y');
    let transform = d3.zoomTransform(d3.select('#graph > path').node()) ?? d3.zoomIdentity;
    return "translate(" + (x*(transform.k-1)+transform.x) + ", " + (y*(transform.k-1)+transform.y) +")";
}

function setUpZoom() {
    // Set up zoom and pan
    let zoom = d3.zoom()
        .on('zoom', e => {
            d3.select('#graph')
                .selectAll('path')
                .attr('transform', e.transform)
                .attr('stroke-width', Math.min(1, 2/e.transform.k));
            d3.select('#graph')
                .selectAll('circle, text')
                .attr('transform', function(id, i) {
                    return translateOnly(d3.select(this), e.transform);
                });
        });
    d3.select('#graph-svg').call(zoom);
}

function init() {
    window.addEventListener('resize', resizeSVG, false);

    const cityDataP = getCityData();
    const borderDataP = getUSBorders();

    Promise.all([cityDataP, borderDataP])
    .then(([cityData, borderData]) => {
        graph = new AdjList(cityData['data']);
        geojson = borderData;
        setUpZoom();
        resizeSVG(true);
        graph.onMinPopChange();
    });
}
