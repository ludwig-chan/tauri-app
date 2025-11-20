<template>
  <div class="titlebar" data-tauri-drag-region>
    <button class="titlebar-button toggle-expand" @click="toggleExpand" @mousedown.stop :title="isExpanded ? '收起' : '展开'">
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none"
        :class="{ 'rotated': !isExpanded }"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="titlebar-search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M9.5 9.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input 
        type="text" 
        class="search-input" 
        placeholder="搜索..." 
        v-model="searchQuery"
        @click.stop
        @mousedown.stop
      />
    </div>
    <div class="titlebar-controls">
      <div class="dropdown-wrapper" @mousedown.stop>
        <button class="titlebar-button dropdown-toggle" @click="toggleDropdown" title="更多">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div v-if="dropdownOpen" class="dropdown-menu">
          <div
            v-for="tab in navTabs"
            :key="tab.path"
            class="dropdown-item"
            @click="navigateTo(tab.path)"
          >
            <span>{{ tab.emoji }}</span> {{ tab.label }}
          </div>
        </div>
      </div>
      <button class="titlebar-button screenshot" @click="captureScreen" @mousedown.stop :disabled="isCapturing" title="截图">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h2l1-2h10l1 2h2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke="currentColor" stroke-width="1.2" fill="none"/>
          <circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/>
        </svg>
      </button>
      <button class="titlebar-button settings" @click="goToSettings" title="设置">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 10.5C9.38071 10.5 10.5 9.38071 10.5 8C10.5 6.61929 9.38071 5.5 8 5.5C6.61929 5.5 5.5 6.61929 5.5 8C5.5 9.38071 6.61929 10.5 8 10.5Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M13.5 8.8V7.2L12.1 6.9C12 6.5 11.8 6.2 11.6 5.9L12.3 4.7L11.3 3.7L10.1 4.4C9.8 4.2 9.5 4 9.1 3.9L8.8 2.5H7.2L6.9 3.9C6.5 4 6.2 4.2 5.9 4.4L4.7 3.7L3.7 4.7L4.4 5.9C4.2 6.2 4 6.5 3.9 6.9L2.5 7.2V8.8L3.9 9.1C4 9.5 4.2 9.8 4.4 10.1L3.7 11.3L4.7 12.3L5.9 11.6C6.2 11.8 6.5 12 6.9 12.1L7.2 13.5H8.8L9.1 12.1C9.5 12 9.8 11.8 10.1 11.6L11.3 12.3L12.3 11.3L11.6 10.1C11.8 9.8 12 9.5 12.1 9.1L13.5 8.8Z" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
      <button class="titlebar-button" @click="minimizeWindow" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="2" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12">
          <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <path d="M3 3.5h7.5V11H3V3.5z" fill="none" stroke="currentColor" stroke-width="1"/>
          <path d="M1.5 1v7.5H3v-6h6V1H1.5z" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button close" @click="closeWindow" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { captureAndSave } from '../utils/screenshotService'
import { navTabs } from '../utils/navTabs'

defineProps<{
  isExpanded: boolean
}>()

const emit = defineEmits<{
  toggleExpand: []
}>()

const appWindow = getCurrentWindow()
const router = useRouter()
const searchQuery = ref('')
const isMaximized = ref(false)
const isCapturing = ref(false)
const dropdownOpen = ref(false)

const updateMaximizedState = async () => {
  isMaximized.value = await appWindow.isMaximized()
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const navigateTo = (path: string) => {
  router.push(path)
  closeDropdown()
}

// 点击外部关闭下拉
const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.dropdown-wrapper')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  updateMaximizedState()
  appWindow.onResized(() => {
    updateMaximizedState()
  })
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

const minimizeWindow = async () => {
  await appWindow.minimize()
}

const toggleMaximize = async () => {
  if (isMaximized.value) {
    await appWindow.unmaximize()
  } else {
    await appWindow.maximize()
  }
  await updateMaximizedState()
}

const closeWindow = async () => {
  await appWindow.close()
}

const goToSettings = () => {
  router.push('/settings')
}

const toggleExpand = () => {
  emit('toggleExpand')
}

const captureScreen = async () => {
  if (isCapturing.value) return
  isCapturing.value = true
  try {
    // 使用统一的截图服务
    await captureAndSave()
  } catch (error) {
    console.error('Screenshot failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}
</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.dropdown-toggle {
  width: 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 140px;
  background: #fff;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 100;
  margin-top: 8px;
  padding: 8px 0;
}
.dropdown-item {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.18s;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  background: #2c2c2c;
  color: #ffffff;
  user-select: none;
  -webkit-user-select: none;
  gap: 12px;
}

.titlebar-search {
  margin-left: 12px;
  display: flex;
  align-items: center;
  flex: 1;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0 12px;
  gap: 8px;
}

.search-icon {
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 14px;
  min-width: 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.titlebar-controls {
  display: flex;
  height: 100%;
}

.titlebar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

.titlebar-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.titlebar-button.settings {
  margin-right: auto;
}

.titlebar-button.close:hover {
  background-color: #e81123;
}

.titlebar-button.toggle-expand {
  width: 32px;
  margin-left: 4px;
}

.titlebar-button.toggle-expand svg {
  transition: transform 0.3s ease;
}

.titlebar-button.toggle-expand svg.rotated {
  transform: rotate(-90deg);
}

.titlebar-button svg {
  pointer-events: none;
}
</style>
