<template>
  <div class="screenshot-container">
    <div class="toolbar">
      <h2>截图工具</h2>
      <div class="button-group">
        <button @click="captureScreen" class="btn primary" :disabled="isCapturing">
          📸 截图
        </button>
      </div>
    </div>

    <div v-if="isCapturing" class="capturing-indicator">
      <div class="spinner"></div>
      <span>正在截图...</span>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📷</div>
      <h3>点击截图按钮开始</h3>
      <p>将捕获鼠标所在屏幕的完整截图</p>
      <p class="hint">截图完成后会自动在新窗口中显示</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const isCapturing = ref(false)

const captureScreen = async () => {
  isCapturing.value = true
  try {
    const result: any = await invoke('capture_screenshot', { mode: 'fullscreen' })
    
    if (result && result.data) {
      // 直接打开新窗口显示截图
      await invoke('open_screenshot_window', {
        imageData: result.data,
        width: result.width,
        height: result.height
      })
    }
  } catch (error) {
    console.error('Screenshot failed:', error)
    alert('截图失败: ' + error)
  } finally {
    isCapturing.value = false
  }
}
</script>

<style scoped>
.screenshot-container {
  max-width: 800px;
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

.capturing-indicator {
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
</style>
