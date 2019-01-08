import Vue from 'vue'
import Router from 'vue-router'
import ModifyAuth from './components/ModifyAuth.vue'
import SignTrx from './components/SignTrx.vue'
import GenKey from './components/GenKey.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'modifyauth',
      component: ModifyAuth
    },
    {
      path: '/sign',
      name: 'signtrx',
      component: SignTrx
    },
    {
      path: '/genkey',
      name: 'genkey',
      component: GenKey
    }
  ]
})
