init();

async function getCityData() {
    const response = await fetch("./us_cities.json");
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

function init() {
    let graph;
    const cityData = getCityData();
    cityData.then((data) => {
        console.log(data);
        fillCitiesList(data['data']);
        graph = new AdjList(data['data']);
    });
}