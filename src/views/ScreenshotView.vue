<template>
  <div class="screenshot-container">
    <div class="toolbar">
      <h2>截图贴图工具</h2>
      <div class="button-group">
        <button @click="captureFullScreen" class="btn primary" :disabled="isCapturing">
          📸 全屏截图
        </button>
        <button @click="captureWindow" class="btn secondary" :disabled="isCapturing">
          🪟 窗口截图
        </button>
        <button @click="captureRegion" class="btn secondary" :disabled="isCapturing">
          ✂️ 区域截图
        </button>
        <button @click="openClipboard" class="btn outline">
          📋 剪贴板
        </button>
      </div>
    </div>

    <div v-if="isCapturing" class="capturing-indicator">
      <div class="spinner"></div>
      <span>正在截图...</span>
    </div>

    <div v-if="currentImage" class="image-preview">
      <div class="image-header">
        <h3>截图预览</h3>
        <div class="image-actions">
          <button @click="saveImage" class="btn primary">💾 保存</button>
          <button @click="copyToClipboard" class="btn secondary">📋 复制</button>
          <button @click="clearImage" class="btn outline">🗑️ 清除</button>
        </div>
      </div>
      <div class="image-container">
        <img :src="currentImage" alt="Screenshot" @click="openImageModal" />
      </div>
      <div class="image-info">
        <span>点击图片查看大图 | 大小: {{ imageSize }}</span>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📷</div>
      <h3>开始截图</h3>
      <p>选择上方的截图方式开始使用</p>
    </div>

    <!-- 图片查看模态框 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>图片预览</h3>
          <button @click="closeImageModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <img :src="currentImage || ''" alt="Screenshot Full View" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'

// 响应式数据
const isCapturing = ref(false)
const currentImage = ref<string | null>(null)
const showImageModal = ref(false)
const imageDimensions = ref({ width: 0, height: 0 })

// 计算属性
const imageSize = computed(() => {
  if (!imageDimensions.value.width || !imageDimensions.value.height) {
    return '未知'
  }
  return `${imageDimensions.value.width} × ${imageDimensions.value.height}`
})

// 截图方法
const captureFullScreen = async () => {
  isCapturing.value = true
  try {
    const result = await invoke('capture_screenshot', { mode: 'fullscreen' })
    handleScreenshotResult(result)
  } catch (error) {
    console.error('Full screen capture failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}

const captureWindow = async () => {
  isCapturing.value = true
  try {
    const result = await invoke('capture_screenshot', { mode: 'window' })
    handleScreenshotResult(result)
  } catch (error) {
    console.error('Window capture failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}

const captureRegion = async () => {
  isCapturing.value = true
  try {
    const result = await invoke('capture_screenshot', { mode: 'region' })
    handleScreenshotResult(result)
  } catch (error) {
    console.error('Region capture failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}

// 处理截图结果
const handleScreenshotResult = (result: any) => {
  if (result && result.data) {
    currentImage.value = `data:image/png;base64,${result.data}`
    imageDimensions.value = {
      width: result.width || 0,
      height: result.height || 0
    }
  }
}

// 保存图片
const saveImage = async () => {
  if (!currentImage.value) return
  
  try {
    const base64Data = currentImage.value.split(',')[1]
    await invoke('save_screenshot', { data: base64Data })
    alert('截图已保存')
  } catch (error) {
    console.error('Save failed:', error)
    alert('保存失败: ' + error)
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!currentImage.value) return
  
  try {
    const base64Data = currentImage.value.split(',')[1]
    await invoke('copy_to_clipboard', { data: base64Data })
    alert('已复制到剪贴板')
  } catch (error) {
    console.error('Copy failed:', error)
    alert('复制失败: ' + error)
  }
}

// 清除当前图片
const clearImage = () => {
  currentImage.value = null
  imageDimensions.value = { width: 0, height: 0 }
}

// 打开剪贴板
const openClipboard = () => {
  // TODO: 实现剪贴板历史功能
  alert('剪贴板功能开发中...')
}

// 模态框控制
const openImageModal = () => {
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
}
</script>

<style scoped>
.screenshot-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toolbar h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: #42b983;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #369870;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn.outline {
  background: transparent;
  color: #6c757d;
  border: 2px solid #6c757d;
}

.btn.outline:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.capturing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-preview {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.image-header h3 {
  margin: 0;
  color: #333;
}

.image-actions {
  display: flex;
  gap: 10px;
}

.image-container {
  padding: 20px;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.image-container img:hover {
  transform: scale(1.02);
}

.image-info {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #495057;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}
</style>
