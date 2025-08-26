<template>
    <div class="catalog-container">
        <div class="welcome">
            <v-row>
                <v-col cols="12" md="6">
                    <v-card class="mx-auto" variant="flat">
                        <v-card-title class="text-h3 text-wrap">SIG Maracaibo</v-card-title>
                        <v-card-subtitle class="text-h5 mt-3">¡Bienvenido!</v-card-subtitle>
                        <v-card-text>
                            <p>El Centro de Procesamiento Urbano (CPU) habilitó un visor geográfico de consulta ciudadana que permitirá encontrar: información cartográfica, la zonificación del municipio Maracaibo, entre otros datos de interés para los ciudadanos.</p>
                            <v-divider></v-divider>
                            <p class="text-caption">Para ver el mapa, haz click en el botón <strong>Ver Mapa</strong> de la tarjeta a continuación.</p>
                            <!--p class="text-caption">Para ver los detalles de un mapa, haz click en el botón <v-icon color="error">mdi-information</v-icon>.</p-->
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <!-- <img :src="image" alt="App image" width="650"> -->
                </v-col>
            </v-row>
        </div>
        <div class="map-cards">
            <CatalogComponent />
        </div>
        <div class="features-container">
            <div class="features">
                <v-row>
                    <v-col cols="12" md="4"> 
                        <img :src="icon1" alt="Map icon">
                        <!-- <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p>  -->
                    </v-col>
                    <v-col cols="12" md="4">     
                        <img :src="icon2" alt="Map icon">
                        <!-- <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p>         -->
                    </v-col>
                    <v-col cols="12" md="4">   
                        <img :src="icon3" alt="Map icon">
                        <!-- <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, ipsa sequi? Voluptatem optio nam eligendi amet id
                        </p>           -->
                    </v-col>
                </v-row>
            </div>
        </div>
        <div class="details">
            <v-row>
                <v-col cols="12" md="6">
                    <v-card variant="flat">
                        <v-card-title class="text-h3">
                            Información <br> detallada
                        </v-card-title>
                        <v-card-text class="mt-5">
                            <p>
                                En esta sección podrás consultar el mapa de zonificación urbana del municipio, 
                                el cual ha sido preparado por el Centro de Procesamiento Urbano (CPU) para facilitar
                                el acceso a la información del uso del suelo a los ciudadanos.
                            </p>
                        </v-card-text>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card variant="outlined rounded-xl pa-5">
                        <img :src="mapView" alt="Map icon" class="w-100 rounded-xl">
                    </v-card>
                </v-col>
            </v-row>
        </div>
        <v-footer fixed class="pa-2 bg-accent on-primary app-footer">
            <v-container fluid>
                <v-row justify="center" no-gutters>
                <p>&copy; {{ new Date().getFullYear() }} | <strong><a href="https://www.geostudio.com.co/"> GeoStudio </a></strong> | Alcaldía Bolivariana de Maracaibo</p>
                </v-row>
            </v-container>
        </v-footer>
    </div>
</template>

<script>
import CatalogComponent from '@/components/CatalogComponent.vue';

export default {
    components: {
        CatalogComponent,
    },
    props: {
        // props...
    },
    // data, methods...
    data: () => ({
        image: require('@/assets/images/header-background-v2.jpg'),
        icon1:require('@/assets/images/map-icon.png'),
        icon2:require('@/assets/images/world-icon.png'),
        icon3:require('@/assets/images/location-pin-icon.png'),
        mapView:require('@/assets/images/map-view-v2.jpg')
    })
};
</script>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}
.v-card-title.text-wrap {
  white-space: normal;
  line-height: 1.5;
}
.v-card-subtitle{
    opacity: 1;
}

.catalog-container {
    height: calc(100vh - 64px);
    display: grid;
    grid-template-columns: 1fr 80% 1fr;
    /*grid-template-rows: 1fr repeat(5) 50px;*/
    grid-gap: 10px;
    background-image: url('@/assets/images/header-background-v2.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    min-height: 600px;
}

.welcome {
    grid-row-start: 1;
    grid-column-start: 2;
    grid-column-end: 3;
    margin-top: 5%;
   
}
.welcome .v-card{
    color: #fff;
    background-color: transparent;
}
.map-cards {
    grid-row-start: 2;
    grid-column-start: 2;
    grid-column-end: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin-bottom: 40px;
}
.features-container{
    display: grid;
    grid-template-columns: 1fr 80% 1fr;
    grid-row-start: 3;
    grid-column-start: 1;
    grid-column-end: 4;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    background-color: #f4f4f4;
    height: fit-content;
    padding: 50px 0;
}
.features{
    grid-row-start: 1;
    grid-column-start: 2;
    grid-column-end: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    height: fit-content;
}

.features div[class^="v-col-"]{
    text-align: center;
}
.details{
    grid-row-start: 4;
    grid-column-start: 2;
    grid-column-end: 3;
    padding: 50px 0;
}

.app-footer {
    grid-row-start: 5;
    grid-column-start: 1;
    grid-column-end: 4;
}
</style>