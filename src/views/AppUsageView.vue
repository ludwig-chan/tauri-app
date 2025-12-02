<template>
  <div class="app-usage-view">
    <div class="header">
      <h2>应用时间监控</h2>
      <div class="controls">
        <button 
          @click="toggleMonitoring" 
          :class="['btn', isMonitoring ? 'btn-danger' : 'btn-primary']"
        >
          {{ isMonitoring ? '停止监控' : '开始监控' }}
        </button>
        <button @click="refreshData" class="btn btn-secondary">刷新数据</button>
      </div>
    </div>

    <div class="date-selector">
      <input 
        type="date" 
        v-model="selectedDate" 
        @change="loadStats"
        class="date-input"
      />
      <div class="quick-select">
        <button @click="selectToday" class="quick-btn">今天</button>
        <button @click="selectYesterday" class="quick-btn">昨天</button>
        <button @click="selectThisWeek" class="quick-btn">本周</button>
      </div>
    </div>

    <div v-if="currentApp && isMonitoring" class="current-app">
      <strong>当前应用：</strong>{{ currentApp.name }}
      <span class="window-title">{{ currentApp.window_title }}</span>
    </div>

    <div class="stats-container">
      <div class="total-time">
        <h3>总使用时长</h3>
        <div class="time-display">{{ formatDuration(totalDuration) }}</div>
      </div>

      <div class="app-list">
        <h3>应用使用排行</h3>
        <div v-if="stats.length === 0" class="empty-state">
          暂无数据，请开始监控
        </div>
        <div v-else class="app-items">
          <div 
            v-for="(app, index) in stats" 
            :key="app.executable"
            class="app-item"
          >
            <div class="app-rank">{{ index + 1 }}</div>
            <AppIcon 
              :app-name="app.app_name" 
              :icon-type="app.icon" 
              class="app-icon-display"
            />
            <div class="app-info">
              <div class="app-name">{{ app.app_name }}</div>
              <div class="app-details">
                使用 {{ app.usage_count }} 次
              </div>
            </div>
            <div class="app-stats">
              <div class="duration">{{ formatDuration(app.total_duration) }}</div>
              <div class="percentage">{{ app.percentage.toFixed(1) }}%</div>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: app.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { AppUsageDB, type AppUsageStats } from '../utils/appUsageDb'
import AppIcon from '../components/ui/AppIcon.vue'

const isMonitoring = ref(false)
const currentApp = ref<any>(null)
const stats = ref<AppUsageStats[]>([])
const selectedDate = ref(getTodayDate())
const totalDuration = ref(0)
let unlisten: UnlistenFn | null = null

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`
  } else {
    return `${secs}秒`
  }
}

async function toggleMonitoring() {
  try {
    if (isMonitoring.value) {
      await invoke('stop_app_monitoring')
      isMonitoring.value = false
      currentApp.value = null
    } else {
      await invoke('start_app_monitoring')
      isMonitoring.value = true
      startPollingCurrentApp()
    }
  } catch (error) {
    console.error('切换监控状态失败:', error)
  }
}

async function startPollingCurrentApp() {
  const interval = setInterval(async () => {
    if (!isMonitoring.value) {
      clearInterval(interval)
      return
    }
    try {
      currentApp.value = await invoke('get_current_app_info')
    } catch (error) {
      console.error('获取当前应用失败:', error)
    }
  }, 3000)
}

async function loadStats() {
  try {
    stats.value = await AppUsageDB.getStatsByDate(selectedDate.value)
    totalDuration.value = stats.value.reduce((sum, app) => sum + app.total_duration, 0)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function refreshData() {
  await loadStats()
}

function selectToday() {
  selectedDate.value = getTodayDate()
  loadStats()
}

function selectYesterday() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  selectedDate.value = yesterday.toISOString().split('T')[0]
  loadStats()
}

function selectThisWeek() {
  // 获取本周一
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  selectedDate.value = monday.toISOString().split('T')[0]
  loadStats()
}

onMounted(async () => {
  await loadStats()

  // 监听来自 Rust 的应用使用记录
  unlisten = await listen('app-usage-record', async (event: any) => {
    try {
      const record = event.payload
      await AppUsageDB.saveRecord(record)
      
      // 如果记录的日期是当前选择的日期，则刷新统计
      const recordDate = new Date(record.start_time * 1000).toISOString().split('T')[0]
      if (recordDate === selectedDate.value) {
        await loadStats()
      }
    } catch (error) {
      console.error('保存应用使用记录失败:', error)
    }
  })

  // 自动开始监控
  await toggleMonitoring()
})

onUnmounted(() => {
  if (unlisten) {
    unlisten()
  }
  if (isMonitoring.value) {
    invoke('stop_app_monitoring')
  }
})
</script>

<style scoped>
.app-usage-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.controls {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #da190b;
}

.btn-secondary {
  background: #2196F3;
  color: white;
}

.btn-secondary:hover {
  background: #0b7dda;
}

.date-selector {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.quick-select {
  display: flex;
  gap: 8px;
}

.quick-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #e0e0e0;
}

.current-app {
  padding: 15px;
  background: #e3f2fd;
  border-left: 4px solid #2196F3;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.window-title {
  margin-left: 10px;
  color: #666;
  font-style: italic;
}

.stats-container {
  display: grid;
  gap: 20px;
}

.total-time {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  text-align: center;
}

.total-time h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  opacity: 0.9;
}

.time-display {
  font-size: 36px;
  font-weight: bold;
}

.app-list {
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app-list h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.app-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.app-item {
  display: grid;
  grid-template-columns: 40px 40px 1fr auto;
  grid-template-rows: auto auto;
  gap: 10px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s;
}

.app-item:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.app-rank {
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #999;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.app-details {
  font-size: 12px;
  color: #666;
}

.app-stats {
  grid-row: 1;
  text-align: right;
}

.duration {
  font-size: 18px;
  font-weight: bold;
  color: #2196F3;
}

.percentage {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.progress-bar {
  grid-column: 3 / 5;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
  transition: width 0.3s;
}

.app-icon-display {
  grid-row: 1 / 3;
  align-self: center;
}
</style>
