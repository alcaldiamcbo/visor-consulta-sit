<template>
	<div id="catalog" class="inner-catalog-container"  v-if="!loading">
		<v-row justify="center">
			<v-col cols="12" md="4">
				<v-card class="mx-auto card-fixed-actions rounded-xl pa-5 custom-height" width="500" :subtitle="featuredMap.raw_abstract">
					<template v-slot:prepend>
						<v-icon :class="['mdi', 'mdi-earth']"></v-icon>
					</template>
					<template v-slot:title>
						<span class="text-overline mb-1 wrap-text">Mapa | {{ featuredMap.title }}</span>
					</template>
					<v-img height="200px" :src="featuredMap.thumbnail_url" cover></v-img>
					<v-card-text class="text-caption">
						{{ featuredMap.raw_purpose }}
					</v-card-text>
					<v-divider></v-divider>
					<v-card-actions>
						<v-btn to="/map" @click="handleMap(featuredMap)" color="accent">Ver más</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
		<!--v-row justify="center">
			<v-col cols="12" md="2" v-for="map in allMaps" :key="map.pk" class="d-flex justify-center">
				<v-card class="mx-auto card-fixed-actions" width="250" variant="tonal" color="blue-grey">
					<v-img height="100px" :src="map.thumbnail_url" cover></v-img>
					<v-card-title class="text-overline mb-1 wrap-text">Mapa | {{ map.title }}</v-card-title>
					<v-card-text class="text-caption">
						{{ map.raw_abstract }}
					</v-card-text>
					<v-divider></v-divider>
					<v-card-actions>
						<v-btn to="/map" @click="handleMap(map)" color="accent">Ver más</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row-->
	</div>
	<div v-else class="inner-catalog-container">
		<v-row justify="center">
			<v-col cols="12" class="d-flex justify-center">
				<v-progress-circular indeterminate :size="70" color="primary"></v-progress-circular>
			</v-col>
		</v-row>
	</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
	name: 'CatalogComponent',
	data: () => ({
		// Component data
		loading: true,
	}),
	computed: {
		...mapState(['allMaps', 'featuredMap'])
	},
	created() {
		this.$store.dispatch('getMaps').then(() => {
			//console.log('Maps data fetched before CatalogComponent is created');
			this.loading = false;
		});
	},
	methods: {
		handleMap(map) {
			this.$store.commit('setSelectedMap', map);
		}
	}
};
</script>

<style scoped>
.inner-catalog-container {
	position: relative;
	width: 100%;
}

.card-fixed-actions {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.card-fixed-actions .v-card-text {
	flex-grow: 1;
}

.card-fixed-actions .v-card-actions {
	margin-top: auto;
}

.wrap-text {
	white-space: normal;
}

.custom-height {
  height: 450px; /* Adjust the height as needed */
}
</style>