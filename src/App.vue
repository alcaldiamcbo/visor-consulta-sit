<template>
  <v-app>
    <v-app-bar class="bg-secondary" :elevation="0" density="compact">
      <v-img :src="logo" max-height="35" max-width="150" class="mr-0"></v-img>
      <v-app-bar-title>{{ title }}<strong>{{ subtitle }}</strong></v-app-bar-title>

      <template v-slot:append>
        <v-btn icon>
          <v-icon :class="['mdi', 'mdi-dots-vertical']"></v-icon>
        </v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0 bg-blue-grey-lighten-5">
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      logo: require('@/assets/alcaldia-de-maracaibo-logo-web.png'), // Add your logo here
      title: 'Visor Geográfico',
      subtitle: ' | Alcaldía de Maracaibo'  // Change the title of the app
    };
  },
};
</script>

<style scoped>
html, body, #app {
  height: 100%;
  margin: 0;
}

.fill-height {
  height: 100%;
}
</style>
