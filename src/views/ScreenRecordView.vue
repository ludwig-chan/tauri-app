<template>
  <div class="screen-record-container">
    <div class="toolbar">
      <h2>录屏工具</h2>
      <div class="button-group">
        <button 
          v-if="!isRecording" 
          @click="startRecording" 
          class="btn primary"
          :disabled="isStarting"
        >
          🔴 开始录屏
        </button>
        <button 
          v-else 
          @click="stopRecording" 
          class="btn danger"
          :disabled="isStopping"
        >
          ⏹️ 停止录屏
        </button>
        <button @click="refreshHistory" class="btn secondary" :disabled="isLoading">
          🔄 刷新
        </button>
      </div>
    </div>

    <div v-if="isRecording" class="recording-indicator">
      <div class="recording-pulse"></div>
      <div class="recording-info">
        <span class="recording-text">正在录制中...</span>
        <span class="recording-time">{{ formatRecordingTime }}</span>
      </div>
    </div>

    <div v-if="isStarting || isStopping" class="loading-indicator">
      <div class="spinner"></div>
      <span>{{ isStarting ? '正在启动录屏...' : '正在保存录屏...' }}</span>
    </div>

    <div v-else-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="recordings.length === 0" class="empty-state">
      <div class="empty-icon">🎬</div>
      <h3>暂无录屏记录</h3>
      <p>点击开始录屏按钮</p>
      <p class="hint">录屏将自动保存到历史记录</p>
    </div>

    <div v-else class="history-grid">
      <div v-for="recording in recordings" :key="recording.id" class="recording-card">
        <div class="recording-preview" @click="playRecording(recording)">
          <div class="video-placeholder">
            <div class="play-icon">▶️</div>
            <video 
              :src="convertFilePath(recording.file_path)" 
              preload="metadata"
              @error="handleVideoError"
            ></video>
          </div>
          <div class="overlay">
            <span class="view-icon">▶️ 播放</span>
          </div>
        </div>
        <div class="recording-info">
          <div class="info-text">
            <div class="duration">⏱️ {{ formatDuration(recording.duration) }}</div>
            <div class="timestamp">{{ formatDate(recording.created_at) }}</div>
          </div>
          <div class="action-buttons">
            <button @click="downloadRecording(recording)" class="btn-action" title="下载">
              💾
            </button>
            <button @click="deleteRecording(recording.id)" class="btn-delete" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放弹窗 -->
    <div v-if="playingVideo" class="video-modal" @click="closeVideoModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeVideoModal">✕</button>
        <video 
          :src="playingVideo" 
          controls 
          autoplay
          class="modal-video"
        ></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'

interface Recording {
  id: number
  file_path: string
  duration: number
  created_at: string
}

const isRecording = ref(false)
const isStarting = ref(false)
const isStopping = ref(false)
const isLoading = ref(false)
const recordings = ref<Recording[]>([])
const recordingStartTime = ref<number>(0)
const recordingTimer = ref<number>(0)
const playingVideo = ref<string>('')

let timerInterval: number | null = null

const formatRecordingTime = computed(() => {
  const seconds = recordingTimer.value
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const startRecording = async () => {
  isStarting.value = true
  try {
    // TODO: 这里需要调用 Tauri 的录屏 API
    // 暂时使用模拟实现
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    isRecording.value = true
    recordingStartTime.value = Date.now()
    recordingTimer.value = 0
    
    // 启动计时器
    timerInterval = window.setInterval(() => {
      recordingTimer.value = Math.floor((Date.now() - recordingStartTime.value) / 1000)
    }, 1000)
    
    console.log('开始录屏')
  } catch (error) {
    console.error('启动录屏失败:', error)
    alert('启动录屏失败: ' + error)
  } finally {
    isStarting.value = false
  }
}

const stopRecording = async () => {
  isStopping.value = true
  try {
    // 停止计时器
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    
    // TODO: 这里需要调用 Tauri 的停止录屏 API
    // 暂时使用模拟实现
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    isRecording.value = false
    console.log('停止录屏')
    
    // 刷新列表
    await loadRecordings()
  } catch (error) {
    console.error('停止录屏失败:', error)
    alert('停止录屏失败: ' + error)
  } finally {
    isStopping.value = false
  }
}

const loadRecordings = async () => {
  isLoading.value = true
  try {
    // TODO: 从数据库加载录屏记录
    // 暂时使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    recordings.value = []
  } catch (error) {
    console.error('加载录屏记录失败:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshHistory = () => {
  loadRecordings()
}

const deleteRecording = async (id: number) => {
  if (!confirm('确定要删除这个录屏吗？')) {
    return
  }
  
  try {
    // TODO: 从数据库删除录屏记录
    await loadRecordings()
  } catch (error) {
    console.error('删除录屏失败:', error)
    alert('删除失败: ' + error)
  }
}

const playRecording = (recording: Recording) => {
  playingVideo.value = convertFilePath(recording.file_path)
}

const closeVideoModal = () => {
  playingVideo.value = ''
}

const downloadRecording = (recording: Recording) => {
  const link = document.createElement('a')
  link.href = convertFilePath(recording.file_path)
  link.download = `录屏_${formatDate(recording.created_at)}.mp4`
  link.click()
}

const convertFilePath = (filePath: string) => {
  return convertFileSrc(filePath)
}

const handleVideoError = (event: Event) => {
  console.error('视频加载失败:', (event.target as HTMLVideoElement).src)
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}分${secs}秒`
  }
  return `${secs}秒`
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
  await loadRecordings()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.screen-record-container {
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
  background: #dc3545;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn.danger {
  background: #6c757d;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.btn.danger:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 10px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.recording-pulse {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

.recording-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recording-text {
  font-size: 18px;
  font-weight: 600;
}

.recording-time {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

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
  border-top: 4px solid #dc3545;
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
  color: #dc3545;
  font-weight: 500;
  margin-top: 20px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.recording-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.recording-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.recording-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.play-icon {
  font-size: 60px;
  color: white;
  opacity: 0.9;
}

.video-placeholder video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
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

.recording-preview:hover .overlay {
  opacity: 1;
}

.view-icon {
  color: white;
  font-size: 18px;
  font-weight: 500;
}

.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
}

.info-text {
  flex: 1;
}

.duration {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.timestamp {
  font-size: 12px;
  color: #6c757d;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action,
.btn-delete {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-action:hover {
  background: #e3f2fd;
}

.btn-delete:hover {
  background: #fee;
}

/* 视频播放弹窗 */
.video-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 30px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-video {
  width: 100%;
  max-height: 90vh;
  border-radius: 8px;
}
</style>
