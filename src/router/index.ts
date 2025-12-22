import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/views/Layout.vue'  // 主布局
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import UserList from '@/views/user/index.vue'  // 员工管理页面
import Dept from '@/views/dept/index.vue'       // 部门管理页面（你已经做好了）
import Profile from '@/views/profile/index.vue' // 个人中心页面
import Permission from '@/views/permission/index.vue' // 个人中心页面

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/',
      component: Layout,
      redirect: '/user',  // 默认跳转到员工管理
      children: [
        {
          path: 'user',
          name: 'User',
          component: UserList,
          meta: { title: '员工管理' }
        },
        {
          path: 'dept',
          name: 'Dept',
          component: Dept,
          meta: { title: '部门管理' }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: Profile,
          meta: { title: '个人中心' }
        },
        {
          path: 'permission',
          name: 'Permission',
          component: Permission,
          meta: { title: '权限管理' }
        }

        // 以后加新页面都放这里
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/user'  // 任意未知路径重定向到员工管理
    }
  ]
})

export default router