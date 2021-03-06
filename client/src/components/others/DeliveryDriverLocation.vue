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
            deliveryLocationData: null,
            interval: null
        }
    },
    mounted () {
        this.getDeliveryDetails();
    },
    beforeDestroy () {
        clearInterval(this.interval);
    },
    methods: {
        async getDeliveryDetails () {
            try {
                this.deliveryLocationData = (await ApiService.getDeliveryLocationData(this.deliveryId)).data;
            } catch {
                document.getElementById("driver-location-list-item").remove();
                return;
            }

            mapboxgl.accessToken = 'pk.eyJ1IjoibXJ2ZGgiLCJhIjoiY2tsdHU5dm5pMGNhYTJ2bzMxZHM1MDczaSJ9.9fYBJZAoZaiZIf-38wWMXQ';
            
            let lastScenario = this.deliveryLocationData.deliveryScenario.scenario[this.deliveryLocationData.deliveryScenario.scenario.length - 1];

            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [ lastScenario.lng, lastScenario.lat ],
                zoom: 14
            });

            await map.once('load');

            await this.drawMapItems(map);

            this.interval = setInterval(async () => {
                try {
                    this.deliveryLocationData = (await ApiService.getDeliveryLocationData(this.deliveryId)).data;
                } catch {
                    document.getElementById("driver-location-list-item").remove();
                }

                await this.removeMapItems(map);
                await this.drawMapItems(map);
            }, 8000);
        },
        async drawMapItems (map) {
            let coordinatesDone = [];
            let coordinatesToGo = [];
            let carLocationFound = false;

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

            let lastScenario = this.deliveryLocationData.deliveryScenario.scenario[this.deliveryLocationData.deliveryScenario.scenario.length - 1];
            let currentScenario = this.deliveryLocationData.deliveryScenario.scenario.find(x => x.ts === this.deliveryLocationData.deliveryPosition.scenario_ts);

            const img = new Image();

            img.src = this.deliveryLocationData.deliveryScenario.vehicle.image;

            img.onload = function() {
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
                                    'coordinates': [ currentScenario.lng, currentScenario.lat ]
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
                        'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.1, 21, 0.5]
                    }
                });
            };

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
        },
        async removeMapItems (map) {
            map.removeImage('picnic-vehicle');
            map.removeLayer('end-layer');
            map.removeLayer('start-layer');
            map.removeLayer('route-togo-layer');
            map.removeLayer('route-done-layer');
            map.removeLayer('picnic-vehicle-layer');
            map.removeSource('end-source');
            map.removeSource('start-source');
            map.removeSource('route-togo-source');
            map.removeSource('route-done-source');
            map.removeSource('picnic-vehicle-source');
        }
    }
}
</script>

<style scoped lang="scss">
#map {
    height: 250px;
}
</style>
