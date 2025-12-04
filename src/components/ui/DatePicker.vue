<template>
  <div class="date-picker-container" ref="wrapperRef">
    <span class="current-date" @click="togglePicker">
      {{ displayDate }}
      <span class="date-picker-icon">📅</span>
    </span>
    <div class="date-picker-dropdown" v-if="showPicker" @click.stop>
      <div class="picker-header">
        <button class="picker-nav" @click="pickerNavigate(-1)">←</button>
        <span class="picker-title">{{ pickerTitle }}</span>
        <button class="picker-nav" @click="pickerNavigate(1)">→</button>
      </div>
      <div class="picker-grid" v-if="mode === 'daily'">
        <div class="picker-weekdays">
          <span v-for="day in ['一', '二', '三', '四', '五', '六', '日']" :key="day">{{ day }}</span>
        </div>
        <div class="picker-days">
          <button
            v-for="day in calendarDays"
            :key="day.date"
            :class="['picker-day', { 
              other: day.otherMonth, 
              selected: day.selected,
              today: day.today 
            }]"
            @click="selectDate(day.date)"
          >
            {{ day.dayNum }}
          </button>
        </div>
      </div>
      <div class="picker-list" v-else-if="mode === 'weekly'">
        <button
          v-for="week in weekOptions"
          :key="week.value"
          :class="['picker-week', { selected: week.selected, current: week.current }]"
          @click="selectWeek(week.value)"
        >
          {{ week.label }}
        </button>
      </div>
      <div class="picker-list" v-else>
        <button
          v-for="month in monthOptions"
          :key="month.value"
          :class="['picker-month', { selected: month.selected, current: month.current }]"
          @click="selectMonth(month.value)"
        >
          {{ month.label }}
        </button>
      </div>
      <div class="picker-footer">
        <button class="today-btn" @click="goToToday">{{ todayButtonText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export type DatePickerMode = 'daily' | 'weekly' | 'monthly'

const props = withDefaults(defineProps<{
  modelValue: Date
  mode?: DatePickerMode
}>(), {
  mode: 'daily'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void
}>()

const showPicker = ref(false)
const pickerDate = ref(new Date())
const wrapperRef = ref<HTMLElement | null>(null)

// 显示的日期文本
const displayDate = computed(() => {
  const date = props.modelValue
  switch (props.mode) {
    case 'daily':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    case 'weekly':
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekStart.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`
    case 'monthly':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
      })
    default:
      return ''
  }
})

// 选择器标题
const pickerTitle = computed(() => {
  const date = pickerDate.value
  if (props.mode === 'monthly') {
    return `${date.getFullYear()}年`
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

// 获取周一
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

// 获取一年中的第几周
function getWeekNumber(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 获取本地日期字符串 (避免时区问题)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// “今天”按钮文本
const todayButtonText = computed(() => {
  switch (props.mode) {
    case 'daily':
      return '今天'
    case 'weekly':
      return '本周'
    case 'monthly':
      return '本月'
    default:
      return '今天'
  }
})

// 日历天数
const calendarDays = computed(() => {
  const year = pickerDate.value.getFullYear()
  const month = pickerDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Array<{ date: string; dayNum: number; otherMonth: boolean; selected: boolean; today: boolean }> = []
  
  // 填充上月的日期
  const startDay = firstDay.getDay() || 7
  for (let i = startDay - 1; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    days.push({
      date: getLocalDateString(d),
      dayNum: d.getDate(),
      otherMonth: true,
      selected: false,
      today: false
    })
  }
  
  // 本月日期
  const today = getLocalDateString(new Date())
  const selected = getLocalDateString(props.modelValue)
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const dateStr = getLocalDateString(d)
    days.push({
      date: dateStr,
      dayNum: i,
      otherMonth: false,
      selected: dateStr === selected,
      today: dateStr === today
    })
  }
  
  // 填充下月日期
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: getLocalDateString(d),
      dayNum: i,
      otherMonth: true,
      selected: false,
      today: false
    })
  }
  
  return days
})

// 周选项
const weekOptions = computed(() => {
  const year = pickerDate.value.getFullYear()
  const month = pickerDate.value.getMonth()
  const weeks: Array<{ value: string; label: string; selected: boolean; current: boolean }> = []
  
  const currentWeekStart = getLocalDateString(getWeekStart(props.modelValue))
  const thisWeekStart = getLocalDateString(getWeekStart(new Date()))
  
  // 获取该月所有周
  let d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    const weekStart = getWeekStart(d)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekKey = getLocalDateString(weekStart)
    const weekNum = getWeekNumber(weekStart)
    
    if (!weeks.find(w => w.value === weekKey)) {
      weeks.push({
        value: weekKey,
        label: `第${weekNum}周 (${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()})`,
        selected: weekKey === currentWeekStart,
        current: weekKey === thisWeekStart
      })
    }
    d.setDate(d.getDate() + 7)
  }
  
  return weeks
})

// 月选项
const monthOptions = computed(() => {
  const year = pickerDate.value.getFullYear()
  const months: Array<{ value: string; label: string; selected: boolean; current: boolean }> = []
  
  const currentMonthKey = `${props.modelValue.getFullYear()}-${String(props.modelValue.getMonth() + 1).padStart(2, '0')}`
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  for (let i = 0; i < 12; i++) {
    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
    months.push({
      value: monthKey,
      label: `${i + 1}月`,
      selected: monthKey === currentMonthKey,
      current: monthKey === thisMonthKey
    })
  }
  
  return months
})

// 切换选择器
function togglePicker() {
  showPicker.value = !showPicker.value
  if (showPicker.value) {
    pickerDate.value = new Date(props.modelValue)
  }
}

// 选择器导航
function pickerNavigate(direction: number) {
  const date = new Date(pickerDate.value)
  if (props.mode === 'monthly') {
    date.setFullYear(date.getFullYear() + direction)
  } else {
    date.setMonth(date.getMonth() + direction)
  }
  pickerDate.value = date
}

// 选择日期
function selectDate(dateStr: string) {
  emit('update:modelValue', new Date(dateStr))
  showPicker.value = false
}

// 选择周
function selectWeek(weekStart: string) {
  emit('update:modelValue', new Date(weekStart))
  showPicker.value = false
}

// 选择月
function selectMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  emit('update:modelValue', new Date(year, month - 1, 1))
  showPicker.value = false
}

// 回到今天
function goToToday() {
  emit('update:modelValue', new Date())
  showPicker.value = false
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (wrapperRef.value && !wrapperRef.value.contains(target)) {
    showPicker.value = false
  }
}

// 监听 mode 变化时重置 pickerDate
watch(() => props.mode, () => {
  pickerDate.value = new Date(props.modelValue)
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.date-picker-container {
  display: inline-block;
  position: relative;
}

.current-date {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  min-width: 200px;
  text-align: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.current-date:hover {
  background: #f0f0f0;
}

.date-picker-icon {
  font-size: 14px;
  opacity: 0.6;
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 200;
  padding: 12px;
  min-width: 280px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.picker-nav {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.picker-nav:hover {
  background: #42b983;
  color: #fff;
}

.picker-title {
  font-weight: 500;
  color: #333;
}

.picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.picker-weekdays span {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}

.picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.picker-day {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #333;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.picker-day:hover {
  background: #e9ecef;
}

.picker-day.other {
  color: #ccc;
}

.picker-day.today {
  border: 1px solid #42b983;
  color: #42b983;
}

.picker-day.selected {
  background: #42b983;
  color: #fff;
}

.picker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.picker-week,
.picker-month {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.picker-week:hover,
.picker-month:hover {
  border-color: #42b983;
  color: #42b983;
}

.picker-week.current,
.picker-month.current {
  border-color: #42b983;
  color: #42b983;
  font-weight: 500;
}

.picker-week.selected,
.picker-month.selected {
  background: #42b983;
  border-color: #42b983;
  color: #fff;
}

.picker-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.today-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 16px;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.today-btn:hover {
  background: #369970;
}
</style>
