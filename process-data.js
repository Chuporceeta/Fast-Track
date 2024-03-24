const svg = document.getElementById('graph-svg');
let graph;

init();

async function getCityData() {
    const response = await fetch("us_cities.json");
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

function draw() {
    graph.drawNodes(Math.max(190000/window.innerWidth, 100000/window.innerHeight));
}

function resizeSVG() {
    svg.setAttribute('width', ''+window.innerWidth);
    svg.setAttribute('height', ''+window.innerHeight);

    draw();
}

function init() {
    window.addEventListener('resize', resizeSVG, false);

    const cityData = getCityData();
    cityData.then((data) => {
        console.log(data);
        fillCitiesList(data['data']);
        graph = new AdjList(data['data']);
        resizeSVG();
        //drawBorders(Math.max(190000/canvas.width, 100000/canvas.height));
    });
}
