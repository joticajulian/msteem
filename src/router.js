import Vue from 'vue'
import Router from 'vue-router'
import Multisignature from './components/Multisignature.vue'
import SignTrx from './components/SignTrx.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'multisignature',
      component: Multisignature
    },
    {
      path: '/sign',
      name: 'signtrx',
      component: SignTrx
    }
  ]
})
