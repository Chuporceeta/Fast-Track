class AdjList {
    constructor(data, geoJson) {
        this.geojson = geoJson;
        this.cityData = new Map();
        data.forEach((city) => {
            if (city['state'] !== 'AK' && city['state'] !== 'HI')
                this.cityData.set(city['id'], {lat:city['lat'], lon:city['lon'], name:city['city'], pop:city['population'], state:city['state']});
        });
        this.cityData = new Map([...this.cityData.entries()].sort((a, b) => a[1].pop - b[1].pop));
        this.graph = new Map(); // fromCityId : [[toCityId, distance], ...]
        this.edgeParams = [0, 0];
        this.transform = d3.zoomIdentity;
        this.active = false;
        this.endPoints = [-1, -1]
    }

    addEdge(fromId, toId) {
        if (!this.graph.has(fromId))
            this.graph.set(fromId, new Set());
        if (!this.graph.has(toId))
            this.graph.set(toId, new Set());

        let fromCity = this.cityData.get(fromId);
        let toCity = this.cityData.get(toId);

        let d = dist(fromCity.lon, fromCity.lat, toCity.lon, toCity.lat);

        this.graph.get(fromId).add([toId, d]);
        this.graph.get(toId).add([fromId, d]);
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
        this.active = true;
        this.edgeParams = [n, r];
    }

    drawMap() {
        map.canvas.width = innerWidth;
        map.canvas.height = innerHeight;

        map.translate(innerWidth/2, innerHeight/2);
        map.scale(cameraZoom, cameraZoom);
        map.translate(-innerWidth+cameraOffset.x, -innerHeight+cameraOffset.y);

        map.fillStyle = '#0d1728';
        map.fillRect(0, 0, innerWidth, innerHeight);

        this.geoGenerator.context(map);

        // Draw Map
        map.lineWidth = 0.5;
        map.beginPath();
        map.fillStyle = '#a9a9a9';
        this.geoGenerator(this.geojson);
        map.fill();
        map.stroke();
    }

    drawEdges() {
        roads.canvas.width = innerWidth;
        roads.canvas.height = innerHeight;

        roads.translate(innerWidth/2, innerHeight/2);
        roads.scale(cameraZoom, cameraZoom);
        roads.translate(-innerWidth+cameraOffset.x, -innerHeight+cameraOffset.y);

        roads.clearRect(0, 0, innerWidth, innerHeight);

        if (this.active) {
            this.geoGenerator.context(roads);

            let geoJson = {
                "type": "FeatureCollection",
                "features": []
            };

            for (let [fromId, toCities] of this.graph) {
                for (let [toId, dist] of toCities) {
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
            roads.lineWidth = 1/cameraZoom;
            roads.beginPath();
            this.geoGenerator(geoJson);
            roads.stroke();
        }
    }

    drawCity(id) {
        let city = this.cityData.get(id);
        let [x, y] = this.projection([city.lon, city.lat]);
        let s = (Math.log(this.cityData.get(id).pop-this.minPop)/2+5)/cameraZoom;

        cities.fillRect(x-s/2, y-s/2, s, s)
        cities.strokeRect(x-s/2, y-s/2, s, s)
    }

    drawCities() {
        cities.canvas.width = innerWidth;
        cities.canvas.height = innerHeight;

        cities.translate(innerWidth/2, innerHeight/2);
        cities.scale(cameraZoom, cameraZoom);
        cities.translate(-innerWidth+cameraOffset.x, -innerHeight+cameraOffset.y);

        cities.clearRect(0, 0, innerWidth, innerHeight);

        this.geoGenerator.context(cities);
        cities.lineWidth = 1.5/cameraZoom;
        cities.fillStyle = '#dcdcdc';
        for (let id of this.cityList)
            this.drawCity(id);

        cities.fillStyle = 'red';
        cities.strokeStyle = 'red';
        if (this.endPoints[0] !== -1)
            this.drawCity(this.endPoints[0]);
        if (this.endPoints[1] !== -1)
            this.drawCity(this.endPoints[1]);
    }

    markEndpoints() {
        let [city1, state1] = document.getElementById('city1').value.split(', ');
        let [city2, state2] = document.getElementById('city2').value.split(', ');

        for (let id of this.cityList) {
            let city = this.cityData.get(id);
            if (city.name === city1 && city.state === state1)
                this.endPoints[0] = id;
            if (city.name === city2 && city.state === state2)
                this.endPoints[1] = id;
        }
    }

    onResize(firstTime=false) {
        // Set up map projection
        this.projection = d3.geoMercator()
            //.rotate([0, 60, 0])
            .fitExtent([[0,0], [innerWidth, innerHeight]], this.geojson);
        this.geoGenerator = d3.geoPath()
            .projection(this.projection);

        // Can't update cities before they are first drawn
        if (firstTime === true)
            return;

       // this.drawEdges();

        // Update city locations
        d3.select('#graph')
            .selectAll('circle')
            .attr('cx', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[0];
            })
            .attr('cy', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[1];
            });

    }

    onMinPopChange() {
        this.minPop = document.getElementById('pop-input').value;

        // Update list of cities to display
        this.cityList = Array.from(this.cityData).map(([id, data]) => id);
        this.cityList = this.cityList.filter(id => this.cityData.get(id).pop > this.minPop);

        // Update City Dropdown
        let dropdown = document.getElementById('cityList');
        dropdown.replaceChildren();
        for (let id of this.cityList) {
            let option = document.createElement('option');
            option.value = this.cityData.get(id).name + ', ' + this.cityData.get(id).state;
            dropdown.append(option);
        }

        this.active = false;

        // Draw Cities
        // let self = this;
        // d3.select('#graph')
        //     .selectAll('circle')
        //     .data(this.cityList, d => d)
        //     .join(
        //         (enter) => {
        //             return enter
        //                 .append('circle')
        //                 .on('mouseover', (e, id) => {
        //                     let target = d3.select(e.target);
        //                     target.style('fill', 'red');
        //
        //                     d3.select('#graph').append('text')
        //                             .text(this.cityData.get(id).name)
        //                             .classed('city-label', true)
        //                             .attr('x', target.attr('cx'))
        //                             .attr('y', target.attr('cy'))
        //                             .attr('transform', function() {
        //                                 return translateOnly(d3.select(this), self.transform);
        //                             });
        //                 })
        //                 .on('mouseout', function(e) {
        //                     d3.select(this).style('fill', '#dcdcdc');
        //                     d3.selectAll('#graph > text').remove();
        //                 })
        //                 .attr('r', 0)
        //                 .style('fill', '#dcdcdc')
        //                 .style('stroke', '#000000');
        //         },
        //         (update) => {
        //             return update;
        //         },
        //         (exit) => {
        //             return exit
        //                 .transition()
        //                 .ease(d3.easeBackIn)
        //                 .attr('r', 0)
        //                 .remove();
        //         }
        //     )
        //     .attr('cx', id => {
        //         let city = this.cityData.get(id);
        //         return this.projection([city.lon, city.lat])[0];
        //     })
        //     .attr('cy', id => {
        //         let city = this.cityData.get(id);
        //         return this.projection([city.lon, city.lat])[1];
        //     })
        //     .attr('transform', function() {
        //         return translateOnly(d3.select(this), self.transform);
        //     })
        //     .transition()
        //     .attr('r', id => Math.log(this.cityData.get(id).pop-minPop)/3+3);
    }
}
