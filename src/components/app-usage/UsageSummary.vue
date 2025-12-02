<template>
  <div class="usage-summary">
    <div class="summary-card total-time">
      <div class="card-icon">⏱️</div>
      <div class="card-content">
        <div class="card-label">总使用时长</div>
        <div class="card-value">{{ formatDuration(totalDuration) }}</div>
      </div>
    </div>

    <div class="summary-card app-count">
      <div class="card-icon">📱</div>
      <div class="card-content">
        <div class="card-label">应用数量</div>
        <div class="card-value">{{ appCount }}</div>
      </div>
    </div>

    <div class="summary-card active-days">
      <div class="card-icon">📅</div>
      <div class="card-content">
        <div class="card-label">活跃天数</div>
        <div class="card-value">{{ activeDays }}</div>
      </div>
    </div>

    <div class="summary-card avg-daily">
      <div class="card-icon">📊</div>
      <div class="card-content">
        <div class="card-label">日均时长</div>
        <div class="card-value">{{ formatDuration(avgDailyDuration) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '../../utils/dateUtils'

interface Props {
  totalDuration: number
  appCount: number
  activeDays: number
}

const props = defineProps<Props>()

const avgDailyDuration = computed(() => {
  if (props.activeDays === 0) return 0
  return Math.floor(props.totalDuration / props.activeDays)
})
</script>

<style scoped>
.usage-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.summary-card.total-time {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-card.app-count {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.summary-card.active-days {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.summary-card.avg-daily {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.card-icon {
  font-size: 36px;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.card-value {
  font-size: 22px;
  font-weight: bold;
}
</style>
