import { createStore } from 'vuex'
import axios from 'axios';

import * as turf from '@turf/turf';

export default createStore({
  state: {
    // Parameters
    nodeServerUrl: process.env.VUE_APP_NODE_URL,
    geoServerUrl: process.env.VUE_APP_SERVER_URL,
    nodeServerApi: 'api/v2',
    mapsEndpoint: '/maps',
    categoriesEndpoint: '/categories',
    datasetsEndpoint: '/datasets',
    // Data
    allMaps: [],
    featuredMap: null,
    selectedMap: null,
    mapLayers: [],
    addedLayer: null,
    removedLayer: null,
    categories: [],
    datasets: [], // used to separate concerns betwwen mapLayers and datasets which is used to generate the layers panel
    mapDatasets: [], // used to store the datasets for the corresponding mapLayers which is used to generate the results panel
    styles: [],
    // App states
    cqlFilters: [],
    markedCoordinate: [],
    secondDrawer: false,
    features: [], // used to store the features for the corresponding mapLayers which is used to generate the results panel
    tracedFeature: null,

    // To be deprecated states
    mapLocation: {
      lng: -71.6930587033,
      lat: 10.6775887114,
      bearing: 0,
      pitch: 0,
      zoom: 11.6,
    },
    maps: [],
    
    searchFeatures: [],
    filterFeatures: [],
    
    
    
    // other state properties...
  },
  getters: {
  },
  mutations: {
    setMaps(state, fetchedMaps) {
      const regularMaps = fetchedMaps.maps.filter(map => map.featured === false);
      state.allMaps = regularMaps || [];
      //console.log('Regular maps', state.maps);
    },
    setFeaturedMap(state, fetchedMaps) {
      const featuredMap = fetchedMaps.maps.find(map => map.featured === true);
      state.featuredMap = featuredMap || null;
      //console.log('Featured map', state.featuredMap);
    },
    setSelectedMap(state, map) {
      state.selectedMap = map;
      //console.log(`${state.selectedMap.title} selected`);
      state.mapLayers = map.maplayers;
      //console.log(`${state.mapLayers.length} layers loaded`);
      //console.log(state.mapLayers);
      // for every maplayer run fetchStyle
      for (const layer of state.mapLayers) {
        this.dispatch('fetchStyle', layer.name);
      }
    },
    addLayer(state, dataset) {
      const newLayer = { 
        pk: state.mapLayers.length + 1,
        name: dataset.dataset.alternate,
        order: state.mapLayers.length === 0 ? -1 : state.mapLayers[0].order - 1,
        visibility: true,
        opacity: 0.8,
        dataset: dataset.dataset,
        current_style: dataset.dataset.alternate,
        extra_params: dataset.dataset.extra_params
      };
      //console.log('newLayer', newLayer);
      state.mapLayers.push(newLayer);
      state.addedLayer = newLayer;
      // fetch style for the new layer
      this.dispatch('fetchStyle', newLayer.name);
      // fecth datasets for the new layer
      this.dispatch('fetchMapDatasets');
    },
    removeLayer(state, layer) {
      //console.log(layer);
      state.mapLayers = state.mapLayers.filter(l => l.dataset.pk !== layer.dataset.pk);
      // remove the layer style from the styles object
      delete state.styles[layer.dataset.alternate];
      // clear removedLayer
      state.removedLayer = null;
      // set the removedLayer to the layer dataset pk
      state.removedLayer = layer;
      //console.log('Layer removed', state.removedLayer);
    },
    setCategories(state, categories) {
      const filterCategories = categories.filter(category => category.count > 0);
      state.categories = filterCategories
      //console.log(`${filterCategories.length} categories loaded`);
      //console.log(state.categories);
    },
    setDatasets(state, datasets) {
      state.datasets = datasets;
    },
    setStyles(state, style) {
      // parse xml string to xml document
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(style, 'text/xml');
      // maps attributes and values to a JSON object
      const styleJSON = {};
      //console.log('xmlDoc', xmlDoc);
      const layerName = xmlDoc.getElementsByTagName('sld:Name')[0].textContent;
      //console.log('layerName', layerName);
      const featureTypeStyles = xmlDoc.getElementsByTagName('sld:FeatureTypeStyle');
      const rules = featureTypeStyles[0].getElementsByTagName('sld:Rule');
      //console.log('rules', rules[0]);
      // find all rules
      for (let i = 0; i < rules.length; i++) {
        const nameElement = rules[i].getElementsByTagName('sld:Name')[0];
        if (nameElement) {
          const name = nameElement.textContent;
          const symbolizer = {
            name: name
          };
    
          // Check for PolygonSymbolizer
          const polygonSymbolizer = rules[i].getElementsByTagName('sld:PolygonSymbolizer')[0];
          if (polygonSymbolizer) {
            const fill = polygonSymbolizer.getElementsByTagName('sld:Fill')[0];
            //const stroke = polygonSymbolizer.getElementsByTagName('sld:Stroke')[0]; //stroke is not always present
            symbolizer.fill = { color: fill.getElementsByTagName('sld:CssParameter')[0].textContent };
            //symbolizer.stroke = { color: stroke.getElementsByTagName('sld:CssParameter')[0].textContent };
            symbolizer.type = 'Polygon';
          }
    
          // Check for PointSymbolizer
          const pointSymbolizer = rules[i].getElementsByTagName('sld:PointSymbolizer')[0];
          if (pointSymbolizer) {
            const graphic = pointSymbolizer.getElementsByTagName('sld:Graphic')[0];
            const mark = graphic.getElementsByTagName('sld:Mark')[0];
            const fill = mark.getElementsByTagName('sld:Fill')[0];
            const size = graphic.getElementsByTagName('sld:Size')[0];
            symbolizer.mark = { fill: { color: fill.getElementsByTagName('sld:CssParameter')[0].textContent } };
            symbolizer.size = size.textContent;
            symbolizer.type = 'Point';
          }
    
          // Check for LineSymbolizer
          const lineSymbolizer = rules[i].getElementsByTagName('sld:LineSymbolizer')[0];
          if (lineSymbolizer) {
            const stroke = lineSymbolizer.getElementsByTagName('sld:Stroke')[0];
            symbolizer.stroke = {
              color: stroke.getElementsByTagName('sld:CssParameter')[0].textContent,
              //width: parseFloat(stroke.querySelector('sld\\:CssParameter[name="stroke-width"]').textContent) //stroke-width is not always present
            };
            symbolizer.type = 'Line';
          }

          const filter = rules[i].getElementsByTagName('ogc:Filter')[0];
          if (filter) {
            const propertyIsEqualTo = filter.getElementsByTagName('ogc:PropertyIsEqualTo')[0];
            if (propertyIsEqualTo) {
              const propertyName = propertyIsEqualTo.getElementsByTagName('ogc:PropertyName')[0].textContent;
              const literal = propertyIsEqualTo.getElementsByTagName('ogc:Literal')[0].textContent;
              symbolizer.filter = { propertyName: propertyName, literal: literal };
            }
          }

          // add a visibility property to the symbolizer set to true by default
          symbolizer.visibility = true;

          // add a checkbox property that sets true for all syblolizer if there are more than one, if just one set to false
          if (rules.length > 1) {
            symbolizer.checkbox = true;
          } else {
            symbolizer.checkbox = false;
          }
    
          styleJSON[i] = symbolizer;
        }
      }

      const allStyles = Object.keys(styleJSON).reduce((acc, key) => {
        const modifiedStyle = { ...styleJSON[key] };
        return { ...acc, [Number(key)]: modifiedStyle };
      }, {});
      state.styles = { ...state.styles, [layerName]: allStyles };
      //console.log('styles in store', state.styles);
    },
    setCQLfilter(state, filters) {
      // check if filters.datasetName is present in cqlFilters
      const index = state.cqlFilters.findIndex(filter => filter.datasetName === filters.datasetName);
      // if present replace the filter if not push the filter
      if (index !== -1) {
        state.cqlFilters[index] = filters;
      } else {
        state.cqlFilters.push(filters);
      }
      //('cqlFilters in store', state.cqlFilters);
    },
    setMarkedCoordinate(state, coordinate) {
      state.markedCoordinate = coordinate;
      //console.log('marked coordinate in store', state.markedCoordinate);
    },
    openSecondDrawer(state) {
      state.secondDrawer = true;
    },
    // set map datasets first
    setMapDatasets(state, datasets) {
      state.mapDatasets = datasets;
    },
    // then set the features
    setFeatures(state, features) {
      const modifiedFeatures = features.map(feature => {
        // Remove unwanted characters from feature.id
        const refactoredId = feature.id.split('.')[0];
    
        // Find the corresponding dataset
        const correspondingDataset = state.mapDatasets.find(dataset => dataset.dataset.name === refactoredId);
    
        // If a corresponding dataset is found, append the corresponding dataset's attribute_Set to the feature's properties
        if (correspondingDataset) {
          feature.properties.attribute_set = correspondingDataset.dataset.attribute_set.map(attribute => {
            return {
              ...attribute,
              value: feature.properties[attribute.attribute]
            };
          });
    
          let template = correspondingDataset.dataset.featureinfo_custom_template;

          // Create an object with Key-Value structure where key is the placeholder (${properties.property} in feature.properties), value is the corresponding value for each property
          let replacements = {};
          for (let property in feature.properties) {
            replacements[`\\$\\{properties.${property}\\}`] = feature.properties[property];
          }

          // Iterate in the object to find keys in template and replace with corresponding values
          for (let placeholder in replacements) {
            template = template.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
          }

          // Add class="wrap-text" to every <pre> tag
          template = template.replace(/<pre>/g, '<pre style="white-space: pre-wrap; font-family: sans-serif">');

          // Remove all "null" text
          template = template.replace(/- null/g, '');

          // Set feature.featureinfo_custom_template with transformed template
          feature.featureinfo_custom_template = template;
        }
        feature.title = correspondingDataset.dataset.title;
    
        return feature;
      });
    
      // Push the modified features to the state
      state.features.push(...modifiedFeatures);
      //console.log('features in store', state.features);
    },
    resetFeatures(state) {
      state.features = [];
    },
    closeSecondDrawer(state) {
      state.secondDrawer = false;
    },
    SET_MAP_LOCATION(state, location) {
      state.mapLocation = location;
      //console.log('map location in store', state.mapLocation);
    },
    setMapCenter(state, center) {
      // Reproject the center from EPSG:3857 to EPSG:4326
      //center = toLonLat(center);
      state.mapLocation.lng = center[0];
      state.mapLocation.lat = center[1];
    },
    setMapZoom(state, zoom) {
      state.mapLocation.zoom = zoom;
    },


    // Mutations to be deprecated
    clearSelectedMap(state) {
      state.selectedMap = null;
    },
    setMapLayers(state, mapLayers) {
      state.mapLayers = mapLayers;
    },
    
    
    
    joinCategoryToMapLayers(state) {
      // Iterate over mapDatasets and print each dataset's pk
      //state.mapDatasets.forEach(dataset => {
      //  console.log('typeof dataset.dataset.pk:', typeof dataset.dataset.pk);
      //  console.log('dataset.pk:', dataset.dataset.pk);
      //});

      // Iterate over mapLayers
      state.mapLayers.forEach(layer => {
        // Check if layer has dataset and pk
        if (layer.dataset.pk) {
          // Print pk
          //console.log('typeof layer.dataset.pk:', typeof layer.dataset.pk);
          //console.log('layer.dataset.pk:', layer.dataset.pk);

          // Find the corresponding dataset in mapDatasets
          const dataset = state.mapDatasets.find(dataset => Number(dataset.dataset.pk) === Number(layer.dataset.pk));
          //console.log('matching dataset', dataset);
  
          // If a corresponding dataset is found, add the dataset's category to the layer's dataset
          if (dataset) {
            layer.dataset = {
              ...layer.dataset,
              category: dataset.dataset.category,
            };
          }
        }
      });
  
      //console.log('Updated mapLayers:', state.mapLayers);
    },
    
    setTracedFeature(state, geometry) {
      if (state.tracedFeature) {
        state.tracedFeature = null
      } else {
        state.tracedFeature = geometry;
      }
      console.log('traced feature in store', state.tracedFeature);
    },
    resetTracedFeature(state) {
      state.tracedFeature = null;
      console.log('traced feature reset', state.tracedFeature);
    },
    setSearchFeatures(state, features) {
      state.searchFeatures = features;
    },
    setFilterFeatures(state, features) {
      state.filterFeatures = features;
    },
    
    // other mutations...
  },
  actions: {
    async getMaps ({ state, commit }) {
      const url = `${state.nodeServerUrl}${state.nodeServerApi}${state.mapsEndpoint}`
      console.log(`Fetching maps from ${url}`)
      try {
        const response = await axios.get(url)
        const data = response.data;
        const length = data.total;
        console.log(`${length} maps fetched`);
        //console.log(data.maps);
        commit('setFeaturedMap', response.data)
        commit('setMaps', response.data)
      } catch (error) {
        console.error('Failed to fetch maps from GeoNode:', error);
      }
    },
    async getCategories ({ state, commit }) {
      const url = `${state.nodeServerUrl}${state.nodeServerApi}${state.categoriesEndpoint}`
      //console.log(`Fetching categories from ${url}`)
      let page = 1;
      let allCategories = [];
      let total = 0;
      try {
        do {
          const response = await axios.get(`${url}`, {
            params: { page }
          });
    
          if (page === 1) {
            total = response.data.total;
          }
    
          allCategories = allCategories.concat(response.data.categories);
          page++;
        } while (allCategories.length < total);
        //console.log(`${allCategories.length} categories fetched`);
        commit('setCategories', allCategories);
      } catch (error) {
        console.error('Failed to fetch categories from GeoNode:', error);
      }
    },
    async getDatasets ({ state, commit }) {
      const url = `${state.nodeServerUrl}${state.nodeServerApi}${state.datasetsEndpoint}`
      //console.log(`Fetching datasets from ${url}`)
      let page = 1;
      let allDatasets = [];
      let total = 0;
      try {
        do {
          const response = await axios.get(`${url}`, {
            params: { page }
          });
    
          if (page === 1) {
            total = response.data.total;
          }
    
          allDatasets = allDatasets.concat(response.data.datasets);
          page++;
        } while (allDatasets.length < total);
        //console.log(`${allDatasets.length} datasets fetched`);
        commit('setDatasets', allDatasets)
      } catch (error) {
        console.error('Failed to fetch datasets from GeoNode:', error);
      }
    },
    fetchStyle({ state, commit }, layerName) {
      const wmsURL = `${state.nodeServerUrl}${state.geoServerUrl}/ows`;
      const getStyleRequest = `${wmsURL}?request=GetStyles&layers=${layerName}&service=wms&version=1.1.1`;
      //console.log('getStyleRequest', getStyleRequest);
      axios.get(getStyleRequest).then(response => {
        //console.log('style response', response.data);
        commit('setStyles', response.data);
      });
    },
    async fetchMapDatasets({ commit, state }) {
      const datasets = [];
      for (const layer of state.mapLayers) {
        const url = process.env.VUE_APP_NODE_URL;
        const api = process.env.VUE_APP_NODE_API_ENDPOINT;
        const response = await axios.get(`${url}${api}datasets/${layer.dataset.pk}`);
        datasets.push(response.data);
      }
      commit('setMapDatasets', datasets);
      //console.log('map datasets in store', state.mapDatasets);
    },
    fetchFeatures({ state, commit }) {
      commit('resetFeatures'); // reset features to an empty array
      // dispatch fetchMapDatasets to get the datasets for the corresponding mapLayers
      this.dispatch('fetchMapDatasets');
  
      const coordinate = state.markedCoordinate;
      const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
  
      // Loop over the mapLayers array
      for (const layer of state.mapLayers) {
        // if layer visibility is true
        if (layer.visibility) {
          const layerName = layer.name;
          //console.log('layerName', layerName);
          // Construct the GetFeature request
          const getFeatureRequest = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&srsName=epsg:3857&cql_filter=INTERSECTS(geometry, POINT(${coordinate[0]} ${coordinate[1]}))`;
          axios.get(getFeatureRequest).then(response => {
            //console.log(response.data);
            commit('setFeatures', response.data.features);
          });
        }
      }
    },
    async fetchSearchFeatures({commit}) {
      try {
        const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
        const response = await axios.get(wfsUrl, {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'geonode:sectores_barrios_urb',
            outputFormat: 'application/json',
            srsName: 'EPSG:4326',
            // Add any other parameters you need...
          },
        });
    
        const featuresWithCentroids = response.data.features.map(feature => {
          const centroid = turf.centroid(feature);
          return { ...feature, geometry: centroid.geometry };
        });
    
        commit('setSearchFeatures', featuresWithCentroids);
        //console.log('search features in store', featuresWithCentroids);
      } catch (error) {
        console.error('Failed to fetch features:', error);
      }
    },
    traceFeature({ commit }, geometry) {
      commit('setTracedFeature', geometry);
      //console.log('feature to be traced', geometry);
    },
    updateMapLocation({ commit }, location) {
      commit('SET_MAP_LOCATION', location);
  },



    // Actions to be deprecated
    async fetchMaps({ commit }) {
      const url = process.env.VUE_APP_NODE_URL;
      const api = process.env.VUE_APP_NODE_API_ENDPOINT;
      const response = await axios.get(`${url}${api}maps/`);
      commit('setMaps', response.data.maps);
      // Return the maps
      return response.data.maps;
    },
    
    
    async fetchFilterFeatures({commit}) {
      try {
        const wfsUrl = `${process.env.VUE_APP_NODE_URL}${process.env.VUE_APP_WFS_SERVER_URL}`;
        const response = await axios.get(wfsUrl, {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'maracaibo:zonifica_ordenanza',
            outputFormat: 'application/json',
            srsName: 'EPSG:3857',
            // Add any other parameters you need...
          },
        });
    
        commit('setFilterFeatures', response.data.features);
        //console.log('filter features in store', response.data.features);
      } catch (error) {
        console.error('Failed to fetch features:', error);
      }
    },
    
    
    markCoordinate({ commit }, coordinate) {
      commit('setMarkedCoordinate', coordinate);
      commit('resetTracedFeature');
    },
    
    // other actions...
  },
  modules: {
  }
})
