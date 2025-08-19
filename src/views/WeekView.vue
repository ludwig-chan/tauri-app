<template>
  <div class="month-view">
    <div class="month-card">
      <div class="month-header">
        <div class="header-left">
          <h2>📅 月历视图</h2>
          <div class="current-date">{{ formatDate(currentDate) }}</div>
        </div>
        <div class="week-info">
          <div class="week-number">
            <span class="label">第</span>
            <span class="number">{{ weekNumber }}</span>
            <span class="label">周</span>
          </div>
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
        
        <div class="calendar-days" :style="{ gridTemplateRows: `repeat(${calendarRows}, 1fr)` }">
          <div 
            v-for="day in monthDays" 
            :key="day.key"
            :class="[
              'day', 
              { 
                'today': day.isToday,
                'other-month': day.isOtherMonth,
                'weekend': day.isWeekend,
                'has-todos': getTodosForDate(day.fullDate).length > 0
              }
            ]"
            @click="openTodoDialog(day.fullDate)"
          >
            <div class="day-date">{{ day.date }}</div>
            <div class="day-todos">
              <div 
                v-for="todo in getTodosForDate(day.fullDate).slice(0, 2)" 
                :key="todo.id"
                :class="['todo-item', { 'completed': todo.completed }]"
                :title="todo.content"
              >
                {{ todo.content.length > 10 ? todo.content.substring(0, 10) + '...' : todo.content }}
              </div>
              <div 
                v-if="getTodosForDate(day.fullDate).length > 2" 
                class="more-todos"
                :title="`还有 ${getTodosForDate(day.fullDate).length - 2} 个待办事项`"
              >
                +{{ getTodosForDate(day.fullDate).length - 2 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 待办事项添加弹窗 -->
    <TodoDialog 
      v-model:visible="dialogVisible"
      :selected-date="selectedDate"
      @todo-added="handleTodoAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TodoDialog from '../components/ui/TodoDialog.vue'
import { todoStore } from '../utils/todoStore'
import type { TodoItem } from '../utils/todoStore'

const currentDate = ref(new Date())
const displayDate = ref(new Date()) // 用于显示的月份，可以通过按钮切换

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedDate = ref<Date | null>(null)

// 使用共享的待办事项状态
const { initializeTodos, getTodosForDate } = todoStore

// 初始化并加载待办事项
onMounted(async () => {
  try {
    await initializeTodos()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 打开待办事项添加弹窗
const openTodoDialog = (date: Date) => {
  selectedDate.value = date
  dialogVisible.value = true
}

// 处理待办事项添加完成
const handleTodoAdded = (newTodo: TodoItem) => {
  console.log('新待办事项已添加:', newTodo)
  // 不需要手动更新列表，因为使用了共享状态管理
}

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

// 计算当前月份需要的行数
const calendarRows = computed(() => {
  const days = monthDays.value
  return Math.ceil(days.length / 7)
})

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
  margin: 0 auto;
  height: calc(100vh - 120px); /* 减去导航栏和padding的高度 */
  display: flex;
  flex-direction: column;
}

.month-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.header-left h2 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.current-date {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.week-info {
  display: flex;
  align-items: center;
}

.week-number {
  display: flex;
  align-items: center;
  gap: 4px;
}

.week-number .label {
  font-size: 14px;
  color: #666;
}

.week-number .number {
  font-size: 24px;
  font-weight: bold;
  color: #42b983;
  text-shadow: 0 1px 2px rgba(66, 185, 131, 0.2);
}

.month-calendar {
  margin-top: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 8px;
  flex-shrink: 0;
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
  flex-shrink: 0;
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
  flex: 1;
  overflow: hidden;
}

.day {
  text-align: center;
  padding: 8px 6px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  overflow: hidden;
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
  transform: scale(1.02);
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

.day.has-todos {
  border-left: 3px solid #42b983;
}

.day-date {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.day-todos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  align-items: center;
}

.todo-item {
  font-size: 10px;
  background: rgba(66, 185, 131, 0.1);
  color: #2c5530;
  padding: 2px 4px;
  border-radius: 3px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(66, 185, 131, 0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-item.completed {
  background: rgba(136, 136, 136, 0.1);
  color: #888;
  text-decoration: line-through;
  border-color: rgba(136, 136, 136, 0.2);
}

.day.today .todo-item {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.more-todos {
  font-size: 9px;
  color: #666;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 2px;
}

.day.today .more-todos {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

@media (max-width: 768px) {
  .month-view {
    padding: 16px;
    height: calc(100vh - 100px);
  }
  
  .month-card {
    padding: 20px;
  }
  
  .month-header {
    margin-bottom: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header-left h2 {
    font-size: 18px;
  }
  
  .week-number .number {
    font-size: 20px;
  }
  
  .week-number .label {
    font-size: 12px;
  }
  
  .calendar-days {
    gap: 2px;
  }
  
  .day {
    padding: 6px 4px;
  }
  
  .day-date {
    font-size: 14px;
  }
  
  .todo-item {
    font-size: 9px;
    padding: 1px 3px;
  }
  
  .weekday {
    padding: 6px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .month-view {
    height: calc(100vh - 80px);
  }
  
  .month-card {
    padding: 16px;
  }
  
  .month-header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }
  
  .header-left h2 {
    font-size: 16px;
  }
  
  .current-date {
    font-size: 12px;
  }
  
  .week-number .number {
    font-size: 18px;
  }
  
  .week-number .label {
    font-size: 11px;
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
    padding: 4px 2px;
  }
  
  .day-date {
    font-size: 13px;
  }
  
  .todo-item {
    font-size: 8px;
    padding: 1px 2px;
  }
  
  .more-todos {
    font-size: 8px;
  }
}
</style>
