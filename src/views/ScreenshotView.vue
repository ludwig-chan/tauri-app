<template>
  <div class="screenshot-container">
    <div class="toolbar">
      <h2>截图工具</h2>
      <div class="button-group">
        <button @click="captureScreen" class="btn primary" :disabled="isCapturing">
          📸 截图
        </button>
        <button @click="refreshHistory" class="btn secondary" :disabled="isLoading">
          🔄 刷新
        </button>
      </div>
    </div>

    <div v-if="isCapturing" class="capturing-indicator">
      <div class="spinner"></div>
      <span>正在截图...</span>
    </div>

    <div v-else-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="screenshots.length === 0" class="empty-state">
      <div class="empty-icon">📷</div>
      <h3>暂无截图记录</h3>
      <p>点击截图按钮开始</p>
      <p class="hint">截图将自动保存到历史记录</p>
    </div>

    <div v-else class="history-grid">
      <div v-for="screenshot in screenshots" :key="screenshot.id" class="screenshot-card">
        <div class="screenshot-preview" @click="openScreenshot(screenshot)">
          <img 
            :src="convertFilePath(screenshot.file_path)" 
            :alt="`截图 ${screenshot.id}`"
            loading="lazy"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <div class="overlay">
            <span class="view-icon">👁️ 查看</span>
          </div>
        </div>
        <div class="screenshot-info">
          <div class="info-text">
            <div class="resolution">{{ screenshot.width }} × {{ screenshot.height }}</div>
            <div class="timestamp">{{ formatDate(screenshot.created_at) }}</div>
          </div>
          <button @click="deleteScreenshot(screenshot.id)" class="btn-delete" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { getAllScreenshots, deleteScreenshot as deleteScreenshotFromDb, type Screenshot } from '../utils/screenshotDb'
import { initDB } from '../utils/db'
import { captureAndSave } from '../utils/screenshotService'

const isCapturing = ref(false)
const isLoading = ref(false)
const screenshots = ref<Screenshot[]>([])

const captureScreen = async () => {
  isCapturing.value = true
  try {
    // 使用统一的截图服务
    await captureAndSave()
    // 刷新列表
    await loadScreenshots()
  } catch (error) {
    console.error('Screenshot failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}

const loadScreenshots = async () => {
  isLoading.value = true
  try {
    screenshots.value = await getAllScreenshots()
  } catch (error) {
    console.error('Failed to load screenshots:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshHistory = () => {
  loadScreenshots()
}

const deleteScreenshot = async (id: number) => {
  if (!confirm('确定要删除这张截图吗？')) {
    return
  }
  
  try {
    await deleteScreenshotFromDb(id)
    await loadScreenshots()
  } catch (error) {
    console.error('Failed to delete screenshot:', error)
    alert('删除失败: ' + error)
  }
}

const convertFilePath = (filePath: string) => {
  const convertedPath = convertFileSrc(filePath)
  console.log('原始路径:', filePath)
  console.log('转换后路径:', convertedPath)
  return convertedPath
}

const handleImageError = (event: Event) => {
  console.error('图片加载失败:', (event.target as HTMLImageElement).src)
}

const handleImageLoad = (event: Event) => {
  console.log('图片加载成功:', (event.target as HTMLImageElement).src)
}

const openScreenshot = (screenshot: Screenshot) => {
  // 可以在这里添加打开大图查看的功能
  window.open(convertFilePath(screenshot.file_path), '_blank')
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

onMounted(async () => {
  // 初始化数据库
  await initDB()
  // 加载截图列表
  await loadScreenshots()
  
  // 监听截图保存事件，自动刷新列表
  window.addEventListener('screenshot-saved', loadScreenshots)
})

onUnmounted(() => {
  window.removeEventListener('screenshot-saved', loadScreenshots)
})
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
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.capturing-indicator,
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 60px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 100px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 22px;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-state .hint {
  color: #42b983;
  font-weight: 500;
  margin-top: 20px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px;
}

.screenshot-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.screenshot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.screenshot-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
  background: #f8f9fa;
}

.screenshot-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.screenshot-preview:hover .overlay {
  opacity: 1;
}

.view-icon {
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.screenshot-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
}

.info-text {
  flex: 1;
}

.resolution {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.timestamp {
  font-size: 12px;
  color: #6c757d;
}

.btn-delete {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: #fee;
}
</style>
