import { createRouter, createWebHistory } from 'vue-router'
import TodoList from '../views/TodoList.vue'
import Pomodoro from '../views/Pomodoro.vue'
import WeekView from '../views/WeekView.vue'

const routes = [
  {
    path: '/',
    redirect: '/todos'
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: TodoList
  },
  {
    path: '/pomodoro',
    name: 'Pomodoro',
    component: Pomodoro
  },
  {
    path: '/week',
    name: 'WeekView',
    component: WeekView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
