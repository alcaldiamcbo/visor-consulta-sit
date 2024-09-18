<template>
	<!-- Sidebar -->
	<v-navigation-drawer floating permanent width="350">
		<LayersPanel />
	</v-navigation-drawer>
	<!-- Map container -->
	<div class="map-container">
		<MapComponent />
	</div>
	<v-navigation-drawer v-model="$store.state.secondDrawer" location="right" width="350">
		<v-card class="d-flex flex-column fill-height mx-auto" variant="tonal" color="primary" max-width="350">
			<v-card-actions>
				<v-btn size="x-small" icon @click="handleClose">
                    <v-icon :class="['mdi', 'mdi-close']"></v-icon>
                </v-btn>
                <div class="text-overline mb-1">
                    Norte: {{ markedCoordinate && markedCoordinate[1] ? parseFloat(markedCoordinate[1].toFixed(2)) : 'N/A' }} - Este: {{ markedCoordinate && markedCoordinate[0] ? parseFloat(markedCoordinate[0].toFixed(2)) : 'N/A' }}
                </div>
			</v-card-actions>
			<v-divider></v-divider>
			<v-card-item>
				<ResultsPanel />
			</v-card-item>
		</v-card>
	</v-navigation-drawer>
</template>

<script>
import MapComponent from "@/components/MapComponent.vue";
import LayersPanel from "@/components/LayersPanel.vue";
import ResultsPanel from "@/components/ResultsPanel.vue"
import { mapState, mapMutations} from 'vuex';

export default {
    name: "MapView",
    components: {
        MapComponent,
        LayersPanel,
        ResultsPanel,
    },
    data() {
        return {
            session: {
                name: 'Sistema de Información Territorial - SIT',
                site: 'Visor de Mapas | Consulta Ciudadana',
                details: 'Alcaldía de Maracaibo - Centro de Procesamiento Urbano (CPU)',
                logoPath: require('@/assets/alcaldia-de-maracaibo-logo-web.png'),
                // map name fetched from GeoNode API
                map: 'Ordenanza de Zonificación Urbana',

            },
        };
    },
    computed: {
        ...mapState(['markedCoordinate']),
    },
    methods: {
        ...mapMutations(['closeSecondDrawer', 'resetTracedFeature']),
        handleClose() {
            this.closeSecondDrawer();
            this.resetTracedFeature();
        },
    },
};
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

#sidebar {
    position: absolute;
    top: 60px;
    left: 10px;
    z-index: 1; /* This will make sure the sidebar is above the map container */
}
</style>