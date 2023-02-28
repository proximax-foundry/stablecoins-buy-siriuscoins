import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { ServiceRoutes } from '@/modules/services/routingService';

const routes: RouteRecordRaw[] = [
  ...ServiceRoutes
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
})

export default router
