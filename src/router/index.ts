import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'
import Login from '@/views/Login.vue'
import UserList from '@/views/user/index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/register', component: () => import('@/views/Register.vue') },
    { path: '/login', component: Login },
    {
      path: '/',
      component: Layout,
      children: [
        { path: 'user', component: UserList, meta: { title: '员工管理' } }
      ]
    }
  ]
})

export default router