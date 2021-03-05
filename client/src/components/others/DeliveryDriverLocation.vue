<template>
    <b-list-group-item id="driver-location-list-item">
        <div id="map" />
    </b-list-group-item>
</template>

<script>
import ApiService from '@/services/ApiService';

import mapboxgl from 'mapbox-gl';

export default {
    name: 'Delivery',
    props: {
        deliveryId: String
    },
    data () {
        return {
            deliveryLocationData: null
        }
    },
    mounted () {
        this.getDeliveryDetails();
    },
    methods: {
        getDeliveryDetails () {
            ApiService.getDeliveryLocationData(this.deliveryId).then(async res => {
                this.deliveryLocationData = res.data;

                mapboxgl.accessToken = 'pk.eyJ1IjoibXJ2ZGgiLCJhIjoiY2tsdHU5dm5pMGNhYTJ2bzMxZHM1MDczaSJ9.9fYBJZAoZaiZIf-38wWMXQ';
                
                let lastScenario = this.deliveryLocationData.deliveryScenario.scenario[this.deliveryLocationData.deliveryScenario.scenario.length - 1];

                const map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v11',
                    center: [ lastScenario.lng, lastScenario.lat ],
                    zoom: 14
                });

                await map.once('load');

                const img = new Image();

                img.src = this.deliveryLocationData.deliveryScenario.vehicle.image;

                //img.onload = function() {
                    map.addImage('picnic-vehicle', img);
                    map.addSource('picnic-vehicle-source', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [
                                {
                                    'type': 'Feature',
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': [0, 0]
                                    }
                                }
                            ]
                        }
                    });
                    map.addLayer({
                        'id': 'picnic-vehicle-layer',
                        'type': 'symbol',
                        'source': 'picnic-vehicle-source',
                        'layout': {
                            'icon-image': 'picnic-vehicle',
                            'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 0.5]
                        }
                    });
                //};

                // const img = new Image();

                // img.src = this.deliveryLocationData.deliveryScenario.vehicle.image;

                // img.onload = function() {
                //     img.style.width = img.naturalWidth / 5 + "px";
                //     img.style.height = img.naturalHeight / 5 + "px";

                //     new mapboxgl.Marker(img)
                //         .setLngLat([ lastScenario.lng, lastScenario.lat ])
                //         .addTo(map);

                //     map.on('zoom', () => {
                //         //const scalePercent = 1 + (map.getZoom() - 8)  * 0.4;
                //         console.log(Math.pow(2, map.getZoom()))
                //         img.style.width = (img.naturalWidth / 5) * (map.getZoom() - 8) + "px";
                //         img.style.height = (img.naturalHeight / 5) * (map.getZoom() - 8) + "px";
                //         // svgElement.style.transform = `scale(${scalePercent})`;
                //         // svgElement.style.transformOrigin = 'bottom';
                //     });
                // };

                // var el = document.createElement('div');
                // el.style.backgroundImage = `url(${ this.deliveryLocationData.deliveryScenario.vehicle.image })`;
                // el.style.width = '100%';
                // el.style.height = '100%';

                // new mapboxgl.Marker(el)
                //     .setLngLat([ lastScenario.lng, lastScenario.lat ])
                //     .addTo(map);
                
                let coordinatesDone = [];
                let coordinatesToGo = [];
                let carLocationFound = false;

                // debug:
                this.deliveryLocationData.deliveryPosition.scenario_ts = this.deliveryLocationData.deliveryScenario.scenario[100].ts;

                for (let scenario of this.deliveryLocationData.deliveryScenario.scenario) {
                    if (carLocationFound) {
                        coordinatesToGo.push([ scenario.lng, scenario.lat ]);
                    } else {
                        coordinatesDone.push([ scenario.lng, scenario.lat ]);
                    }

                    if (!carLocationFound && this.deliveryLocationData.deliveryPosition.scenario_ts === scenario.ts) {
                        carLocationFound = true;
                        coordinatesToGo.push([ scenario.lng, scenario.lat ]);
                    }
                }

                map.addSource('route-done-source', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': { },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coordinatesDone
                        }
                    }
                });

                map.addLayer({
                    'id': 'route-done-layer',
                    'type': 'line',
                    'source': 'route-done-source',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#888',
                        'line-width': 6,
                        'line-opacity': 0.4
                    }
                });

                map.addSource('route-togo-source', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': { },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coordinatesToGo
                        }
                    }
                });

                map.addLayer({
                    'id': 'route-togo-layer',
                    'type': 'line',
                    'source': 'route-togo-source',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#E1171E',
                        'line-width': 6
                    }
                });

                map.addSource("start-source", {
                    type: "geojson",
                    data: {
                        'type': 'Feature',
                        'properties': { },
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [ this.deliveryLocationData.deliveryScenario.scenario[0].lng, this.deliveryLocationData.deliveryScenario.scenario[0].lat ]
                        }
                    }
                });
                
                map.addSource("end-source", {
                    type: "geojson",
                    data: {
                        'type': 'Feature',
                        'properties': { },
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [ lastScenario.lng, lastScenario.lat ]
                        }
                    }
                });
                
                map.addLayer({
                    id: "start-layer",
                    type: "circle",
                    source: "start-source",
                    filter: ["!", ["has", "point_count"]],
                    paint: {
                        "circle-color": "#E1171E",
                        "circle-radius": 6,
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                    }
                });
                
                map.addLayer({
                    id: "end-layer",
                    type: "circle",
                    source: "end-source",
                    filter: ["!", ["has", "point_count"]],
                    paint: {
                        "circle-color": "#88A91E",
                        "circle-radius": 6,
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff"
                    }
                });

                if (coordinatesToGo.length) {
                    var bounds = coordinatesToGo.reduce((bounds, coord) => { return bounds.extend(coord); }, new mapboxgl.LngLatBounds(coordinatesToGo[0], coordinatesToGo[0]));
                    
                    map.fitBounds(bounds, {
                        padding: 40,
                        maxZoom: 17
                    });
                } else {
                    map.flyTo({center: [ lastScenario.lng, lastScenario.lat ], zoom: 17});
                }
            }).catch(() => {
                document.getElementById("driver-location-list-item").remove();
            });
        }
    }
}
</script>

<style scoped lang="scss">
#map {
    height: 250px;
}
</style>
