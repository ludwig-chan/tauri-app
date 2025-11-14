<template>
  <div 
    ref="containerRef" 
    class="screenshot-window" 
    tabindex="0"
    @contextmenu="handleContextMenu"
  >
    <img 
      v-if="imageDataUrl" 
      :src="imageDataUrl" 
      alt="Screenshot"
      class="screenshot-image"
      @mousedown="startDrag"
      draggable="false"
    />
    <div v-else class="loading">
      <div class="spinner"></div>
    </div>
    
    <!-- 透明度显示 -->
    <div v-if="showOpacityIndicator" class="opacity-indicator">
      <div class="opacity-label">透明度</div>
      <div class="opacity-value">{{ Math.round(currentOpacity * 100) }}%</div>
      <div class="opacity-bar">
        <div class="opacity-bar-fill" :style="{ width: (currentOpacity * 100) + '%' }"></div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
    >
      <div class="context-menu-item" @click="closeWindow">
        <span class="menu-icon">×</span>
        <span>关闭窗口</span>
        <span class="menu-shortcut">ESC</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'

const imageDataUrl = ref<string>('')
const imageDimensions = ref({ width: 0, height: 0 })
const containerRef = ref<HTMLElement | null>(null)
const isAdjusting = ref(false)
const lastSize = ref({ width: 0, height: 0 })
const targetSize = ref({ width: 0, height: 0 })
const currentOpacity = ref(1.0)
const showOpacityIndicator = ref(false)
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
let resizeTimeout: number | null = null
let opacityTimeout: number | null = null
let unlisten: (() => void) | null = null

onMounted(async () => {
  // 自动聚焦到容器元素，确保能接收键盘事件
  if (containerRef.value) {
    containerRef.value.focus()
  }
  
  // 从 URL 参数中获取窗口 ID
  const urlParams = new URLSearchParams(window.location.search)
  const windowId = urlParams.get('id')
  
  if (windowId) {
    try {
      // 通过命令获取截图数据
      const result: any = await invoke('get_screenshot_data', { windowId })
      
      if (result && result.data) {
        imageDataUrl.value = `data:image/png;base64,${result.data}`
        imageDimensions.value = {
          width: result.width || 0,
          height: result.height || 0
        }
        
        // 初始化最后尺寸
        const currentWindow = getCurrentWindow()
        const size = await currentWindow.innerSize()
        lastSize.value = { width: size.width, height: size.height }
      }
    } catch (error) {
      console.error('Failed to load screenshot:', error)
    }
  }
  
  // 监听全局键盘事件
  window.addEventListener('keydown', handleKeyPress)
  
  // 监听鼠标滚轮事件
  window.addEventListener('wheel', handleWheel, { passive: false })
  
  // 监听点击事件以关闭右键菜单
  window.addEventListener('click', handleClickOutside)
  
  // 监听窗口大小变化
  const currentWindow = getCurrentWindow()
  unlisten = await currentWindow.onResized(async (event) => {
    const newSize = event.payload
    
    // 如果正在调整中，忽略事件
    if (isAdjusting.value) {
      return
    }
    
    // 如果是我们刚设置的目标尺寸，直接更新记录
    if (targetSize.value.width > 0 && 
        Math.abs(newSize.width - targetSize.value.width) < 2 &&
        Math.abs(newSize.height - targetSize.value.height) < 2) {
      lastSize.value = { width: newSize.width, height: newSize.height }
      targetSize.value = { width: 0, height: 0 }
      return
    }
    
    // 清除之前的定时器
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout)
    }
    
    // 设置新的定时器，延迟执行
    resizeTimeout = window.setTimeout(async () => {
      await enforceAspectRatio()
    }, 100) // 增加到100ms，让用户操作更流畅
  })
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('keydown', handleKeyPress)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('click', handleClickOutside)
  
  // 清理窗口监听器
  if (unlisten) {
    unlisten()
  }
  
  // 清理定时器
  if (resizeTimeout !== null) {
    clearTimeout(resizeTimeout)
  }
})

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeWindow()
  }
}

const handleWheel = async (event: WheelEvent) => {
  event.preventDefault()
  
  const currentWindow = getCurrentWindow()
  
  // 如果按住了 Ctrl 键，调整透明度
  if (event.ctrlKey) {
    // 向上滚动增加透明度，向下滚动减少透明度
    const delta = event.deltaY < 0 ? 0.05 : -0.05
    let newOpacity = currentOpacity.value + delta
    
    // 限制透明度范围在 0.1 到 1.0 之间
    newOpacity = Math.max(0.1, Math.min(1.0, newOpacity))
    
    currentOpacity.value = newOpacity
    
    try {
      await invoke('set_window_opacity', { 
        label: currentWindow.label,
        opacity: newOpacity 
      })
    } catch (error) {
      console.error('Failed to set opacity:', error)
    }
    
    // 显示透明度指示器
    showOpacityIndicator.value = true
    
    // 清除之前的定时器
    if (opacityTimeout !== null) {
      clearTimeout(opacityTimeout)
    }
    
    // 2秒后隐藏透明度指示器
    opacityTimeout = window.setTimeout(() => {
      showOpacityIndicator.value = false
    }, 2000)
    
    return
  }
  
  // 没有按 Ctrl 键，执行原来的缩放功能
  if (!imageDimensions.value.width || !imageDimensions.value.height) return
  
  const size = await currentWindow.innerSize()
  
  // 计算缩放比例，向上滚动放大，向下滚动缩小
  const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9
  
  // 保持图片宽高比
  const imageRatio = imageDimensions.value.width / imageDimensions.value.height
  
  const newWidth = Math.round(size.width * scaleFactor)
  const newHeight = Math.round(newWidth / imageRatio)
  
  // 设置最小尺寸限制
  const minWidth = 200
  const minHeight = 150
  
  if (newWidth < minWidth || newHeight < minHeight) {
    return
  }
  
  // 设置最大尺寸限制（屏幕尺寸的90%）
  const maxWidth = window.screen.width * 0.9
  const maxHeight = window.screen.height * 0.9
  
  if (newWidth > maxWidth || newHeight > maxHeight) {
    return
  }
  
  try {
    const newSize = new LogicalSize(newWidth, newHeight)
    targetSize.value = { width: newWidth, height: newHeight }
    await currentWindow.setSize(newSize)
    lastSize.value = { width: newWidth, height: newHeight }
  } catch (error) {
    console.error('Failed to resize window:', error)
  }
}

const startDrag = async (event: MouseEvent) => {
  // 阻止默认拖动行为
  event.preventDefault()
  
  // 开始拖动窗口
  const currentWindow = getCurrentWindow()
  await currentWindow.startDragging()
}

const enforceAspectRatio = async () => {
  if (!imageDimensions.value.width || !imageDimensions.value.height) return
  if (isAdjusting.value) return // 防止递归调用
  
  const currentWindow = getCurrentWindow()
  const size = await currentWindow.innerSize()
  
  const imageRatio = imageDimensions.value.width / imageDimensions.value.height
  const currentRatio = size.width / size.height
  
  // 如果比例已经正确，不做调整
  if (Math.abs(currentRatio - imageRatio) < 0.01) {
    lastSize.value = { width: size.width, height: size.height }
    return
  }
  
  // 判断用户是横向还是纵向调整
  const widthChanged = Math.abs(size.width - lastSize.value.width) > Math.abs(size.height - lastSize.value.height)
  
  isAdjusting.value = true
  
  try {
    let newSize: LogicalSize
    
    if (widthChanged) {
      // 用户横向调整，保持宽度，调整高度
      const newHeight = Math.round(size.width / imageRatio)
      newSize = new LogicalSize(size.width, newHeight)
    } else {
      // 用户纵向调整，保持高度，调整宽度
      const newWidth = Math.round(size.height * imageRatio)
      newSize = new LogicalSize(newWidth, size.height)
    }
    
    // 记录目标尺寸
    targetSize.value = { width: newSize.width, height: newSize.height }
    
    // 设置窗口尺寸
    await currentWindow.setSize(newSize)
    
    // 等待一小段时间确保设置完成
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // 更新最后尺寸
    lastSize.value = { width: newSize.width, height: newSize.height }
  } catch (error) {
    console.error('Failed to adjust window size:', error)
  } finally {
    isAdjusting.value = false
  }
}

const closeWindow = async () => {
  const window = getCurrentWindow()
  await window.close()
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const handleClickOutside = () => {
  showContextMenu.value = false
}
</script>

<style scoped>
.screenshot-window {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  outline: none;
  position: relative;
}

.screenshot-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  cursor: move;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.opacity-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  padding: 20px 30px;
  border-radius: 12px;
  color: white;
  text-align: center;
  z-index: 100;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.opacity-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  font-weight: 500;
}

.opacity-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #42b983;
}

.opacity-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.opacity-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #35a372);
  border-radius: 3px;
  transition: width 0.15s ease-out;
}

.context-menu {
  position: fixed;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  user-select: none;
}

.context-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-icon {
  font-size: 20px;
  font-weight: bold;
  width: 20px;
  text-align: center;
}

.menu-shortcut {
  margin-left: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
