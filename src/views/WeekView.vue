<template>
  <div class="month-view">
    <div class="month-card">
      <div class="month-header">
        <h2>📅 月历视图</h2>
        <div class="current-date">{{ formatDate(currentDate) }}</div>
      </div>
      
      <div class="month-info">
        <div class="week-number">
          <div class="label">本年第</div>
          <div class="number">{{ weekNumber }}</div>
          <div class="label">周</div>
        </div>
      </div>

      <div class="month-calendar">
        <div class="calendar-header">
          <button @click="previousMonth" class="nav-button">‹</button>
          <div class="month-year">{{ currentMonthYear }}</div>
          <button @click="nextMonth" class="nav-button">›</button>
        </div>
        
        <div class="calendar-weekdays">
          <div v-for="weekday in weekdays" :key="weekday" class="weekday">
            {{ weekday }}
          </div>
        </div>
        
        <div class="calendar-days">
          <div 
            v-for="day in monthDays" 
            :key="day.key"
            :class="[
              'day', 
              { 
                'today': day.isToday,
                'other-month': day.isOtherMonth,
                'weekend': day.isWeekend
              }
            ]"
          >
            <div class="day-date">{{ day.date }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const currentDate = ref(new Date())
const displayDate = ref(new Date()) // 用于显示的月份，可以通过按钮切换

// 获取当前年份的第几周
const getWeekNumber = (date: Date): number => {
  const target = new Date(date.valueOf())
  const dayNumber = (date.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = target.valueOf()
  target.setUTCMonth(0, 1)
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

// 格式化日期
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取月份的所有日期（包括上个月和下个月的日期以填满日历）
const getMonthDays = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  // 当月第一天
  const firstDay = new Date(year, month, 1)
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  
  // 第一周的周一（可能是上个月的日期）
  const startDate = new Date(firstDay)
  const firstDayWeekday = (firstDay.getDay() + 6) % 7 // 转换为周一开始
  startDate.setDate(firstDay.getDate() - firstDayWeekday)
  
  // 最后一周的周日（可能是下个月的日期）
  const endDate = new Date(lastDay)
  const lastDayWeekday = (lastDay.getDay() + 6) % 7
  endDate.setDate(lastDay.getDate() + (6 - lastDayWeekday))
  
  const days = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayMonth = current.getMonth()
    const isOtherMonth = dayMonth !== month
    const isToday = current.toDateString() === currentDate.value.toDateString()
    const isWeekend = current.getDay() === 0 || current.getDay() === 6
    
    days.push({
      key: current.toISOString(),
      date: current.getDate(),
      isToday,
      isOtherMonth,
      isWeekend,
      fullDate: new Date(current)
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

// 切换到上个月
const previousMonth = () => {
  const newDate = new Date(displayDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  displayDate.value = newDate
}

// 切换到下个月
const nextMonth = () => {
  const newDate = new Date(displayDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  displayDate.value = newDate
}

// 计算属性
const weekNumber = computed(() => getWeekNumber(currentDate.value))
const currentMonthYear = computed(() => {
  return displayDate.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
})

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const monthDays = computed(() => getMonthDays(displayDate.value))

// 组件挂载时更新当前时间
onMounted(() => {
  const updateTime = () => {
    currentDate.value = new Date()
  }
  
  // 每小时更新一次
  const interval = setInterval(updateTime, 3600000)
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.month-view {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.month-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.month-header {
  text-align: center;
  margin-bottom: 24px;
}

.month-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.current-date {
  color: #666;
  font-size: 16px;
}

.month-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.week-number {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  gap: 8px;
}

.week-number .label {
  font-size: 18px;
  color: #666;
}

.week-number .number {
  font-size: 32px;
  font-weight: bold;
  color: #42b983;
  text-shadow: 0 2px 4px rgba(66, 185, 131, 0.2);
}

.month-calendar {
  margin-top: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 8px;
}

.nav-button {
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #42b983;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-button:hover {
  background: #f0f9f5;
  transform: scale(1.1);
}

.month-year {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  border-radius: 6px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  text-align: center;
  padding: 12px 8px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day:hover {
  background: #f0f9f5;
  border-color: #42b983;
  transform: translateY(-1px);
}

.day.today {
  background: #42b983;
  color: white;
  border-color: #42b983;
  font-weight: bold;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.day.other-month {
  color: #ccc;
  background: #f8f9fa;
}

.day.other-month:hover {
  background: #f0f0f0;
  border-color: #ddd;
}

.day.weekend:not(.today):not(.other-month) {
  color: #e74c3c;
  background: #ffeaea;
}

.day.weekend:hover:not(.today):not(.other-month) {
  background: #fdd;
  border-color: #e74c3c;
}

.day-date {
  font-size: 16px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .month-view {
    padding: 16px;
  }
  
  .month-card {
    padding: 20px;
  }
  
  .week-number .number {
    font-size: 28px;
  }
  
  .calendar-days {
    gap: 2px;
  }
  
  .day {
    padding: 8px 4px;
    min-height: 40px;
  }
  
  .day-date {
    font-size: 14px;
  }
  
  .weekday {
    padding: 6px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .month-card {
    padding: 16px;
  }
  
  .calendar-header {
    margin-bottom: 16px;
  }
  
  .month-year {
    font-size: 16px;
  }
  
  .nav-button {
    font-size: 20px;
    padding: 6px 8px;
  }
  
  .day {
    min-height: 35px;
    padding: 6px 2px;
  }
  
  .day-date {
    font-size: 13px;
  }
}
</style>
