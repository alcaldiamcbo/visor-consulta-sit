// Styles
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css' // Import Font Awesome CSS
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Vuetify
import { createVuetify } from 'vuetify'

export default createVuetify(
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
  {
    icons: {
      defaultSet: 'mdi',
      sets: {
        mdi: {
          component: 'mdi', // This is the component name you will use in your templates for MDI
          iconfont: 'mdi', // This is the icon set name for MDI
        },
        fa: {
          component: 'fa', // This is the component name you will use in your templates
          iconfont: 'fa', // This is the icon set name
        },
      },
    },
    theme: {
      options: { customProperties: true }, // This allows you to use the defined colors as CSS variables
      defaultTheme: 'maracaiboV2',
      themes: {
        maracaibo: {
          dark: false,
          colors: {
            primary: '#025939',
            secondary: '#F2F2F2',
            accent: '#04BF55',
            error: '#F2BD1D',
            'secondary-darken-1': '#404040',
          },
        },
        maracaiboV2: {
          dark: false,
          colors: {
            primary: '#cf3339',
            secondary: '#F2F2F2',
            accent: '#00205c',
            error: '#FF5F00',
            white: '#FFFFFF',
            'secondary-darken-1': '#404040',
          },
        }
      },
    },
    components,
    directives,
  }
)
