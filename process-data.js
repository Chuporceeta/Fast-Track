const svg = document.getElementById('graph-svg');
let graph, geojson;

init();

async function getCityData() {
    const response = await fetch("us_cities.json");
    if (!response.ok)
        throw new Error(response.statusText);
    return response.json();
}

async function getUSBorders() {
    // Data from https://github.com/ResidentMario/geoplot-data/blob/master/contiguous-usa.geojson
    const response = await fetch('contiguous-usa.geojson');
    if (!response.ok)
        throw new Error(response.statusText);
    return response.json();
}

function fillCitiesList(data) {
    let cityList = document.getElementById("cities");
    data.forEach((city) => {
        let option = document.createElement("option");
        option.value = city['city'];
        cityList.append(option);
    });

}

function resizeSVG(firstTime=false) {
    svg.setAttribute('width', ''+window.innerWidth);
    svg.setAttribute('height', ''+window.innerHeight);

    graph.onResize(firstTime);
}

function translateOnly(circle, transform) {
    return "translate(" + (circle.attr('cx')*(transform.k-1)+transform.x) + ", " + (circle.attr('cy')*(transform.k-1)+transform.y) +")";
}

function setUpZoom() {
    // Set up zoom and pan
    let zoom = d3.zoom()
        .on('zoom', e => {
            d3.select('#graph')
                .selectAll('path')
                .attr('transform', e.transform);
            d3.select('#graph')
                .selectAll('circle')
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
        fillCitiesList(cityData['data']);
        graph = new AdjList(cityData['data']);
        geojson = borderData;
        setUpZoom();
        resizeSVG(true);
        graph.onMinPopChange();
    });
}
