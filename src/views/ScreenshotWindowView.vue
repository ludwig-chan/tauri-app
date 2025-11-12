<template>
  <div ref="containerRef" class="screenshot-window" tabindex="0">
    <button class="close-button" @click="closeWindow" title="关闭 (ESC)">
      ×
    </button>
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
let resizeTimeout: number | null = null
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
  
  if (!imageDimensions.value.width || !imageDimensions.value.height) return
  
  const currentWindow = getCurrentWindow()
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

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.close-button:active {
  transform: scale(0.95);
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
</style>
