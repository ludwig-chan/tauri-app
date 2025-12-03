<template>
  <div class="month-view">
    <div class="month-card">
      <div class="month-calendar">
        <div class="calendar-header">
          <button @click="previousMonth" class="nav-button">‹</button>
          <div class="month-year">{{ currentMonthYear }}</div>
          <button @click="nextMonth" class="nav-button">›</button>
        </div>
        
        <div class="calendar-weekdays">
          <div class="week-label-header">周数</div>
          <div v-for="weekday in weekdays" :key="weekday" class="weekday">
            {{ weekday }}
          </div>
        </div>
        
        <div class="calendar-grid">
          <template v-for="(week, weekIndex) in weekRows" :key="weekIndex">
            <div 
              class="week-label clickable" 
              @click="openWeekMenu(week, $event)"
              :title="`点击记录第${week.weekNumber}周周记`"
            >第{{ week.weekNumber }}周</div>
            <div 
              v-for="day in week.days" 
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
              @click="openActionMenu(day.fullDate, $event)"
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
          </template>
        </div>
      </div>
    </div>

    <!-- 日期操作选择弹窗 -->
    <div v-if="showActionMenu" class="action-menu-overlay" @click="closeActionMenu">
      <div class="action-menu" :style="menuPosition" @click.stop>
        <div class="action-menu-header">
          <span>{{ formatSelectedDate }}</span>
          <button class="close-btn" @click="closeActionMenu">×</button>
        </div>
        <div class="action-menu-options">
          <button class="action-option" @click="createJournal">
            <span class="option-icon">📝</span>
            <span class="option-text">新建日记</span>
          </button>
          <button class="action-option" @click="createTodo">
            <span class="option-icon">✅</span>
            <span class="option-text">新建待办</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 周记操作弹窗 -->
    <div v-if="showWeekMenu" class="action-menu-overlay" @click="closeWeekMenu">
      <div class="action-menu" :style="weekMenuPosition" @click.stop>
        <div class="action-menu-header">
          <span>第{{ selectedWeek?.weekNumber }}周</span>
          <button class="close-btn" @click="closeWeekMenu">×</button>
        </div>
        <div class="action-menu-options">
          <button class="action-option" @click="createWeeklyJournal">
            <span class="option-icon">📓</span>
            <span class="option-text">新建周记</span>
          </button>
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
import { useRouter } from 'vue-router'
import TodoDialog from '../components/ui/TodoDialog.vue'
import { todoStore } from '../utils/todoStore'
import type { TodoItem } from '../utils/todoStore'

const router = useRouter()
const currentDate = ref(new Date())
const displayDate = ref(new Date()) // 用于显示的月份，可以通过按钮切换

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedDate = ref<Date | null>(null)

// 操作选择菜单状态
const showActionMenu = ref(false)
const menuPosition = ref({ top: '50%', left: '50%' })

// 周记菜单状态
const showWeekMenu = ref(false)
const weekMenuPosition = ref({ top: '50%', left: '50%' })
const selectedWeek = ref<{ weekNumber: number; days: any[] } | null>(null)

const { initializeTodos, getTodosForDate } = todoStore

// 初始化并加载待办事项
onMounted(async () => {
  try {
    await initializeTodos()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 打开操作选择菜单
const openActionMenu = (date: Date, event: MouseEvent) => {
  selectedDate.value = date
  
  // 计算菜单位置，让它显示在点击位置附近
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 150
  
  let left = rect.left + rect.width / 2
  let top = rect.bottom + 8
  
  // 确保菜单不会超出屏幕
  if (left + menuWidth / 2 > window.innerWidth) {
    left = window.innerWidth - menuWidth / 2 - 20
  }
  if (left - menuWidth / 2 < 0) {
    left = menuWidth / 2 + 20
  }
  if (top + menuHeight > window.innerHeight) {
    top = rect.top - menuHeight - 8
  }
  
  menuPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  }
  
  showActionMenu.value = true
}

// 关闭操作选择菜单
const closeActionMenu = () => {
  showActionMenu.value = false
}

// 创建日记
const createJournal = () => {
  if (selectedDate.value) {
    // 使用本地日期格式，避免时区转换问题
    const year = selectedDate.value.getFullYear()
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.value.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    router.push({ path: '/journal', query: { date: dateStr, type: 'daily' } })
  }
  closeActionMenu()
}

// 创建待办
const createTodo = () => {
  closeActionMenu()
  dialogVisible.value = true
}

// 打开周记菜单
const openWeekMenu = (week: { weekNumber: number; days: any[] }, event: MouseEvent) => {
  selectedWeek.value = week
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 100
  
  let left = rect.left + rect.width / 2
  let top = rect.bottom + 8
  
  if (left + menuWidth / 2 > window.innerWidth) {
    left = window.innerWidth - menuWidth / 2 - 20
  }
  if (left - menuWidth / 2 < 0) {
    left = menuWidth / 2 + 20
  }
  if (top + menuHeight > window.innerHeight) {
    top = rect.top - menuHeight - 8
  }
  
  weekMenuPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  }
  
  showWeekMenu.value = true
}

// 关闭周记菜单
const closeWeekMenu = () => {
  showWeekMenu.value = false
}

// 创建周记
const createWeeklyJournal = () => {
  if (selectedWeek.value && selectedWeek.value.days.length > 0) {
    // 使用这一周的第一天（周一）作为日期
    const firstDay = selectedWeek.value.days[0].fullDate
    const year = firstDay.getFullYear()
    const month = String(firstDay.getMonth() + 1).padStart(2, '0')
    const day = String(firstDay.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    router.push({ path: '/journal', query: { date: dateStr, type: 'weekly' } })
  }
  closeWeekMenu()
}

// 格式化选中的日期
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 处理待办事项添加完成
const handleTodoAdded = (newTodo: TodoItem) => {
  console.log('新待办事项已添加:', newTodo)
  // 不需要手动更新列表，因为使用了共享状态管理
}

// 获取当前年份的第几周（ISO 8601标准）
const getWeekNumber = (date: Date): number => {
  // 创建日期副本，避免修改原始日期
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // 获取当前日期是周几（0=周日, 1=周一, ..., 6=周六）
  const dayNum = target.getDay() || 7 // 将周日的0转换为7
  
  // 设置到本周的周四
  target.setDate(target.getDate() + 4 - dayNum)
  
  // 获取当年的1月1日
  const yearStart = new Date(target.getFullYear(), 0, 1)
  
  // 计算周数：从年初到当前周四的天数差 / 7，向上取整
  const weekNumber = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  
  return weekNumber
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

// 将日期按周分组，并计算每周的周数
const weekRows = computed(() => {
  const days = monthDays.value
  const weeks = []
  
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    // 使用这一周的第一天（周一）来计算周数
    const weekNumber = getWeekNumber(weekDays[0].fullDate)
    weeks.push({
      weekNumber,
      days: weekDays
    })
  }
  
  return weeks
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
  height: calc(100vh - 150px); /* 减去标题栏48px + 导航栏47px + 内容padding40px */
  /* 使用 flex 布局让视图根据父容器撑满空间，避免硬编码高度导致溢出 */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.month-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.month-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
  grid-template-columns: 55px repeat(7, 1fr);
  gap: 3px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.week-label-header {
  text-align: center;
  padding: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  border-radius: 6px;
}

.weekday {
  text-align: center;
  padding: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #f8f9fa;
  border-radius: 6px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 55px repeat(7, 1fr);
  gap: 3px;
  flex: 1;
  overflow: hidden;
  grid-auto-rows: minmax(0, 1fr);
}

.week-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #42b983;
  background: #f0f9f5;
  border-radius: 6px;
  border: 1px solid #e0f2e9;
  padding: 2px;
}

.week-label.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.week-label.clickable:hover {
  background: #42b983;
  color: white;
  border-color: #42b983;
  transform: scale(1.02);
}

.day {
  text-align: center;
  padding: 4px 4px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  overflow: hidden;
  min-height: 0;
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
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
  flex-shrink: 0;
}

.day-todos {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  align-items: center;
  overflow: hidden;
  flex: 1;
  min-height: 0;
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

/* 操作选择菜单样式 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.action-menu {
  position: fixed;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  animation: menuSlideIn 0.2s ease-out;
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.action-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.action-menu-header .close-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #e9ecef;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-menu-header .close-btn:hover {
  background: #dee2e6;
  color: #333;
}

.action-menu-options {
  padding: 8px;
}

.action-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-option:hover {
  background: #f0f9f5;
}

.action-option .option-icon {
  font-size: 20px;
}

.action-option .option-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

@media (max-width: 768px) {
  .month-view {
    padding: 12px;
    flex: 1;
    min-height: 0;
  }
  
  .month-card {
    padding: 12px;
  }
  
  .calendar-weekdays {
    gap: 2px;
    grid-template-columns: 50px repeat(7, 1fr);
  }
  
  .calendar-grid {
    gap: 2px;
    grid-template-columns: 50px repeat(7, 1fr);
  }
  
  .week-label-header {
    padding: 4px;
    font-size: 11px;
  }
  
  .week-label {
    font-size: 10px;
    padding: 2px;
  }
  
  .day {
    padding: 3px 2px;
  }
  
  .day-date {
    font-size: 13px;
  }
  
  .todo-item {
    font-size: 8px;
    padding: 1px 2px;
  }
  
  .weekday {
    padding: 4px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .month-view {
    flex: 1;
    min-height: 0;
  }
  
  .month-card {
    padding: 10px;
  }
  
  .calendar-header {
    margin-bottom: 8px;
  }
  
  .calendar-weekdays {
    grid-template-columns: 45px repeat(7, 1fr);
  }
  
  .calendar-grid {
    grid-template-columns: 45px repeat(7, 1fr);
  }
  
  .week-label-header {
    padding: 4px 2px;
    font-size: 10px;
  }
  
  .week-label {
    font-size: 9px;
    padding: 2px 1px;
  }
  
  .month-year {
    font-size: 15px;
  }
  
  .nav-button {
    font-size: 18px;
    padding: 4px 6px;
  }
  
  .day {
    padding: 2px 1px;
  }
  
  .day-date {
    font-size: 12px;
  }
  
  .todo-item {
    font-size: 7px;
    padding: 1px 2px;
  }
  
  .more-todos {
    font-size: 7px;
  }
}
</style>
