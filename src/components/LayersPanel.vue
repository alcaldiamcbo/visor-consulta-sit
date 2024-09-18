<template>
	<v-card variant="tonal" class="mx-auto d-flex flex-column" color="primary" style="height: 100%;" max-width="350">
		<v-tabs
			v-model="tab"
			bg-color="primary"
			align-tabs="center"
		>
			<!--v-tab value="zone">Zonificación</v-tab-->
			<v-tab value="place">Lugar</v-tab>
			<v-tab value="coordinate">Coordenada</v-tab>
		</v-tabs>
		<v-card-item>

			<v-window v-model="tab">
				<!--v-window-item value="zone">
					<v-form>
						<v-row class="d-flex align-center justify-space-between">
							<v-col cols="10">
								<v-autocomplete
									v-model="selectedZone"
									:items="zoneNames"
									label="Buscar Zona"
									item-title="name"
									item-value="value"
								></v-autocomplete>
							</v-col>
							<v-col cols="2">
								<v-btn id="search-zone" size="x-small" icon="mdi-filter" color="accent" @click="filterZoneAndEmit"></v-btn>
							</v-col>
						</v-row>
					</v-form>
				</v-window-item-->
				<v-window-item value="place">
					<v-form>
						<v-row class="d-flex align-center justify-space-between">
							<v-col cols="10">
								<!--v-text-field label="Lugar" prepend-icon="mdi-map-marker"></v-text-field-->
								<v-autocomplete
									v-model="selectedPlace"
									:items="placeNames"
									label="Buscar lugar"
									item-text="nombre"
									item-value="nombre"
								></v-autocomplete>
							</v-col>
							<v-col cols="2">
								<v-btn id="search-place" size="x-small" icon color="accent" @click="filterAndEmit" variant="flat">
									<v-icon :class="['mdi', 'mdi-map-search']"></v-icon>
								</v-btn>
							</v-col>
						</v-row>
					</v-form>
					<div class="text-caption">
						{{ labels[0] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation2202.lat.toFixed(2)) : parseFloat(mapLocation.lat.toFixed(2)) }} |
						{{ labels[1] }}: {{ currentCRS === 'EPSG:2202' ? parseFloat(reprojectedLocation2202.lng.toFixed(2)) : parseFloat(mapLocation.lng.toFixed(2)) }} |
						Zoom: {{ mapLocation.zoom.toFixed(2) }} 
						<template v-if="mapLocation.bearing">| Bearing: {{ mapLocation.bearing.toFixed(2) }} | </template>
						<template v-if="mapLocation.pitch"> Pitch: {{ mapLocation.pitch.toFixed(2) }} | </template>
					</div>
				</v-window-item>
				<v-window-item value="coordinate">
					<v-row class="d-flex align-center justify-space-between">
						<v-col cols="5">
							<v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
								<v-text-field
								v-model="reprojectedMapLocation.lat"
								:label="labels[0]"
								:rules="rules"
								></v-text-field>
							</v-form>
							<v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
								<v-text-field
								v-model="location.lat"
								:label="labels[0]"
								:rules="rules"
								></v-text-field>
							</v-form>
						</v-col>
						<v-col cols="5">
							<v-form v-if="currentCRS === 'EPSG:2202'" @submit.prevent="reprojectAndEmit">
								<v-text-field
								v-model="reprojectedMapLocation.lng"
								:label="labels[1]"
								:rules="rules"
								></v-text-field>
							</v-form>
							<v-form v-if="currentCRS === 'EPSG:4326'" @submit.prevent="reprojectAndEmit">
								<v-text-field
								v-model="location.lng"
								:label="labels[1]"
								:rules="rules"
								></v-text-field>
							</v-form>
						</v-col>
						<v-col cols="2">
								<v-btn id="search-coordinate" size="x-small" icon color="accent" @click="reprojectAndEmit" variant="flat">
									<v-icon :class="['mdi', 'mdi-crosshairs-question']"></v-icon>
								</v-btn>
						</v-col>
					</v-row>
				</v-window-item>
			</v-window>
		</v-card-item>
		<v-divider></v-divider>
		<v-card-text class="overflow-y-auto">
			<!--layers component-->
			<LayersComponent />
		</v-card-text>
		<v-divider></v-divider>
		<!--SRC selector-->
		<v-card-actions class="mt-auto">
			<v-row class="d-flex align-center justify-space-between">
				<v-col cols="10">
					<v-select
						v-model="currentCRS"
						:items="items"
						:item-props="itemProps"
						label="Seleccione Sistema de Referencia"
					></v-select>
				</v-col>
				<v-col cols="2">
					<v-btn size="x-small" icon @click="resetMapLocation" color="accent" variant="flat">
						<v-icon :class="['mdi', 'mdi-home']"></v-icon>
					</v-btn>
				</v-col>
			</v-row>
		</v-card-actions>
	</v-card>
</template>

<script>
import LayersComponent from "@/components/LayersComponent.vue";
import proj4 from 'proj4';
import { mapState } from 'vuex';

// Define the source and destination projections
const sourceProjection4326 = 'EPSG:4326';
const destinationProjection2202 = 'EPSG:2202';

// Define the custom EPSG:2202 projection
proj4.defs(destinationProjection2202, "+proj=utm +zone=19 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Create proj4 converters
const converter4326to2202 = proj4(sourceProjection4326, destinationProjection2202);

export default {
	name: 'LayersPanel',
	components: {
		LayersComponent,
	},
	data() {
		return {
			currentCRS: 'EPSG:2202',
			items: [
				{ text: 'WGS84', value: 'EPSG:4326' },
				{ text: 'REGVEN', value: 'EPSG:2202' },
			],
			session: {
				name: 'Sistema de Información Territorial - SIT',
				site: 'Visor de Mapas | Consulta Ciudadana',
				details: 'Alcaldía de Maracaibo - Centro de Procesamiento Urbano (CPU)',
				logoPath: require('@/assets/alcaldia-de-maracaibo-logo-web.png'),
				// map name fetched from GeoNode API
				map: 'Ordenanza de Zonificación Urbana',
			},
			reprojectedMapLocation: {
				lng: 205383.1024574745,
				lat: 1181614.2195356246,
			},
			location: {
				lng: -71.6930587033,
				lat: 10.6775887114,
				bearing: 0,
				pitch: 0,
				zoom: 11.6,
			},
			rules: [
				value => {
					if (value) return true
					return 'Coordenada requerida'
				},
			],
			tab: null,
			imageDimensions: {},
			selectedPlace: null,
			selectedZone: null,
		};
	},
	computed: {
		...mapState(['mapLayers', 'selectedMap', 'searchFeatures', 'filterFeatures', 'mapDatasets', 'mapLocation']),
		reprojectedLocation2202() {
			if (this.mapLocation && this.mapLocation.lng && this.mapLocation.lat) {
				const [lng2202, lat2202] = converter4326to2202.forward([this.mapLocation.lng, this.mapLocation.lat]);
				return { lng: lng2202, lat: lat2202 };
			}
			return null;
		},
		placeNames() {
			return this.searchFeatures.map(feature => {
			if (typeof feature.properties.comunidad !== 'string') {
				console.warn('Invalid comunidad property:', feature.properties.comunidad);
			}
			//console.log(feature.properties.comunidad);
			return feature.properties.comunidad;
			});
		},
		zoneNames() {
			const zones = [];

			if (this.filterFeatures && this.filterFeatures.length > 0) {
				const uniqueZones = this.filterFeatures
					.map(feature => {
						if (feature.properties.nombre_zona && feature.properties.zona) {
							return {
								name: `${feature.properties.nombre_zona} - ${feature.properties.zona}`,
								value: feature.properties.nombre_zona
							};
						}
						return null;
					}) // map to object with name and value properties
					.filter((value, index, self) => value && self.findIndex(v => v.name === value.name && v.value === value.value) === index); // filter out nulls and duplicates

				uniqueZones.forEach(zone => {
					zones.push(zone);
				});
			}
			return zones;
		},
		labels() {
			if (this.currentCRS === 'EPSG:2202') {
				return ['Norte', 'Este'];
			} else if (this.currentCRS === 'EPSG:4326') {
				return ['Latitude', 'Longitude'];
			}
			return [];
		},
	},
	methods: {
			itemProps(item) {
					return {
							title: item.text,
							subtitle: item.value,
					};
			},
			resetMapLocation() {
					this.$store.dispatch('updateMapLocation', { lng: -71.6930587033, lat: 10.6775887114, zoom: 11.6, pitch: 0, bearing: 0 });
			},
			switchCRS(crs) {
					this.currentCRS = crs;
					let convertedLocation;
					if (this.currentCRS === 'EPSG:2202') {
							const [lng2202, lat2202] = converter4326to2202.forward([this.location.lng, this.location.lat]);
							convertedLocation = { lng: lng2202, lat: lat2202 };
					} else if (this.currentCRS === 'EPSG:4326') {
							const [lng4326, lat4326] = location.forward([this.location.lng, this.location.lat]);
							convertedLocation = { lng: lng4326, lat: lat4326 };
					}
					this.location.lng = convertedLocation.lng;
					this.location.lat = convertedLocation.lat;
			},
			openDetails(detailUrl) {
					window.open(`${detailUrl}/metadata_detail`, '_blank');
			},
			reprojectAndEmit() {
					if (this.currentCRS === 'EPSG:2202') {
							const searchCoordinate = [parseFloat(this.reprojectedMapLocation.lng), parseFloat(this.reprojectedMapLocation.lat)];
							this.$store.commit('setMarkedCoordinate', searchCoordinate);
					} else {
							// reproject to 2202
							const [lng2202, lat2202] = converter4326to2202.forward([this.mapLocation.lng, this.mapLocation.lat]);
							const searchCoordinate = [lng2202, lat2202];
							this.$store.commit('setMarkedCoordinate', searchCoordinate);
					}
			},
			getLegendWidth(url) {
					if (this.imageDimensions[url]) {
					return this.imageDimensions[url].width > this.imageDimensions[url].height ? '50%' : '80%';
					} else {
					let img = new Image();
					img.onload = () => {
							this.imageDimensions[url] = { width: img.width, height: img.height };
					};
					img.src = url;
					}
			},
			filterAndEmit() {
					const filteredFeatures = this.searchFeatures.filter(feature => feature.properties.comunidad === this.selectedPlace);
					filteredFeatures.forEach(feature => {
							const [lng2202, lat2202] = converter4326to2202.forward([feature.geometry.coordinates[0], feature.geometry.coordinates[1]]);
							const featureCoordinate = [lng2202, lat2202];
							this.$store.commit('setMarkedCoordinate', featureCoordinate);
					});
			},
			filterZoneAndEmit() {
					const filteredFeatures = this.filterFeatures.filter(feature => feature.properties.nombre_zona === this.selectedZone);
					//console.log(filteredFeatures);

					if (filteredFeatures && filteredFeatures.length > 0) {
							const mergedGeometry = {
									type: "GeometryCollection",
									geometries: filteredFeatures.map(feature => feature.geometry)
							};

							this.$store.dispatch('traceFeature', mergedGeometry);
					}
			},
    },
}
</script>

<style scoped>
.layers-panel {
    z-index: 1;
}

.v-card {
  height: 100%;
}
</style>