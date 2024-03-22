class AdjList {
    constructor(data) {
        this.cityData = data; // [{city, country, elevation, id, lat, lon, population, state, timezone}, ...]
        this.graph = {}; // fromCityId : [toCityId, distance]
    }

    

}