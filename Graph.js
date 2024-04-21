class AdjList {
    constructor(data, geoJson) {
        this.geojson = geoJson;
        this.cityData = new Map();
        data.forEach((city) => {
            if (city['state'] !== 'AK' && city['state'] !== 'HI')
                this.cityData.set(city['id'], {lat:city['lat'], lon:city['lon'], name:city['city'], pop:city['population'], state:city['state']});
        });
        this.cityData = new Map([...this.cityData.entries()].sort((a, b) => a[1].pop - b[1].pop));
        this.graph = new Map(); // {fromCityId : {toCityId: distance, ...}, ...}
        this.edgeParams = [0, 0];
        this.endPoints = [-1, -1]
        this.path = null;
        this.visited = null;
    }

    dist(fromId, toId) {
        let fromCity = this.cityData.get(fromId);
        let toCity = this.cityData.get(toId);

        return dist(fromCity.lon, fromCity.lat, toCity.lon, toCity.lat);
    }

    addEdge(fromId, toId) {
        if (!this.graph.has(fromId))
            this.graph.set(fromId, new Map());
        if (!this.graph.has(toId))
            this.graph.set(toId, new Map());

        let d = this.dist(fromId, toId);

        this.graph.get(fromId).set(toId, d);
        this.graph.get(toId).set(fromId, d);
    }

    drawCity(id) {
        let city = this.cityData.get(id);
        let [x, y] = this.projection([city.lon, city.lat]);
        let s = (Math.log(this.cityData.get(id).pop-this.minPop)/2+5)/cameraZoom;

        ctx.fillRect(x-s/2, y-s/2, s, s)
        ctx.strokeRect(x-s/2, y-s/2, s, s)
    }

    onResize() {
        // Set up map projection
        this.projection = d3.geoMercator()
            //.rotate([0, 60, 0])
            .fitExtent([[0,0], [innerWidth, innerHeight]], this.geojson);
        this.geoGenerator = d3.geoPath()
            .projection(this.projection)
            .context(ctx);
    }

    onMinPopChange() {
        this.minPop = document.getElementById('pop-input').value;

        // Update list of cities to display
        this.cityList = Array.from(this.cityData).map(([id, _]) => id);
        this.cityList = this.cityList.filter(id => this.cityData.get(id).pop > this.minPop);

        // Update City Dropdown
        let dropdown = document.getElementById('cityList');
        dropdown.replaceChildren();
        let name = id => {
            let city = this.cityData.get(id);
            return city.name+city.state;
        };
        for (let id of this.cityList.toSorted((a, b) => name(a).localeCompare(name(b)))) {
            let option = document.createElement('option');
            option.value = this.cityData.get(id).name + ', ' + this.cityData.get(id).state;
            dropdown.append(option);
        }

        document.getElementById('city1').value = '';
        document.getElementById('city2').value = '';

        this.graph.clear();
        this.path = null;
        this.visited = null;
        document.getElementById('results-header').textContent = '';
        document.getElementById('search-path').innerHTML = '';
        this.endPoints = [-1, -1];
    }

    calculateEdges() {
        let n = document.getElementById('n').value;
        let r = document.getElementById('r').value;

        // Don't recalculate what's already there
        if (this.edgeParams === [n, r])
            return;

        let quadtree = new QuadTree(this);

        // Clear old edges
        this.graph.clear();

        // Create new edges
        if (n === '-1' && r === '-1') { // Fully connected
            for (let i=0; i<this.cityList.length; i++)
                for (let j=i+1; j<this.cityList.length; j++)
                    this.addEdge(this.cityList[i], this.cityList[j]);
        } else if (r === '-1') { // Create edges to the n closest cities
            for (let fromId of this.cityList) {
                let toIds = quadtree.nClosest(n, fromId);
                for (let toId of toIds)
                    this.addEdge(fromId, toId);
            }
        } else { // Create edges to the n closest cities within r miles
            for (let fromId of this.cityList) {
                let toIds = quadtree.nInRadius(n, r, fromId);
                for (let toId of toIds)
                    this.addEdge(fromId, toId);
            }
        }
        this.edgeParams = [n, r];
    }

    getEndpoints(i) {
        this.endPoints[i-1] = -1;
        let [name, state] = document.getElementById('city'+i).value.split(', ');
        for (let id of this.cityList) {
            let city = this.cityData.get(id);
            if (city.name === name && city.state === state)
                this.endPoints[i-1] = id;
        }
        this.path = null;
        this.visited = null;
        document.getElementById('results-header').textContent = '';
        document.getElementById('search-path').innerHTML = '';
    }

    traceVisited() {
        if (this.visited === null)
            return;
        let geoJson = {
            "type": "FeatureCollection",
            "features": []
        };

        this.visited.forEach(pair => {
            let fromCity = this.cityData.get(pair[0]);
            let toCity = this.cityData.get(pair[1]);
            geoJson.features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [[fromCity.lon, fromCity.lat], [toCity.lon, toCity.lat]]
                }
            });

        });

        ctx.lineWidth = 3/cameraZoom;
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        this.geoGenerator(geoJson);
        ctx.stroke();
    }

    tracePath() {
        if (this.path === null)
            return;
        let geoJson = {
            "type": "FeatureCollection",
            "features": []
        };

        let prev = this.cityData.get(this.path[0]);
        for (let i=1; i<this.path.length; i++) {
            let fromCity = prev;
            let toCity = this.cityData.get(this.path[i]);
            geoJson.features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [[fromCity.lon, fromCity.lat], [toCity.lon, toCity.lat]]
                }
            });
            prev = toCity;
        }

        ctx.lineWidth = 5/cameraZoom;
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        this.geoGenerator(geoJson);
        ctx.stroke();
    }

    draw() {
        ctx.canvas.width = innerWidth;
        ctx.canvas.height = innerHeight;

        ctx.translate(innerWidth/2, innerHeight/2);
        ctx.scale(cameraZoom, cameraZoom);
        ctx.translate(-innerWidth+cameraOffset.x, -innerHeight+cameraOffset.y);

        // Background
        ctx.fillStyle = '#0d1728';
        ctx.fillRect(0, 0, innerWidth, innerHeight);

        // +====================+ Draw Map +====================+ //
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.fillStyle = '#a9a9a9';
        this.geoGenerator(this.geojson);
        ctx.fill();
        ctx.stroke();

        // +====================+ Draw Roads +====================+ //
        let geoJson = {
            "type": "FeatureCollection",
            "features": []
        };

        for (let [fromId, toCities] of this.graph) {
            for (let [toId, _] of toCities) {
                let fromCity = this.cityData.get(fromId);
                let toCity = this.cityData.get(toId);
                geoJson.features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [[fromCity.lon, fromCity.lat], [toCity.lon, toCity.lat]]
                    }
                });
            }
        }
        ctx.lineWidth = 1/cameraZoom;
        ctx.beginPath();
        this.geoGenerator(geoJson);
        ctx.stroke();

        this.traceVisited();
        this.tracePath();

        // +====================+ Draw Cities +====================+ //
        ctx.fillStyle = '#dcdcdc';
        ctx.lineWidth = 1.5/cameraZoom;
        ctx.strokeStyle = 'black';
        for (let id of this.cityList)
            this.drawCity(id);

        ctx.strokeStyle = 'green';
        if (this.visited)
            for (let [fromId, toId] of this.visited) {
                this.drawCity(fromId);
                this.drawCity(toId);
            }

        ctx.strokeStyle = 'red';
        if (this.path)
            for (let id of this.path)
                this.drawCity(id);

        ctx.fillStyle = 'red';
        ctx.lineWidth = 5/cameraZoom;
        if (this.endPoints[0] !== -1)
            this.drawCity(this.endPoints[0]);
        if (this.endPoints[1] !== -1)
            this.drawCity(this.endPoints[1]);
    }

    search() {
        let dijkstra = document.getElementById('dijkstra-toggle').checked;
        let aStar = document.getElementById('a*-toggle').checked;
        let header = document.getElementById('results-header');
        let ul = document.getElementById('search-path');

        this.visited = new Set();
        ul.innerHTML = '';

        if (this.endPoints.includes(-1)) {
            header.textContent = 'Please select the start and end cities.';
            return;
        } else if (!dijkstra && !aStar) {
            header.textContent = 'Please select a path-finding algorithm.';
            return;
        } else  if (dijkstra)
            this.path = this.Dijkstra(...this.endPoints);
        else if (aStar)
            this.path = this.AStar(...this.endPoints);

        if (this.path === null)
            header.textContent = 'No path exists. Try building more roads.';
        else {
            let d = 0;
            let prev = null;
            for (let id of this.path) {
                let li = document.createElement('li');
                let city = this.cityData.get(id);
                let diff= prev ? this.graph.get(prev).get(id) : 0;
                d += diff;
                li.textContent = `${city.name}, ${city.state} -- ${d} mi.` + (diff === 0 ? '' : `  (+${diff} mi.)`);
                ul.append(li);
                prev = id;
            }
            header.textContent = `Total trip distance: ${d} mi.`;
        }
    }

    Dijkstra(start, goal) {
        
        return null;
    }

    AStar(start, goal) {
        let h = n => this.dist(n, goal);

        let openSet = new MinHeap(x => x.f);
        openSet.push({id:start, f:h(start)});

        let predecessors = new Map();

        let gScores = new Map();
        gScores.set(start, 0);

        while (openSet.size() > 0) {
            let current = openSet.pop();

            if (current.id === goal) {
                current = current.id;
                let path = [current];
                while (predecessors.has(current)) {
                    current = predecessors.get(current);
                    path.unshift(current);
                }
                return path;
            }

            for (let [neighbor, d] of this.graph.get(current.id)) {
                this.visited.add([current.id, neighbor]);
                let newGScore = (gScores.get(current.id) ?? Number.MAX_SAFE_INTEGER) + d;
                if (newGScore < (gScores.get(neighbor) ?? Number.MAX_SAFE_INTEGER)) {
                    predecessors.set(neighbor, current.id);
                    gScores.set(neighbor, newGScore);
                    // if neighbor not in openSet
                    let found = false;
                    for (let pair of openSet.content)
                        if (pair.id === neighbor) {
                            found = true;
                            break;
                        }
                    if (!found)
                        openSet.push({id: neighbor, f: newGScore + h(neighbor)})
                }
            }
        }
        return null;
    }
}
