import DefaultTheme from 'vitepress/theme'
import './custom.css'
import './visualizations/visualizations.css'
import CoordinateFigures from './visualizations/CoordinateFigures.vue'
import MarkovSteps from './visualizations/MarkovSteps.vue'
import CovarianceStatic from './visualizations/CovarianceStatic.vue'
import CovarianceExplorer from './visualizations/CovarianceExplorer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CoordinateFigures', CoordinateFigures)
    app.component('MarkovSteps', MarkovSteps)
    app.component('CovarianceStatic', CovarianceStatic)
    app.component('CovarianceExplorer', CovarianceExplorer)
  }
}
