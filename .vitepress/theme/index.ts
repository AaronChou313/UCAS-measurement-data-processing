import KalmanSteps from './visualizations/KalmanSteps.vue'
import ScienceFigure from './visualizations/ScienceFigure.vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import './visualizations/visualizations.css'
import CoordinateFigures from './visualizations/CoordinateFigures.vue'
import MarkovSteps from './visualizations/MarkovSteps.vue'
import MarkovSources from './visualizations/MarkovSources.vue'
import MarkovPeriod from './visualizations/MarkovPeriod.vue'
import CovarianceStatic from './visualizations/CovarianceStatic.vue'
import CovarianceExplorer from './visualizations/CovarianceExplorer.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CoordinateFigures', CoordinateFigures)
    app.component('MarkovSteps', MarkovSteps)
    app.component('KalmanSteps', KalmanSteps)
    app.component('ScienceFigure', ScienceFigure)
    app.component('MarkovSources', MarkovSources)
    app.component('MarkovPeriod', MarkovPeriod)
    app.component('CovarianceStatic', CovarianceStatic)
    app.component('CovarianceExplorer', CovarianceExplorer)
  }
}
