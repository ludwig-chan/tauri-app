<template>
  <div class="screenshot-container">
    <h1>📷 截图贴图</h1>
    
    <div class="screenshot-section">
      <h3>屏幕截图</h3>
      <div class="controls">
        <button @click="captureScreen" :disabled="isCapturing" class="capture-btn">
          {{ isCapturing ? '正在截图...' : '开始截图' }}
        </button>
        <button @click="captureArea" :disabled="isCapturing" class="capture-btn">
          区域截图
        </button>
      </div>
      
      <div v-if="screenshots.length > 0" class="screenshots-grid">
        <div v-for="(screenshot, index) in screenshots" :key="index" class="screenshot-item">
          <img :src="screenshot.url" :alt="`截图 ${index + 1}`" @click="openImageModal(screenshot)" />
          <div class="screenshot-actions">
            <button @click="copyToClipboard(screenshot)" class="action-btn">复制</button>
            <button @click="downloadImage(screenshot, index)" class="action-btn">下载</button>
            <button @click="deleteScreenshot(index)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="paste-section">
      <h3>图片粘贴</h3>
      <div class="paste-area" @paste="handlePaste" @dragover="handleDragOver" @drop="handleDrop" tabindex="0">
        <p>在此区域粘贴图片 (Ctrl+V) 或拖拽图片文件</p>
        <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" style="display: none;" />
        <button @click="selectFile" class="select-btn">选择图片文件</button>
      </div>
      
      <div v-if="pastedImages.length > 0" class="pasted-images-grid">
        <div v-for="(image, index) in pastedImages" :key="index" class="image-item">
          <img :src="image.url" :alt="`粘贴图片 ${index + 1}`" @click="openImageModal(image)" />
          <div class="image-actions">
            <button @click="copyToClipboard(image)" class="action-btn">复制</button>
            <button @click="downloadImage(image, index, 'pasted')" class="action-btn">下载</button>
            <button @click="deletePastedImage(index)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="modalImage" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close" @click="closeModal">&times;</span>
        <img :src="modalImage.url" :alt="modalImage.name || '预览图片'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ImageData {
  url: string
  name?: string
  timestamp: Date
}

const isCapturing = ref(false)
const screenshots = ref<ImageData[]>([])
const pastedImages = ref<ImageData[]>([])
const modalImage = ref<ImageData | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 截图功能
const captureScreen = async () => {
  try {
    isCapturing.value = true
    
    // 使用 getDisplayMedia API 进行屏幕截图
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    })
    
    // 创建视频元素来捕获帧
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()
    
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            screenshots.value.push({
              url,
              name: `screenshot_${Date.now()}.png`,
              timestamp: new Date()
            })
          }
        }, 'image/png')
      }
      
      // 停止录制
      stream.getTracks().forEach(track => track.stop())
      isCapturing.value = false
    }
  } catch (err) {
    console.error('截图失败:', err)
    isCapturing.value = false
    alert('截图失败，请确保浏览器支持屏幕共享功能')
  }
}

// 区域截图（暂时使用相同的API，实际实现可能需要更复杂的UI）
const captureArea = async () => {
  await captureScreen() // 简化实现，实际应该有区域选择UI
}

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const url = URL.createObjectURL(file)
        pastedImages.value.push({
          url,
          name: `pasted_${Date.now()}.${file.type.split('/')[1]}`,
          timestamp: new Date()
        })
      }
    }
  }
}

// 处理拖拽
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files) return
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      pastedImages.value.push({
        url,
        name: file.name,
        timestamp: new Date()
      })
    }
  }
}

// 文件选择
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      pastedImages.value.push({
        url,
        name: file.name,
        timestamp: new Date()
      })
    }
  }
}

// 复制到剪贴板
const copyToClipboard = async (image: ImageData) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])
    alert('图片已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败')
  }
}

// 下载图片
const downloadImage = (image: ImageData, index: number, prefix: string = 'screenshot') => {
  const a = document.createElement('a')
  a.href = image.url
  a.download = image.name || `${prefix}_${index + 1}.png`
  a.click()
}

// 删除截图
const deleteScreenshot = (index: number) => {
  URL.revokeObjectURL(screenshots.value[index].url)
  screenshots.value.splice(index, 1)
}

// 删除粘贴的图片
const deletePastedImage = (index: number) => {
  URL.revokeObjectURL(pastedImages.value[index].url)
  pastedImages.value.splice(index, 1)
}

// 模态框
const openImageModal = (image: ImageData) => {
  modalImage.value = image
}

const closeModal = () => {
  modalImage.value = null
}

// 键盘事件监听
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // 清理 URL 对象
  screenshots.value.forEach(img => URL.revokeObjectURL(img.url))
  pastedImages.value.forEach(img => URL.revokeObjectURL(img.url))
})
</script>

<style scoped>
.screenshot-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
}

h3 {
  color: #34495e;
  margin: 20px 0 15px 0;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.screenshot-section, .paste-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.capture-btn, .select-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.capture-btn:hover, .select-btn:hover {
  background: #2980b9;
}

.capture-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.paste-area {
  border: 2px dashed #3498db;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  background: #ecf0f1;
  cursor: pointer;
  transition: border-color 0.3s;
}

.paste-area:hover, .paste-area:focus {
  border-color: #2980b9;
  outline: none;
}

.screenshots-grid, .pasted-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.screenshot-item, .image-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.screenshot-item:hover, .image-item:hover {
  transform: translateY(-2px);
}

.screenshot-item img, .image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
}

.screenshot-actions, .image-actions {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background: #fff;
}

.action-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #229954;
}

.action-btn.delete {
  background: #e74c3c;
}

.action-btn.delete:hover {
  background: #c0392b;
}

/* 模态框样式 */
.modal {
  display: flex;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8);
  align-items: center;
  justify-content: center;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.modal-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.close {
  position: absolute;
  top: 10px;
  right: 20px;
  color: #aaa;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1001;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close:hover {
  color: white;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }
  
  .screenshots-grid, .pasted-images-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .screenshot-actions, .image-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>