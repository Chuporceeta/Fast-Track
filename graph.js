class AdjList {
    constructor(data) {
        this.cityData = new Map();
        data.forEach((city) => {
            if (city['state'] !== 'AK' && city['state'] !== 'HI')
                this.cityData.set(city['id'], {lat:city['lat'], lon:city['lon'], name:city['city'], pop:city['population']});
        });
        this.graph = {}; // fromCityId : [toCityId, distance]

    }

    onResize() {
        // Set up map projection
        this.projection = d3.geoMercator()
            //.rotate([0, 60, 0])
            .fitExtent([[0,0], [window.innerWidth, window.innerHeight]], geojson);
        this.geoGenerator = d3.geoPath()
            .projection(this.projection);

        // Draw Map
        d3.select('#graph')
            .selectAll('path')
            .data(geojson['features'])
            .join('path')
            .attr('d', this.geoGenerator)
            .style('fill', 'darkgray')
            .style('stroke', 'black');

    }

    draw() {
        let radius = (id) => Math.log(this.cityData.get(id).pop-minPop)/3+3;
        let minPop = document.getElementById('pop-input').value;

        // Get list of cities to display
        let cityList = Array.from(this.cityData).map(([id, data]) => id);
        cityList = cityList.filter(id => this.cityData.get(id).pop > minPop);

        let transform = d3.zoomTransform(d3.select('#graph > path').node()) ?? d3.zoomIdentity;

        // Draw Cities
        d3.select('#graph')
            .selectAll('circle')
            .data(cityList, d => d)
            .join(
                (enter) => {
                    return enter
                        .append('circle')
                        .on('mouseover', (e, d) => {
                            d3.select(e.target)
                                .style('fill', 'red');
                        })
                        .on('mouseout', (e, d) => {
                            d3.select(e.target)
                                .style('fill', '#dcdcdc');
                        })
                        .attr('r', 0)
                        .style('fill', '#dcdcdc')
                        .style('stroke', '#000000')
                      ;

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
            .attr('cx', (id, i) => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[0];
            })
            .attr('cy', (id, i) => {
                let city = this.cityData.get(id);
                return this.projection([city.lon, city.lat])[1];
            })
            .attr('transform', function(id, i) {
                return translateOnly(d3.select(this), transform);
            })
            .transition()
            .attr('r', id => radius(id));
    }

}
