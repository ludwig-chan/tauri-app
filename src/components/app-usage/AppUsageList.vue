<template>
  <div class="app-usage-list">
    <div class="list-header">
      <h3>{{ title }}</h3>
      <div class="view-toggle" v-if="showViewToggle">
        <button 
          :class="['toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          列表
        </button>
        <button 
          :class="['toggle-btn', { active: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
        >
          网格
        </button>
      </div>
    </div>

    <div v-if="data.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <p>{{ emptyText }}</p>
    </div>

    <!-- 列表视图 -->
    <div v-else-if="viewMode === 'list'" class="list-view">
      <div 
        v-for="(app, index) in displayData" 
        :key="app.executable"
        class="app-item"
      >
        <div class="app-rank" :class="getRankClass(index)">
          {{ index + 1 }}
        </div>
        <AppIcon 
          :app-name="app.app_name" 
          :icon-type="app.icon" 
          class="app-icon-display"
        />
        <div class="app-info">
          <div class="app-name" :title="app.app_name">{{ app.app_name }}</div>
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
            :style="{ width: app.percentage + '%', background: getProgressColor(index) }"
          ></div>
        </div>
      </div>

      <div v-if="data.length > displayLimit && !showAll" class="show-more">
        <button @click="showAll = true" class="show-more-btn">
          显示全部 ({{ data.length }} 个应用)
        </button>
      </div>
    </div>

    <!-- 网格视图 -->
    <div v-else class="grid-view">
      <div 
        v-for="(app, index) in displayData" 
        :key="app.executable"
        class="grid-item"
      >
        <div class="grid-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
        <AppIcon 
          :app-name="app.app_name" 
          :icon-type="app.icon" 
          class="grid-icon"
        />
        <div class="grid-name" :title="app.app_name">{{ app.app_name }}</div>
        <div class="grid-duration">{{ formatDuration(app.total_duration) }}</div>
        <div class="grid-percentage">{{ app.percentage.toFixed(1) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppIcon from '../ui/AppIcon.vue'
import type { AppUsageStats } from '../../utils/appUsageDb'
import { formatDuration } from '../../utils/dateUtils'

interface Props {
  data: AppUsageStats[]
  title?: string
  emptyText?: string
  displayLimit?: number
  showViewToggle?: boolean
  defaultView?: 'list' | 'grid'
}

const props = withDefaults(defineProps<Props>(), {
  title: '应用使用排行',
  emptyText: '暂无数据，请开始监控',
  displayLimit: 10,
  showViewToggle: true,
  defaultView: 'list'
})

const viewMode = ref<'list' | 'grid'>(props.defaultView)
const showAll = ref(false)

const displayData = computed(() => {
  if (showAll.value) {
    return props.data
  }
  return props.data.slice(0, props.displayLimit)
})

function getRankClass(index: number): string {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

function getProgressColor(index: number): string {
  const colors = [
    'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',  // 金色
    'linear-gradient(90deg, #C0C0C0 0%, #A9A9A9 100%)',  // 银色
    'linear-gradient(90deg, #CD7F32 0%, #8B4513 100%)',  // 铜色
    'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',  // 绿色
    'linear-gradient(90deg, #2196F3 0%, #03A9F4 100%)',  // 蓝色
  ]
  return colors[Math.min(index, colors.length - 1)]
}
</script>

<style scoped>
.app-usage-list {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 6px;
}

.toggle-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: white;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

/* 列表视图 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.app-rank {
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #999;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eee;
}

.app-rank.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}

.app-rank.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  color: white;
}

.app-rank.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: white;
}

.app-icon-display {
  grid-row: 1 / 3;
  align-self: center;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  font-size: 16px;
  font-weight: bold;
  color: #2196F3;
}

.percentage {
  font-size: 13px;
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
  transition: width 0.3s;
}

.show-more {
  text-align: center;
  margin-top: 10px;
}

.show-more-btn {
  padding: 8px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.show-more-btn:hover {
  background: #e0e0e0;
}

/* 网格视图 */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: all 0.3s;
  position: relative;
}

.grid-item:hover {
  background: #f0f0f0;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.grid-rank {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 12px;
  font-weight: bold;
  color: #999;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eee;
}

.grid-rank.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}

.grid-rank.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  color: white;
}

.grid-rank.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: white;
}

.grid-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
}

.grid-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-bottom: 5px;
}

.grid-duration {
  font-size: 14px;
  font-weight: bold;
  color: #2196F3;
}

.grid-percentage {
  font-size: 12px;
  color: #666;
}
</style>
