class AdjList {
    constructor(data, geoJson) {
        this.geojson = geoJson;
        this.cityData = new Map();
        data.forEach((city) => {
            if (city['state'] !== 'AK' && city['state'] !== 'HI')
                this.cityData.set(city['id'], {lat:city['lat'], lon:city['lon'], name:city['city'], pop:city['population'], state:city['state']});
        });
        this.graph = new Map(); // fromCityId : [[toCityId, distance], ...]
    }

    addEdges(fromId, toIds) {
        let fromCity = this.cityData.get(fromId);
        this.graph.set(fromId, []);
        let edges = this.graph.get(fromId);
        for (let toId of toIds) {
            let toCity = this.cityData.get(toId);
            edges.push([toId, dist(fromCity.lon, fromCity.lat, toCity.lon, toCity.lat)]);
        }
    }

    calculateEdges() {
        this.graph.clear();
        let quadtree = new QuadTree(this);
        let nClosest = document.getElementById('n-closest-toggle').checked;

        if (nClosest === true) { // Create edges to the n closest cities
            let n = document.getElementById('n').value;
            for (let fromId of this.cityList) {
                let toIds = quadtree.nClosest(n, fromId);
                this.addEdges(fromId, toIds);
            }
        } else { // Create edges to all cities within r miles
            let r = document.getElementById('r').value;
            for (let fromId of this.cityList) {
                let toIds = quadtree.inRadius(r, fromId);
                this.addEdges(fromId, toIds);
            }
        }
        console.log("done");
    }

    onResize(firstTime=false) {
        // Set up map projection
        this.projection = d3.geoMercator()
            //.rotate([0, 60, 0])
            .fitExtent([[0,0], [window.innerWidth, window.innerHeight]], this.geojson);
        this.geoGenerator = d3.geoPath()
            .projection(this.projection);

        // Draw Map
        d3.select('#graph')
            .selectAll('path')
            .data(this.geojson['features'])
            .join('path')
            .attr('d', this.geoGenerator)
            .style('fill', 'darkgray')
            .style('stroke', 'black');

        // Can't update cities before they are first drawn
        if (firstTime === true)
            return;

        let transform = d3.zoomTransform(d3.select('#graph > path').node()) ?? d3.zoomIdentity;

        // Update City Locations
        d3.select('#graph')
            .selectAll('circle')
            .attr('cx', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[0];
            })
            .attr('cy', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[1];
            })
            .attr('transform', function() {
                return translateOnly(d3.select(this), transform);
            });

    }

    onMinPopChange() {
        let minPop = document.getElementById('pop-input').value;

        // Update list of cities to display
        this.cityList = Array.from(this.cityData).map(([id, data]) => id);
        this.cityList = this.cityList.filter(id => this.cityData.get(id).pop > minPop);

        // Update City Dropdown
        let dropdown = document.getElementById("cities");
        dropdown.replaceChildren();
        this.cityList.forEach((id) => {
            let option = document.createElement("option");
            option.value = this.cityData.get(id).name + ", " + this.cityData.get(id).state;
            dropdown.append(option);
        });

        // Draw Cities
        d3.select('#graph')
            .selectAll('circle')
            .data(this.cityList, d => d)
            .join(
                (enter) => {
                    return enter
                        .append('circle')
                        .on('mouseover', (e, id) => {
                            let self = d3.select(e.target);
                            self.style('fill', 'red');

                            d3.select('#graph').append('text')
                                    .text(this.cityData.get(id).name)
                                    .classed('city-label', true)
                                    .attr('x', self.attr('cx'))
                                    .attr('y', self.attr('cy'))
                                    .attr('transform', function() {
                                        return translateOnly(d3.select(this));
                                    });
                        })
                        .on('mouseout', e => {
                            d3.select(e.target)
                                .style('fill', '#dcdcdc');
                            d3.selectAll('#graph > text').remove();
                        })
                        .attr('r', 0)
                        .style('fill', '#dcdcdc')
                        .style('stroke', '#000000');
                },
                (update) => {
                    return update;
                },
                (exit) => {
                    return exit
                        .transition()
                        .ease(d3.easeBackIn)
                        .attr('r', 0)
                        .remove();
                }
            )
            .attr('cx', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[0];
            })
            .attr('cy', id => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[1];
            })
            .attr('transform', function() {
                return translateOnly(d3.select(this));
            })
            .transition()
            .attr('r', id => Math.log(this.cityData.get(id).pop-minPop)/3+3);
    }
}
