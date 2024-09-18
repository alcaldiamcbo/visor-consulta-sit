<template>
  <!--v-card class="mx-auto overflow-y-auto" color="primary" variant="tonal" title="Capas" max-width="350">
    <template v-slot:prepend>
      <v-icon :class="['mdi', 'mdi-earth']"></v-icon>
    </template>
  </v-card-->
  <v-expansion-panels flat variant="popout" rounded="xl">
    <v-expansion-panel v-for="category in categories" :key="category.identifier">
      <v-expansion-panel-title class="text-overline blue-grey-text">
        {{ category.gn_description }}
        <template v-slot:actions>
          <v-icon :class="['fa', category.fa_class]"></v-icon>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text class="overflow-y-auto text-caption blue-grey-text">
        {{ category.description }}
          <v-expansion-panels flat variant="default" rounded="lg">
            <v-expansion-panel v-for="dataset in filteredDatasets(category.identifier)" :key="dataset.pk" class="bg-grey-lighten-5">
              <v-expansion-panel-title v-if="!getLayerForDataset(dataset.pk)" class="text-caption blue-grey-text">
                {{ dataset.title }}
                <template v-slot:actions>
                  <v-btn
                    color="teal-lighten-3"
                    variant="tonal"
                    size="x-small"
                    icon
                    @click="handleAddDataset(dataset)"
                    @click.stop="performAction(dataset)"
                  >
                    <v-tooltip activator="parent" location="top">Añadir capa</v-tooltip>
                    <v-icon :class="['mdi', 'mdi-plus']"></v-icon>
                  </v-btn>
                </template>
              </v-expansion-panel-title>
              <v-expansion-panel-title v-else class="text-caption blue-grey-darken-text">
                {{ dataset.title }}
                <template v-slot:actions>
                  <v-btn
                    color="deep-orange-lighten-2"
                    variant="tonal"
                    size="x-small"
                    icon
                    @click="handleRemoveDataset(dataset)"
                    @click.stop="performAction(dataset)"
                  >
                    <v-tooltip activator="parent" location="top">Remover capa</v-tooltip>
                    <v-icon :class="['mdi', 'mdi-minus']"></v-icon>
                  </v-btn>
                </template>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="blue-grey-text">
                <v-row class="d-flex align-center justify-space-between">
                  <v-col cols="9">
                    <div class="text-caption">{{ dataset.raw_abstract }}</div>
                  </v-col>
                  <v-col cols="3">
                    <v-btn v-if="getLayerForDataset(dataset.pk)" variant="tonal" size="x-small" icon @click="show = !show">
                      <v-tooltip activator="parent" location="top">Ver/ocultar leyenda</v-tooltip>
                      <v-icon :class="show? ['mdi', 'mdi-chevron-up'] : ['mdi', 'mdi-chevron-down']"></v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-card-actions v-if="getLayerForDataset(dataset.pk)">
                  <v-slider
                    color="blue-grey"
                    min="0"
                    max="1"
                    v-model="getLayerForDataset(dataset.pk).opacity"
                    hide-details
                  ></v-slider>
                  <v-switch
                    color="blue-grey"
                    v-model="getLayerForDataset(dataset.pk).visibility"
                    hide-details
                  ></v-switch>
                </v-card-actions>
                <v-expand-transition>
                  <div v-show="show">
                    <v-divider></v-divider>
                    <div class="legend" v-for="style in styles[dataset.alternate]" :key="style.name">
                      <div v-if="style.type === 'Polygon'" class="polygon legend-item" :style="{ backgroundColor: style.fill.color, width: '10px', height: '20px', marginRight: '5px' }"></div>
                      <div v-if="style.type === 'Line'" class="line legend-item" :style="{ border: '2px solid ' + style.stroke.color, width: '10px', height: '2px', marginRight: '5px' }"></div>
                      <div v-if="style.type === 'Point'" class="point legend-item" :style="{ borderRadius: '5px', backgroundColor: style.mark.fill.color, width: '10px', height: '10px', borderRadius: '50%', marginRight: '5px' }"></div>
                      <div class="legend-item">{{ style.name }}</div>
                      <v-spacer></v-spacer>
                      <input v-if="style.checkbox" class="legend-item" type="checkbox" v-model="style.visibility" :checked="style.visibility" @change="event => processCqlFilter(event, dataset.alternate, style.name)">
                    </div>
                  </div>
                </v-expand-transition>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex';

export default {
  name: 'LayersComponent',
  data: () => ({
    // Component data
    loading: true,
    show: false,
  }),
  computed: {
    ...mapState(['categories', 'datasets', 'mapLayers', 'styles']),
    filteredDatasets() {
      return (categoryId) => {
        return this.datasets.filter(dataset => dataset.category && dataset.category.identifier === categoryId);
      };
    }
  },
  methods: {
    ...mapActions(['fetchStyle']),
    ...mapMutations(['addLayer', 'removeLayer', 'setCQLfilter']),
    getLayerForDataset(datasetPk) {
      return this.mapLayers.find(layer => layer.dataset.pk == datasetPk);
    },
    processCqlFilter(event, datasetName, styleName) {
      // Process the CQL filter 
      const newValue = event.target.checked;
      console.log(`Visibility changed to ${styleName} in ${datasetName} to: ${newValue}`);
      const style = this.styles[datasetName];
      //console.log(style);
      // get the style objects that has visibility property set to true
      const visibleStyles = Object.values(style).filter(item => item.visibility);
      //console.log(visibleStyles);
      // get the filter property of the visible styles
      const filters = visibleStyles.map(item => item.filter);
      //console.log(filters);
      // return list of unique propertyName from the filters object
      const propertyNames = [...new Set(filters.map(filter => filter.propertyName))];
      const propertyValues = filters.map(filter => filter.literal);
      // transform propertyNames and propertyValues to CQL string
      const formattedValues = propertyValues.map(value => `'${value}'`).join(',');
      const cqlString = `${propertyNames.toString()} IN (${formattedValues})`;
      // create object with datasetName as key and a query property with cqlString as value
      const cqlFilter = { datasetName, query: cqlString };
      // commit the cqlFilter object to the store using setCQLfilter imported mutation
      this.setCQLfilter(cqlFilter);
    },
    handleAddDataset(dataset) {
      // Logic to handle adding the dataset
      console.log(`Adding dataset: ${dataset.title}`);
      // commit the layer object to the store using addLayer imported mutation
      this.addLayer({ dataset });
    },
    handleRemoveDataset(dataset) {
      // Logic to handle removing the dataset
      console.log(`Removing dataset: ${dataset.title}`);
      this.removeLayer({ dataset });
    },
    performAction(index) {
      // Perform the action when the button is clicked
      console.log(`Action button clicked for panel ${index}`);
    }
  },
}
</script>

<style scoped>
.legend{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
}

.legend-item {
  margin: 5px;
}

.blue-grey-text {
  color: #607D8B; /* blue-gray color */
}

.blue-grey-darken-text {
  color: #263238; /* blue-gray color */
}
</style>