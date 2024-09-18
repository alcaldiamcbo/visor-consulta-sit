<template>
  <div v-if="!loading" id="map" >
    <v-snackbar v-model="snackbar" :timeout="2000" variant="flat" color="accent">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
  <div v-else class="loading-spinner">
    <v-row justify="center">
        <v-col cols="12" class="d-flex justify-center">
            <v-progress-circular indeterminate :size="70" color="primary"></v-progress-circular>
        </v-col>
    </v-row>
  </div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Fill, Stroke } from 'ol/style';
import mark from '@/assets/icons8-circle-24.png';
import GeoJSON from 'ol/format/GeoJSON';
import proj4 from 'proj4';
import { toLonLat, fromLonLat } from 'ol/proj';
// Define the source and destination projections
const sourceProjection4326 = 'EPSG:4326';
const destinationProjection2202 = 'EPSG:2202';

// Define the custom EPSG:2202 projection
proj4.defs(destinationProjection2202, "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Create proj4 converters
const converter4326to2202 = proj4(sourceProjection4326, destinationProjection2202);
const converter2202to4326 = proj4(destinationProjection2202, sourceProjection4326);

import { mapState, mapActions, mapMutations } from 'vuex';



export default {
  name: 'MapComponent',
  data: () => ({
    // Component data
    loading: true,
    map: null,
    currentVectorLayer: null,
    wmsLayers: [],
    snackbar: false,
    snackbarMessage: '',
  }),
  
  computed: {
    ...mapState(['featuredMap', 'mapLayers', 'addedLayer', 'removedLayer', 'selectedMap', 'cqlFilters', 'markedCoordinate', 'tracedFeature', 'mapLocation'])
  },
  methods: {
    ...mapActions(['getMaps', 'getCategories', 'getDatasets', 'fetchFeatures']),
    ...mapMutations(['setSelectedMap', 'setMapCenter', 'setMapZoom', 'setMarkedCoordinate', 'openSecondDrawer', 'resetTracedFeature']),
    async fetchInitialData() {
      if (!this.mapLayers || this.mapLayers.length === 0) {
        await this.getMaps();
        this.setSelectedMap(this.featuredMap);
      }
      await Promise.all([
        this.getCategories(),
        this.getDatasets()
      ]);

      this.loading = false; // Set loading to false after data is fetched
      this.$nextTick(() => {
        this.initializeMap();
      });
      this.showStatus(this.selectedMap.title);
    },
    showStatus(string) {
      try {
        //console.log('Categories and Datasets fetched before MapComponent is created');
        this.snackbarMessage = `${string} cargado con éxito!`;
        this.snackbar = true;
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        this.snackbarMessage = `error al cargar el mapa!`;
        this.snackbar = true;
      }
    },
    initializeMap() {
      const { lng, lat, zoom } = this.mapLocation;
      // Initialize the map
      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({
            source: new OSM({
              cacheSize: 1000,
            })
          })
        ],
        view: new View({
          center: fromLonLat([lng, lat]),
          zoom: zoom,
        })
      });

      // Add initial WMS layers
      this.initializeWMSLayers();

      // Add event listener for map center change
      this.map.getView().on('change:center', () => {
        const center = toLonLat(this.map.getView().getCenter());
        this.setMapCenter(center);
      });

      // Add event listener for map zoom change
      this.map.getView().on('change:resolution', () => {
        const zoom = this.map.getView().getZoom();
        this.setMapZoom(zoom);
      });

      // Add marker interaction
      this.map.on('click', (event) => {

        const coordinates = event.coordinate;

        // Convert the clicked coordinate to longitude/latitude and then to EPSG:2202
        const lonLat = toLonLat(coordinates);
        const coord = converter4326to2202.forward([lonLat[0], lonLat[1]]);

        // Commit the clicked coordinate to the Vuex store
        this.setMarkedCoordinate(coord);
      });
    },
    async initializeWMSLayers() {
      if (!this.map) {
        return; // Ensure map is initialized before updating layers
      }

      // Remove existing WMS layers from the map
      this.wmsLayers.forEach(layer => this.map.removeLayer(layer));
      this.wmsLayers = [];

      // Add new WMS layers based on mapLayers
      for (const layer of this.mapLayers) {
        const wmsLink = layer.dataset.links.find(link => link.link_type === 'OGC:WMS');
        if (wmsLink) {
          const wmsLayer = new TileLayer({
            source: new TileWMS({
              url: wmsLink.url,
              params: { 'LAYERS': layer.dataset.alternate, 'TILED': true },
              serverType: 'geoserver',
              cacheSize: 1000,
            }),
            opacity: layer.opacity,
            visible: layer.visibility,
            zIndex: layer.order, // Set zIndex using layer.order
            pk: layer.dataset.pk
          });
          this.map.addLayer(wmsLayer);
          this.wmsLayers.push(wmsLayer);
        }
      }
    },
    addWMSLayer(newLayer) {
      if (!this.map) return;

      const wmsLink = newLayer.dataset.links.find(link => link.link_type === 'OGC:WMS');

      if (wmsLink) {
        const wmsLayer = new TileLayer({
          source: new TileWMS({
            url: wmsLink.url,
            params: { 'LAYERS': newLayer.dataset.alternate, 'TILED': true },
            serverType: 'geoserver'
          }),
          opacity: newLayer.opacity,
          visible: newLayer.visibility,
          zIndex: newLayer.order, // Set zIndex using layer.order
          pk: newLayer.dataset.pk
        });
        this.map.addLayer(wmsLayer);
        this.wmsLayers.push(wmsLayer);
        //console.log(this.wmsLayers);
      }
    },
    removeWMSLayer(layer) {
      if (!this.map) return;
      //console.log(this.wmsLayers);

      if (!layer || !layer.dataset || !layer.dataset.pk) {
        console.error('Invalid layer object:', layer);
        return;
      }
      const layerPk = layer.dataset.pk;
      const wmsLayerIndex = this.wmsLayers.findIndex(wmsLayer => wmsLayer.get('pk') === layerPk);
      if (wmsLayerIndex !== -1) {
        const wmsLayer = this.wmsLayers[wmsLayerIndex];
        this.map.removeLayer(wmsLayer);
        this.wmsLayers.splice(wmsLayerIndex, 1);
        //console.log(`Layer with pk ${layerPk} removed successfully.`);
      } else {
        console.warn(`Layer with pk ${layerPk} not found in wmsLayers.`);
      }
    },
    updateLayerLegend(filters) {
      if (!this.map) return;

      filters.forEach(filter => {
        const layer = this.map.getLayers().getArray().find(layer => {
          const source = layer.getSource();
          return source instanceof TileWMS && source.getParams().LAYERS === filter.datasetName;
        });

        if (layer) {
          const source = layer.getSource();
          //console.log(`Updating layer ${filter.datasetName} with CQL_FILTER: ${filter.query}`);
          source.updateParams({
            CQL_FILTER: filter.query
          });
          source.refresh();
        } else {
          console.warn(`Layer with datasetName ${filter.datasetName} not found.`);
        }
      });
    },
    updateLayerProperties(layer) {
      const wmsLayer = this.wmsLayers.find(wmsLayer => wmsLayer.get('pk') === layer.dataset.pk);
      if (wmsLayer) {
        wmsLayer.setOpacity(layer.opacity);
        wmsLayer.setVisible(layer.visibility);
        //console.log(`Updated layer ${layer.dataset.pk} properties: opacity=${layer.opacity}, visibility=${layer.visibility}`);
      } else {
        console.warn(`Layer with pk ${layer.dataset.pk} not found in wmsLayers.`);
      }
    },
    addMarker(coordinates) {
      // Remove existing marker if it exists
      if (this.markerFeature) {
        this.markerLayer.getSource().removeFeature(this.markerFeature);
      }

      // Create a new marker feature
      this.markerFeature = new Feature({
        geometry: new Point(coordinates)
      });

      // Style the marker
      this.markerFeature.setStyle(new Style({
        image: new Icon({
          anchor: [0.5, 0.5], // Adjust these values as needed
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          src: mark,
        })
      }));

      // Add the marker to the marker layer
      if (!this.markerLayer) {
        this.markerLayer = new VectorLayer({
          source: new VectorSource({
            features: [this.markerFeature]
          }),
          zIndex: 1000
        });
        this.map.addLayer(this.markerLayer);
      } else {
        this.markerLayer.getSource().addFeature(this.markerFeature);
      }
    },
    removeMarker() {
      if (this.markerLayer) {
        this.markerLayer.getSource().clear();
      }
    },
    addFeature(feature) {
      // Debugging log
      //console.log('Adding feature:', feature);
      // Validate the feature
      if (!feature || !feature.type) {
        console.error('Invalid feature:', feature);
        return;
      }

      // remove existing vector layer if it exists
      if (this.currentVectorLayer) {
        this.map.removeLayer(this.currentVectorLayer);
      }
      // Create a GeoJSON format writer
      const format = new GeoJSON();

      // Convert the feature to GeoJSON
      let geometry;
      try {
        geometry = format.readFeatures(feature, {
          dataProjection: 'EPSG:3857',
          featureProjection: this.map.getView().getProjection()
        });
      } catch (error) {
        console.error('Error reading features:', error);
        return;
      }

      // Create a new vector source and add the features to it
      const newVectorSource = new VectorSource({
        features: geometry
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
          style: style,
          zIndex: 900
        });

        // Add the new vector layer to the map
        this.map.addLayer(newVectorLayer);

        // Update the current vector layer
        this.currentVectorLayer = newVectorLayer;

        // Get the extent of the features
        const extent = newVectorSource.getExtent();

        // Fit the view to the extent of the features
        this.map.getView().fit(extent, { duration: 1000 });
    },
    removeTracedFeature() {
      if (this.currentVectorLayer) {
        this.map.removeLayer(this.currentVectorLayer);
        this.currentVectorLayer = null;
      }
    }
  },
  watch: {
    mapLayers: {
      handler(newLayers) {
        newLayers.forEach(layer => {
          this.updateLayerProperties(layer);
        });
      },
      deep: true
    },
    addedLayer(newLayer) {
      //console.log('Adding new layer:', newLayer);
      this.addWMSLayer(newLayer);
    },
    removedLayer(layerPk) {
      //console.log('Removing layer:', layerPk);
      this.removeWMSLayer(layerPk);
    },
    cqlFilters: {
        handler(newFilters) {
          //console.log('Updating layer legend with new filters:', newFilters);  
          this.updateLayerLegend(newFilters);
        },
        deep: true
    },
    markedCoordinate(newVal) {
      // remove existing vector layer if it exists
      if (this.currentVectorLayer) {
        this.map.removeLayer(this.currentVectorLayer);
      }
      //console.log('Watcher triggered:', newVal, oldVal); // Debugging log
      if (newVal) {
        // Destructure the newVal array for clarity
        const [newX, newY] = newVal;
        // Convert the new coordinate to longitude/latitude and then to EPSG:3758
        const lonLat = converter2202to4326.forward([newX, newY]);
        const coord = fromLonLat(lonLat);
        this.addMarker(coord);
        // Zoom to the clicked coordinates
        this.map.getView().animate({
            center: coord,
            zoom: 18
        });
        
        // Trigger openSecondDrawer and fetchFeatures
        this.openSecondDrawer();
        this.fetchFeatures();
      } else {
        this.removeMarker();
      }
    },
    tracedFeature(newVal) {
      if (newVal !== null) {
        this.addFeature(newVal);
      } else {
        //console.log('Removing traced feature');
        this.removeTracedFeature();
      }
    },
    mapLocation(newLocation) {
      if (newLocation) {
        this.map.getView().setCenter(fromLonLat([newLocation.lng, newLocation.lat]));
        this.map.getView().setZoom(newLocation.zoom);
      }
    },
  },
  created() {
    this.fetchInitialData();
  },
  async beforeMount() {
    // Destructure for cleaner access to dispatch and state
    const { dispatch } = this.$store;

    // Use dispatch directly from destructured store
    await dispatch('fetchSearchFeatures');
    //await dispatch('fetchFilterFeatures');
    //await dispatch('fetchMapDatasets');
  },
}
</script>

<style>
@import "../../node_modules/ol/ol.css";

#map {
  width: 100%;
  height: 100%;
  position: relative; /* Changed from absolute to relative */
}

.ol-zoom {
  top: .5em;
  right: .5em;
  left: auto;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000; /* Ensure the spinner is on top */
}
</style>