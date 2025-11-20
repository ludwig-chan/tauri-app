import { createApp, h } from 'vue'
import Toast from '@/components/ui/Toast.vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

const showToast = (options: ToastOptions) => {
  const { message, type = 'info', duration = 2000 } = options

  // 创建一个临时容器
  const container = document.createElement('div')
  document.body.appendChild(container)

  // 创建 Toast 应用实例
  const app = createApp({
    render() {
      return h(Toast, {
        message,
        type,
        duration
      })
    }
  })

  // 挂载应用
  const instance = app.mount(container)

  // 在 duration + 300ms 后清理（留出动画时间）
  setTimeout(() => {
    app.unmount()
    document.body.removeChild(container)
  }, duration + 300)

  return instance
}

// 导出便捷方法
export const toast = {
  show: (message: string, type: ToastType = 'info', duration = 2000) => {
    return showToast({ message, type, duration })
  },
  success: (message: string, duration = 2000) => {
    return showToast({ message, type: 'success', duration })
  },
  error: (message: string, duration = 2000) => {
    return showToast({ message, type: 'error', duration })
  },
  info: (message: string, duration = 2000) => {
    return showToast({ message, type: 'info', duration })
  },
  warning: (message: string, duration = 2000) => {
    return showToast({ message, type: 'warning', duration })
  }
}
