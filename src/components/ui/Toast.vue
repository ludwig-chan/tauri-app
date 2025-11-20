<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-container" :class="`toast-${type}`">
        <div class="toast-content">
          <span class="toast-icon">{{ icon }}</span>
          <span class="toast-message">{{ message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 2000
})

const visible = ref(false)

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
}

const icon = icons[props.type]

let timer: ReturnType<typeof setTimeout>

const show = () => {
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
  }, props.duration)
}

watch(() => props.message, () => {
  if (props.message) {
    show()
  }
}, { immediate: true })

defineExpose({
  show
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  min-width: 200px;
  max-width: 500px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
}

.toast-success {
  background: rgba(76, 175, 80, 0.95);
  color: white;
}

.toast-error {
  background: rgba(244, 67, 54, 0.95);
  color: white;
}

.toast-info {
  background: rgba(33, 150, 243, 0.95);
  color: white;
}

.toast-warning {
  background: rgba(255, 152, 0, 0.95);
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
