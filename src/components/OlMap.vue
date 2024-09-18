<template>    
    <div ref="mapContainer" class="map-container"></div>
</template>

<script>
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat, toLonLat } from 'ol/proj';
import proj4 from 'proj4';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon, Fill, Stroke } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import mark from '@/assets/icons8-circle-24.png';

import { mapState, mapMutations, mapActions } from 'vuex';

// Define the source and destination projections
const sourceProjection4326 = 'EPSG:4326';
const destinationProjection2202 = 'EPSG:2202';

// Define the custom EPSG:2202 projection
proj4.defs(destinationProjection2202, "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Create proj4 converters
const converter4326to2202 = proj4(sourceProjection4326, destinationProjection2202);
const converter2202to4326 = proj4(destinationProjection2202, sourceProjection4326);

export default {
    name: "OlMap",
    data() {
        return {
            map: null,
            currentVectorLayer: null,
        }
    },
    async beforeMount() {
        // Destructure for cleaner access to dispatch and state
        const { dispatch, state, commit } = this.$store;

        // Use dispatch directly from destructured store
        await dispatch('fetchSearchFeatures');
        await dispatch('fetchFilterFeatures');

        if (state.mapLayers.length === 0 && state.mapDatasets.length === 0) {
            // Fetch the default map
            let maps = await dispatch('fetchMaps');
            let defaultMap = maps.find(map => map.title === "Zonificación Urbana de Maracaibo");
            if (defaultMap) {
                commit('setSelectedMap', defaultMap);
                await dispatch('fetchDatasets');
            }
        }
    },
    computed: {
        ...mapState(['mapLayers', 'mapLocation', 'markedCoordinate', 'tracedFeature', 'features']),
        sortedMapLayers() {
            return [...this.mapLayers].sort((a, b) => a.order - b.order);
        },
    },
    watch: {
        mapLayers: {
            handler(newMapLayers) {
                newMapLayers.forEach(layer => {
                    const olLayer = this.map.getLayers().getArray().find(olLayer => olLayer.get('pk') === layer.pk);
                    if (olLayer) {
                        olLayer.setOpacity(layer.opacity);
                        olLayer.setVisible(layer.visibility);
                    }
                });
            },
            deep: true,
        },
        markedCoordinate(newVal, oldVal) {
            // Direct comparison might be unnecessary if Vue guarantees this watcher is only triggered on actual changes.
            // However, if you want to ensure there's a significant change (e.g., beyond a minor floating-point difference), you might keep it.
            console.log('Watcher triggered:', newVal, oldVal); // Debugging log
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                this.vectorSource.clear(); // Clear the vector source

                // Destructure the newVal array for clarity
                const [newX, newY] = newVal;

                // Convert the new coordinate to longitude/latitude and then to EPSG:3758
                const lonLat = converter2202to4326.forward([newX, newY]);
                const coord = fromLonLat(lonLat);

                // Create and add a new feature with a point geometry at the new coordinates
                const feature = new Feature({
                    geometry: new Point(coord)
                });

                this.vectorSource.addFeature(feature);

                // Zoom to the new coordinates
                this.map.getView().animate({
                center: coord,
                zoom: 18,
                });

                // Trigger openSecondDrawer and fetchFeatures
                this.openSecondDrawer();
                this.fetchFeatures();
            }
        },
        tracedFeature(newVal, oldVal) {
            if (newVal !== oldVal) {
            // If there's a current vector layer, remove it from the map
                if (this.currentVectorLayer) {
                    this.map.removeLayer(this.currentVectorLayer);
                }

                // Create a GeoJSON format reader
                const format = new GeoJSON();

                // Read the GeoJSON data and convert it to features
                const features = format.readFeatures(newVal, {
                    dataProjection: 'EPSG:3857',
                    featureProjection: this.map.getView().getProjection()
                });

                // Create a new vector source and add the features to it
                const newVectorSource = new VectorSource({
                    features: features
                });

                // Create a new style with a darker gray fill and a green stroke
                const style = new Style({
                    fill: new Fill({
                    color: 'rgba(105, 105, 105, 0.5)'  // Darker gray
                    }),
                    stroke: new Stroke({
                    color: 'green',  // Green
                    width: 2
                    })
                });

                // Create a new vector layer with the new vector source
                const newVectorLayer = new VectorLayer({
                    source: newVectorSource,
                    style: style
                });

                // Add the new vector layer to the map
                this.map.addLayer(newVectorLayer);

                // Update the current vector layer
                this.currentVectorLayer = newVectorLayer;

                // Get the extent of the features
                const extent = newVectorSource.getExtent();

                // Fit the view to the extent of the features
                this.map.getView().fit(extent, { duration: 1000 });
            }
        },
        mapLocation(newLocation) {
            if (newLocation) {
                this.map.getView().setCenter(fromLonLat([newLocation.lng, newLocation.lat]));
                this.map.getView().setZoom(newLocation.zoom);
            }
        },
    },
    methods: {
        ...mapMutations(['setMarkedCoordinate', 'openSecondDrawer']),
        ...mapActions(['fetchFeatures']),
        initMap() {
            try {
                const { lng, lat, zoom } = this.mapLocation;

                // Create a TileLayer for each layer in sortedMapLayers
                const wmsLayers = this.sortedMapLayers.map(layer => new TileLayer({
                    source: new TileWMS({
                        url: `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`,
                        params: {
                            'LAYERS': layer.name,
                            'TILED': true
                        },
                        serverType: 'geoserver',
                        cacheSize: 1000  // Cache the last 1000 tiles
                    }),
                    opacity: layer.opacity,
                    visible: layer.visibility,
                    pk: layer.pk  // Set the pk of the OpenLayers layer
                }));

                this.map = new Map({
                    target: this.$refs.mapContainer,
                    layers: [
                        new TileLayer({
                            source: new OSM({
                                cacheSize: 1000  // Cache the last 1000 tiles
                            }),
                        }),
                        ...wmsLayers  // Add the WMS layers to the map
                    ],
                    view: new View({
                        center: fromLonLat([lng, lat]),
                        zoom: zoom
                    })
                });

                // Create a vector source and add it to a vector layer
                this.vectorSource = new VectorSource();
                const vectorLayer = new VectorLayer({
                    source: this.vectorSource,
                    style: new Style({
                        image: new Icon({
                            anchor: [0.5, 0.5], // Adjust these values as needed
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            src: mark
                        })
                    })
                });

                // Add the vector layer to the map
                this.map.addLayer(vectorLayer);

                // Add a click event listener to the map
                this.map.on('click', (event) => {
                    // Clear the vector source
                    this.vectorSource.clear();
                    
                    // Create a new feature with a point geometry at the clicked coordinates
                    const feature = new Feature({
                        geometry: new Point(event.coordinate)
                    });

                    // Add the feature to the vector source
                    this.vectorSource.addFeature(feature);

                    // Convert the clicked coordinate to longitude/latitude and then to EPSG:2202
                    const lonLat = toLonLat(event.coordinate);
                    const coord = converter4326to2202.forward([lonLat[0], lonLat[1]]);

                    // Commit the clicked coordinate to the Vuex store
                    this.setMarkedCoordinate(coord);

                    // Zoom to the clicked coordinates
                    this.map.getView().animate({
                        center: event.coordinate,
                        zoom: 18
                    });

                });
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
        }
    },
    created() {
        this.sortedMapLayers.forEach((layer, index) => {
            this.$watch(`mapLayers[${index}].opacity`, (newOpacity) => {
                const olLayer = this.map.getLayers().getArray()[index + 1];  // +1 to skip the base map layer
                if (olLayer) {
                    olLayer.setOpacity(newOpacity);
                }
            });

            this.$watch(`mapLayers[${index}].visibility`, (newVisibility) => {
                const olLayer = this.map.getLayers().getArray()[index + 1];  // +1 to skip the base map layer
                if (olLayer) {
                    olLayer.setVisible(newVisibility);
                }
            });
        });
    },
    mounted() {
        this.initMap();
        this.map.on('moveend', () => {
            let center = this.map.getView().getCenter();
            const zoom = this.map.getView().getZoom();
            this.$store.commit('setMapCenter', center);
            this.$store.commit('setMapZoom', zoom);
        });
    },
}
</script>

<style>
@import "../../node_modules/ol/ol.css";

.map-container {
    height: 100vh;
    width: 100vw;
}

.ol-zoom {
  top: .5em;
  right: .5em;
  left: auto;
}
</style>