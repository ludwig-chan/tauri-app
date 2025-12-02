<template>
  <div class="app-usage-view">
    <!-- 头部：标题和控制按钮 -->
    <div class="header">
      <h2>应用时间监控</h2>
      <div class="controls">
        <button 
          @click="toggleMonitoring" 
          :class="['btn', isMonitoring ? 'btn-danger' : 'btn-primary']"
        >
          {{ isMonitoring ? '停止监控' : '开始监控' }}
        </button>
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          {{ loading ? '加载中...' : '刷新数据' }}
        </button>
      </div>
    </div>

    <!-- 当前应用显示 -->
    <div v-if="currentApp && isMonitoring" class="current-app">
      <strong>当前应用：</strong>{{ currentApp.name }}
      <span class="window-title">{{ currentApp.window_title }}</span>
    </div>

    <!-- 时间范围选择器 -->
    <TimeRangeSelector 
      v-model="selectedRangeType"
      :initial-range="selectedRangeType"
      @change="onRangeChange"
    />

    <!-- 统计概览 -->
    <UsageSummary 
      :total-duration="totalDuration"
      :app-count="stats.length"
      :active-days="activeDays"
    />

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 视图切换标签 -->
      <div class="chart-tabs">
        <button 
          v-for="tab in chartTabs" 
          :key="tab.value"
          :class="['chart-tab', { active: activeChartTab === tab.value }]"
          @click="activeChartTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 图表内容 -->
      <div class="chart-container">
        <!-- 饼图 -->
        <div v-show="activeChartTab === 'pie'" class="chart-wrapper">
          <UsagePieChart 
            :data="stats" 
            title="应用使用占比"
            :show-legend="true"
          />
        </div>

        <!-- 趋势图 -->
        <div v-show="activeChartTab === 'trend'" class="chart-wrapper">
          <UsageTrendChart 
            :data="trendData" 
            :title="trendChartTitle"
            :chart-type="trendChartType"
            :show-data-zoom="showDataZoom"
          />
        </div>

        <!-- 堆叠图 -->
        <div v-show="activeChartTab === 'stacked'" class="chart-wrapper">
          <UsageStackedChart 
            :data="stackedData" 
            title="应用使用趋势（Top5）"
            :chart-type="trendChartType"
            :show-data-zoom="showDataZoom"
          />
        </div>
      </div>

      <!-- 趋势图类型切换 -->
      <div v-if="activeChartTab !== 'pie'" class="chart-type-toggle">
        <span>图表类型:</span>
        <button 
          :class="['type-btn', { active: trendChartType === 'bar' }]"
          @click="trendChartType = 'bar'"
        >
          柱状图
        </button>
        <button 
          :class="['type-btn', { active: trendChartType === 'line' }]"
          @click="trendChartType = 'line'"
        >
          折线图
        </button>
      </div>
    </div>

    <!-- 应用列表 -->
    <AppUsageList 
      :data="stats"
      title="应用使用排行"
      :display-limit="10"
      :show-view-toggle="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { AppUsageDB, type AppUsageStats } from '../utils/appUsageDb'
import { 
  type TimeRangeType, 
  type DateRange, 
  getDateRange,
  getDaysBetween
} from '../utils/dateUtils'
import {
  TimeRangeSelector,
  UsageSummary,
  UsagePieChart,
  UsageTrendChart,
  UsageStackedChart,
  AppUsageList
} from '../components/app-usage'

// 监控状态
const isMonitoring = ref(false)
const currentApp = ref<any>(null)
const loading = ref(false)

// 数据状态
const stats = ref<AppUsageStats[]>([])
const trendData = ref<Array<{ date: string, total_duration: number }>>([])
const stackedData = ref<{ dates: string[], apps: Array<{ app_name: string, data: number[] }> }>({ 
  dates: [], 
  apps: [] 
})
const totalDuration = ref(0)
const activeDays = ref(0)

// 时间范围状态
const selectedRangeType = ref<TimeRangeType>('today')
const currentDateRange = ref<DateRange>(getDateRange('today'))

// 图表状态
const activeChartTab = ref<'pie' | 'trend' | 'stacked'>('pie')
const trendChartType = ref<'bar' | 'line'>('bar')

// 事件监听器
let unlisten: UnlistenFn | null = null
let pollingInterval: number | null = null

// 图表标签配置
const chartTabs = [
  { value: 'pie' as const, label: '占比分析' },
  { value: 'trend' as const, label: '使用趋势' },
  { value: 'stacked' as const, label: '应用对比' }
]

// 计算属性
const trendChartTitle = computed(() => {
  const days = getDaysBetween(currentDateRange.value.startDate, currentDateRange.value.endDate)
  return `使用时长趋势（${days}天）`
})

const showDataZoom = computed(() => {
  return getDaysBetween(currentDateRange.value.startDate, currentDateRange.value.endDate) > 14
})

// 切换监控状态
async function toggleMonitoring() {
  try {
    if (isMonitoring.value) {
      await invoke('stop_app_monitoring')
      isMonitoring.value = false
      currentApp.value = null
      stopPolling()
    } else {
      await invoke('start_app_monitoring')
      isMonitoring.value = true
      startPolling()
    }
  } catch (error) {
    console.error('切换监控状态失败:', error)
  }
}

// 开始轮询当前应用
function startPolling() {
  pollingInterval = window.setInterval(async () => {
    if (!isMonitoring.value) {
      stopPolling()
      return
    }
    try {
      currentApp.value = await invoke('get_current_app_info')
    } catch (error) {
      console.error('获取当前应用失败:', error)
    }
  }, 3000)
}

// 停止轮询
function stopPolling() {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// 加载所有统计数据
async function loadAllData() {
  loading.value = true
  try {
    const { startDate, endDate } = currentDateRange.value
    
    // 并行加载所有数据
    const [statsData, trendDataResult, stackedDataResult, activeDaysCount] = await Promise.all([
      AppUsageDB.getStatsByDateRange(startDate, endDate),
      AppUsageDB.getDailyUsageTrend(startDate, endDate),
      AppUsageDB.getDailyAppUsageTrend(startDate, endDate, 5),
      AppUsageDB.getActiveDaysCount(startDate, endDate)
    ])

    stats.value = statsData
    trendData.value = trendDataResult
    stackedData.value = stackedDataResult
    totalDuration.value = statsData.reduce((sum, app) => sum + app.total_duration, 0)
    activeDays.value = activeDaysCount
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
async function refreshData() {
  await loadAllData()
}

// 时间范围变更处理
function onRangeChange(range: DateRange) {
  currentDateRange.value = range
  loadAllData()
}

// 监听时间范围类型变化
watch(selectedRangeType, (newType) => {
  if (newType !== 'custom') {
    currentDateRange.value = getDateRange(newType)
  }
})

// 生命周期钩子
onMounted(async () => {
  // 加载初始数据
  await loadAllData()

  // 监听来自 Rust 的应用使用记录
  unlisten = await listen('app-usage-record', async (event: any) => {
    try {
      const record = event.payload
      await AppUsageDB.saveRecord(record)
      
      // 如果记录的日期在当前选择的范围内，则刷新统计
      const recordDate = new Date(record.start_time * 1000).toISOString().split('T')[0]
      const { startDate, endDate } = currentDateRange.value
      if (recordDate >= startDate && recordDate <= endDate) {
        await loadAllData()
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
  stopPolling()
  if (isMonitoring.value) {
    invoke('stop_app_monitoring')
  }
})
</script>

<style scoped>
.app-usage-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-1px);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f, #c62828);
  transform: translateY(-1px);
}

.btn-secondary {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  transform: translateY(-1px);
}

.current-app {
  padding: 15px 20px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-left: 4px solid #2196F3;
  border-radius: 8px;
  font-size: 14px;
}

.window-title {
  margin-left: 10px;
  color: #666;
  font-style: italic;
}

/* 图表区域样式 */
.charts-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.chart-tab {
  padding: 10px 24px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.chart-tab:hover {
  background: #e8e8e8;
}

.chart-tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.chart-container {
  min-height: 350px;
}

.chart-wrapper {
  height: 350px;
}

.chart-type-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.chart-type-toggle span {
  font-size: 13px;
  color: #666;
}

.type-btn {
  padding: 6px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.type-btn:hover {
  background: #e8e8e8;
}

.type-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
</style>
