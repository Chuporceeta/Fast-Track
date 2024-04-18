class QuadTree {
    constructor(graph) {
        this.projection = d3.geoConicEquidistant();
        this.d3tree = d3.quadtree()
            .x(id => {
                let city = graph.cityData.get(id);
                return this.projection([city.lon, city.lat])[0];
            })
            .y(id => {
                let city = graph.cityData.get(id);
                return this.projection([city.lon, city.lat])[1];
            })
            .addAll(graph.cityList);
        this.graph = graph;
    }

    nClosest(n, id) {
        let city = this.graph.cityData.get(id);
        let [x, y] = this.projection([city.lon, city.lat]);
        let res = [];
        for (let i=0; i<=n; i++) {
            let nearest = this.d3tree.find(x, y);
            if (nearest === undefined)
                break;
            res.push(nearest);
            this.d3tree.remove(res[i]);
        }
        this.d3tree.addAll(res);
        res.shift();
        return res;
    }

    nInRadius(n, r, id) {
        if (n === '-1')
            n = Number.MAX_SAFE_INTEGER;
        let city = this.graph.cityData.get(id);
        let [x, y] = this.projection([city.lon, city.lat]);
        let res = [];
        let currCity, count = -2; // offset count for self and OOR city
        do {
            let currId = this.d3tree.find(x, y);
            currCity = this.graph.cityData.get(currId);
            res.push(currId);
            this.d3tree.remove(currId);
            count++;
        } while (dist(city.lon, city.lat, currCity.lon, currCity.lat) <= r && count < n);
        this.d3tree.addAll(res);
        res.pop();
        res.shift();
        return res;
    }
}
