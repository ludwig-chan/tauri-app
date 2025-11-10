import { createRouter, createWebHistory } from 'vue-router'
import TodoList from '../views/TodoList.vue'
import Pomodoro from '../views/Pomodoro.vue'
import WeekView from '../views/WeekView.vue'
import ScreenshotView from '../views/ScreenshotView.vue'
import ClipboardView from '../views/ClipboardView.vue'

const routes = [
  {
    path: '/',
    redirect: '/week'
  },
  {
    path: '/week',
    name: 'WeekView',
    component: WeekView
  },
  {
    path: '/screenshot',
    name: 'ScreenshotView',
    component: ScreenshotView
  },
  {
    path: '/clipboard',
    name: 'ClipboardView',
    component: ClipboardView
  },
  {
    path: '/pomodoro',
    name: 'Pomodoro',
    component: Pomodoro
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
