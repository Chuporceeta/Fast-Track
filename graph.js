const US_BOUNDS = {top:49.35,    // north lat
                        left:-124.78, // west long
                        right:-66.95, // east long
                        bottom:24.74} // south lat

class AdjList {
    constructor(data) {
        this.cityData = new Map();
        data.forEach((city) => {
            this.cityData.set(city['id'], {lat:city['lat'], lon:city['lon'], name:city['city'], pop:city['population']});
        });
        console.log(this.cityData);
        this.graph = {}; // fromCityId : [toCityId, distance]
    }

    drawNodes(scale) {
        let minPop = document.getElementById('pop-input').value;
        let cities = Array.from(this.cityData).map(([id, data]) => (data));
        cities = cities.filter((city) => {return city.pop > minPop;});
        console.log(cities)
        d3.select('#graph')
            .selectAll('circle')
            .data(cities)
            .join('circle')
            .on('mouseover', (e, d) => {
                d3.select(e.target)
                    .style('fill', 'red');
            })
            .on('mouseout', (e, d) => {
                d3.select(e.target)
                    .style('fill', '#dcdcdc');
            })
            .attr('cx', (city, i) => {
                return 3236 * (city.lon + 124.78) / scale;
            })
            .attr('cy', (city, i) => {
                return -4000 * (city.lat - 49.35) / scale;
            })
            .attr('r', (city, i) => {
                return Math.log(city.pop-minPop)/3+3;
            })
            .style('fill', '#dcdcdc')
            .style('stroke', '#000000')

    }

}
