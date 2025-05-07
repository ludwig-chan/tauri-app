import { createRouter, createWebHistory } from 'vue-router'
import TodoList from '../views/TodoList.vue'

const routes = [
  {
    path: '/',
    redirect: '/todos'
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: TodoList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
