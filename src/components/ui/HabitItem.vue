<template>
  <div class="habit-item">
    <div class="habit-header">
      <div class="habit-info">
        <h3 class="habit-name">{{ habit.name }}</h3>
        <p v-if="habit.description" class="habit-description">{{ habit.description }}</p>
        <div class="habit-meta">
          <span class="meta-item">
            {{ getRecurrenceText }}
          </span>
          <span class="meta-item">
            {{ formatDate(habit.start_date) }} 
            {{ habit.end_date ? `至 ${formatDate(habit.end_date)}` : '起' }}
          </span>
          <span v-if="!habit.is_active" class="inactive-badge">已停用</span>
        </div>
      </div>
      <div class="habit-actions">
        <button class="action-btn edit-btn" @click="$emit('edit', habit)" title="编辑">
          ✏️
        </button>
        <button class="action-btn delete-btn" @click="$emit('delete', habit.id)" title="删除">
          🗑️
        </button>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="habit-stats">
      <div class="stat-item">
        <span class="stat-label">当前连续</span>
        <span class="stat-value">{{ stats.currentStreak }} 天</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最长连续</span>
        <span class="stat-value">{{ stats.longestStreak }} 天</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">完成率</span>
        <span class="stat-value">{{ stats.completionRate }}%</span>
      </div>
    </div>

    <!-- 完成情况 -->
    <div class="completion-section">
      <h4 class="section-title">最近30天</h4>
      <div class="calendar-grid">
        <div 
          v-for="day in last30Days" 
          :key="day.date"
          class="calendar-day"
          :class="{ 
            'is-completed': day.isCompleted,
            'is-today': day.isToday 
          }"
          :title="day.date"
          @click="toggleDay(day.date)"
        >
          <span class="day-number">{{ new Date(day.date).getDate() }}</span>
        </div>
      </div>
    </div>

    <!-- 时段打卡（如果设置了时段） -->
    <div v-if="timePeriods.length > 0" class="time-periods">
      <h4 class="section-title">今日打卡</h4>
      <div class="periods-grid">
        <button
          v-for="period in timePeriods"
          :key="period"
          class="period-btn"
          :class="{ 'is-completed': isPeriodCompleted(period) }"
          @click="togglePeriod(period)"
        >
          {{ getPeriodLabel(period) }}
          <span class="check-mark">{{ isPeriodCompleted(period) ? '✓' : '' }}</span>
        </button>
      </div>
    </div>

    <!-- 提醒时间显示 -->
    <div v-if="reminderTimes.length > 0" class="reminder-info">
      <span class="reminder-label">⏰ 提醒时间：</span>
      <span class="reminder-times">{{ reminderTimes.join(', ') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Habit, HabitCompletion } from '../../utils/habitDb'
import { habitDb } from '../../utils/habitDb'

interface Props {
  habit: Habit
  completions: HabitCompletion[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [habit: Habit]
  delete: [id: number]
  toggleComplete: [data: { habitId: number; date: string; timePeriod: string | null; completed: boolean }]
}>()

const stats = ref({
  totalDays: 0,
  completedDays: 0,
  completionRate: 0,
  currentStreak: 0,
  longestStreak: 0
})

// 解析时段和提醒时间
const timePeriods = computed<string[]>(() => {
  return props.habit.time_periods ? JSON.parse(props.habit.time_periods) : []
})

const reminderTimes = computed<string[]>(() => {
  return props.habit.reminder_times ? JSON.parse(props.habit.reminder_times) : []
})

// 获取重复周期文本
const getRecurrenceText = computed(() => {
  const { recurrence_type, recurrence_interval } = props.habit
  const typeText = {
    hourly: '小时',
    daily: '天',
    weekly: '周',
    monthly: '月'
  }
  return `每${recurrence_interval > 1 ? recurrence_interval : ''}${typeText[recurrence_type]}`
})

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取最近30天
const last30Days = computed(() => {
  const days = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // 检查是否完成
    const isCompleted = props.completions.some(c => c.completion_date === dateStr)
    
    days.push({
      date: dateStr,
      isCompleted,
      isToday: i === 0
    })
  }
  
  return days
})

// 获取时段标签
const getPeriodLabel = (period: string) => {
  const labels: Record<string, string> = {
    morning: '早上',
    afternoon: '下午',
    evening: '晚上'
  }
  return labels[period] || period
}

// 检查今天某时段是否完成
const isPeriodCompleted = (period: string) => {
  const today = new Date().toISOString().split('T')[0]
  return props.completions.some(
    c => c.completion_date === today && c.time_period === period
  )
}

// 切换某天的完成状态
const toggleDay = (date: string) => {
  const isCompleted = props.completions.some(c => c.completion_date === date)
  emit('toggleComplete', {
    habitId: props.habit.id,
    date,
    timePeriod: null,
    completed: !isCompleted
  })
}

// 切换某时段的完成状态
const togglePeriod = (period: string) => {
  const today = new Date().toISOString().split('T')[0]
  const isCompleted = isPeriodCompleted(period)
  emit('toggleComplete', {
    habitId: props.habit.id,
    date: today,
    timePeriod: period,
    completed: !isCompleted
  })
}

// 加载统计数据
const loadStats = async () => {
  stats.value = await habitDb.getHabitStats(props.habit.id, 30)
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.habit-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.habit-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.habit-info {
  flex: 1;
}

.habit-name {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.habit-description {
  color: #7f8c8d;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.habit-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #95a5a6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.inactive-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.habit-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  background: #ecf0f1;
}

.action-btn:hover {
  transform: scale(1.1);
}

.edit-btn:hover {
  background: #3498db;
}

.delete-btn:hover {
  background: #e74c3c;
}

.habit-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #42b983;
}

.completion-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #2c3e50;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #ecf0f1;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  color: #7f8c8d;
}

.calendar-day:hover {
  background: #d5dbdb;
  transform: scale(1.1);
}

.calendar-day.is-completed {
  background: #42b983;
  color: white;
}

.calendar-day.is-today {
  border: 2px solid #3498db;
}

.time-periods {
  margin-bottom: 16px;
}

.periods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.period-btn {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.period-btn:hover {
  border-color: #42b983;
  background: #f8f9fa;
}

.period-btn.is-completed {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.check-mark {
  font-size: 16px;
  font-weight: bold;
}

.reminder-info {
  padding: 12px;
  background: #fff8e1;
  border-radius: 8px;
  font-size: 13px;
  color: #f39c12;
}

.reminder-label {
  font-weight: 500;
}

.reminder-times {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
  }
  
  .habit-stats {
    grid-template-columns: 1fr;
  }
  
  .periods-grid {
    grid-template-columns: 1fr;
  }
}
</style>
