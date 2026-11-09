import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'
import { getActiveTrackingOrder, isTechnicianAccepted } from '@/services/activeTracking'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  Router.beforeEach((to) => {
    const activeOrderId = getActiveTrackingOrder()
    if (activeOrderId) {
      const hasAuthToken = Boolean(localStorage.getItem('auth_token'))
      if (!hasAuthToken && to.name === 'login') return true
      if (!hasAuthToken) {
        return {
          name: 'login',
          query: { redirect: to.fullPath },
          replace: true,
        }
      }

      const destination = isTechnicianAccepted(activeOrderId) ? 'tracking' : 'booking-waiting'
      if (to.name !== destination || String(to.params.orderId) !== activeOrderId) {
        return { name: destination, params: { orderId: activeOrderId }, replace: true }
      }
    } else if (to.name === 'tracking' && !isTechnicianAccepted(to.params.orderId)) {
      return {
        name: 'booking-waiting',
        params: { orderId: String(to.params.orderId) },
        replace: true,
      }
    }

    if (to.name === 'admin-dashboard') {
      const token = localStorage.getItem('auth_token')
      let userRole = ''
      try {
        userRole = String(JSON.parse(localStorage.getItem('user_info') || '{}').role || '').toLowerCase()
      } catch (error) {
        console.error('อ่านข้อมูลผู้ใช้สำหรับตรวจสอบสิทธิ์ Admin ไม่สำเร็จ:', error)
      }

      if (!token || userRole !== 'admin') {
        return { name: 'login', query: { redirect: to.fullPath }, replace: true }
      }
    }

    return true
  })

  return Router
})
