<template>
	<!-- content of the panel... -->
	<v-expansion-panels v-model="activePanel" v-if="specialFeature" flat variant="popout" rounded="xl">
		<v-expansion-panel v-for="(feature, index) in specialFeature" :key="index">
			<v-expansion-panel-title class="text-overline blue-grey-text">
				{{ feature.title }} | 
				<template v-slot:actions>
					<v-btn
						color="teal-lighten-3"
						variant="tonal"
						size="x-small"
						icon
						@click="handleClick(feature.geometry)"
						@click.stop="performAction(feature)"
					>
						<v-tooltip activator="parent" location="top">Ver resultado en el mapa</v-tooltip>
						<v-icon :class="['mdi', 'mdi-layers-plus']"></v-icon>
					</v-btn>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text class="overflow-y-auto text-caption blue-grey-text" >
				<div class="wrap-text" v-html="feature.featureinfo_custom_template"></div>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel v-for="(feature, index) in otherFeatures" :key="index" class="v-card">
			<v-expansion-panel-title class="text-overline blue-grey-text">
				{{ feature.title }} | {{ firstVisibleAttributes[index].value }}
				<template v-slot:actions>
					<v-btn
						color="teal-lighten-3"
						variant="tonal"
						size="x-small"
						icon
						@click="handleClick(feature.geometry)"
						@click.stop="performAction(feature)"
					>
						<v-tooltip activator="parent" location="top">Ver resultado en el mapa</v-tooltip>    
						<v-icon :class="['mdi', 'mdi-layers-plus']"></v-icon>
					</v-btn>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text class="overflow-y-auto">
				<v-table density="compact" class="text-caption blue-grey-text">
					<thead>
						<tr>
							<th class="text-left">
							Atributo
							</th>
							<th class="text-left">
							Valor
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="attribute in visibleAttributes[index]" :key="attribute.attribute">
							<td>{{ attribute.attribute_label }}</td>
							<td>{{ attribute.value }}</td>
						</tr>
					</tbody>
				</v-table>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<script>
import { mapState } from 'vuex';

export default {
	name: 'ResultsPanel',
	data() {
		return {
			// Add your data properties here
			activePanel: 0,
		};
	},
	methods: {
		// Add your methods here
		handleClick(geometry) {
			this.$store.dispatch('traceFeature', geometry);
		},
		performAction(index) {
			// Perform the action when the button is clicked
			console.log(`Action button clicked for panel ${index}`);
		}
	},
	computed: {
		...mapState(['features', 'tracedFeature']),
		specialFeature() {
			return this.features.filter(feature => feature.title === 'Ordenanza Zonificación de Maracaibo');
		},
		otherFeatures() {
			return this.features.filter(feature => feature.title !== 'Ordenanza Zonificación de Maracaibo');
		},
		visibleAttributes() {
			return this.otherFeatures.map(feature => {
				return feature.properties.attribute_set.filter(attribute_set => attribute_set.visible);
			});
		},
		firstVisibleAttributes() {
			return this.visibleAttributes.map(attributes => {
				return attributes.sort((a, b) => a.display_order - b.display_order)[0];
			});
		},
	},
};
</script>

<style scoped>
/* Add your component-specific styles here */
.overflow-y-auto {
  overflow-y: auto;
  max-height: 450px; /* Adjust this value as needed */
}

.blue-grey-text {
  color: #607D8B; /* blue-gray color */
}
</style>