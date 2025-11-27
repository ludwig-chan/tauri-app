import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import TodoList from '../views/TodoList.vue'
import Pomodoro from '../views/Pomodoro.vue'
import WeekView from '../views/WeekView.vue'
import ScreenshotView from '../views/ScreenshotView.vue'
import ScreenshotWindowView from '../views/ScreenshotWindowView.vue'
import ScreenRecordView from '../views/ScreenRecordView.vue'
import ClipboardView from '../views/ClipboardView.vue'
import SettingsView from '../views/SettingsView.vue'
import RandomAlarmView from '../views/RandomAlarmView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        redirect: '/week'
      },
      {
        path: 'week',
        name: 'WeekView',
        component: WeekView
      },
      {
        path: 'screenshot',
        name: 'ScreenshotView',
        component: ScreenshotView
      },
      {
        path: 'screen-record',
        name: 'ScreenRecordView',
        component: ScreenRecordView
      },
      {
        path: 'clipboard',
        name: 'ClipboardView',
        component: ClipboardView
      },
      {
        path: 'pomodoro',
        name: 'Pomodoro',
        component: Pomodoro
      },
      {
        path: 'todos',
        name: 'TodoList',
        component: TodoList
      },
      {
        path: 'random-alarm',
        name: 'RandomAlarmView',
        component: RandomAlarmView
      },
      {
        path: 'settings',
        name: 'SettingsView',
        component: SettingsView
      }
      ,
      {
        path: 'app-usage',
        name: 'AppUsageView',
        component: () => import('../views/AppUsageView.vue')
      }
    ]
  },
  {
    path: '/screenshot-window',
    name: 'ScreenshotWindowView',
    component: ScreenshotWindowView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
