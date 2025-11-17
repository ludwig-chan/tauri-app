<template>
  <div class="random-alarm-container">
    <div class="header">
      <h2>随机闹钟</h2>
      <button @click="showAddDialog = true" class="add-btn">+ 添加闹钟</button>
    </div>

    <div class="alarm-list">
      <div v-if="alarms.length === 0" class="empty-state">
        <p>还没有设置任何闹钟</p>
        <p class="hint">点击"添加闹钟"开始设置随机提醒任务</p>
      </div>

      <div v-for="alarm in alarms" :key="alarm.id" class="alarm-card">
        <div class="alarm-header">
          <div class="alarm-info">
            <h3>{{ alarm.name }}</h3>
            <p class="alarm-meta">每天{{ alarm.daily_count }}次</p>
          </div>
          <div class="alarm-actions">
            <button 
              @click="toggleActive(alarm)" 
              :class="['toggle-btn', { active: alarm.is_active }]"
            >
              {{ alarm.is_active ? '已启用' : '已禁用' }}
            </button>
            <button @click="editAlarm(alarm)" class="edit-btn">编辑</button>
            <button @click="deleteAlarmConfirm(alarm.id!)" class="delete-btn">删除</button>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-bar-container">
            <div 
              class="progress-bar" 
              :style="{ width: getProgress(alarm) + '%' }"
            ></div>
          </div>
          <p class="progress-text">
            今日进度: {{ alarm.completed_today }} / {{ alarm.daily_count }}
            <span v-if="alarm.completed_today >= alarm.daily_count" class="completed-badge">✓ 已完成</span>
          </p>
        </div>

        <div v-if="alarm.is_active" class="alarm-controls">
          <button 
            @click="triggerReminder(alarm)" 
            class="trigger-btn"
            :disabled="alarm.completed_today >= alarm.daily_count"
          >
            {{ alarm.completed_today >= alarm.daily_count ? '今日已完成' : '手动触发提醒' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑闹钟对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <h3>{{ editingAlarm ? '编辑闹钟' : '添加闹钟' }}</h3>
        <div class="form-group">
          <label>事件名称</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="例如: 喝水、提肛、休息眼睛"
            @keyup.enter="saveAlarm"
          />
        </div>
        <div class="form-group">
          <label>每天提醒次数</label>
          <input 
            v-model.number="formData.dailyCount" 
            type="number" 
            min="1" 
            max="20"
            @keyup.enter="saveAlarm"
          />
        </div>
        <div class="dialog-actions">
          <button @click="closeDialog" class="cancel-btn">取消</button>
          <button @click="saveAlarm" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 提醒弹窗 -->
    <div v-if="showReminder" class="reminder-overlay">
      <div class="reminder-dialog">
        <h2>⏰ 提醒</h2>
        <p class="reminder-text">该{{ currentReminder?.name }}啦！</p>
        <div class="reminder-actions">
          <button @click="completeTask" class="complete-btn">✓ 完成</button>
          <button @click="snoozeTask" class="snooze-btn">稍后提醒</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  initializeRandomAlarmTables,
  getAllAlarms,
  addAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarmActive,
  completeReminder,
  resetDailyCount,
  type RandomAlarm
} from '../utils/randomAlarmDb'

const alarms = ref<RandomAlarm[]>([])
const showAddDialog = ref(false)
const showReminder = ref(false)
const editingAlarm = ref<RandomAlarm | null>(null)
const currentReminder = ref<RandomAlarm | null>(null)

const formData = ref({
  name: '',
  dailyCount: 5
})

let reminderTimers: Map<number, number[]> = new Map()
let resetTimer: number | null = null

onMounted(async () => {
  await initializeRandomAlarmTables()
  await loadAlarms()
  await resetDailyCount()
  scheduleAllReminders()
  scheduleResetTimer()
})

onUnmounted(() => {
  clearAllTimers()
})

async function loadAlarms() {
  alarms.value = await getAllAlarms()
}

function getProgress(alarm: RandomAlarm): number {
  return Math.min((alarm.completed_today / alarm.daily_count) * 100, 100)
}

function editAlarm(alarm: RandomAlarm) {
  editingAlarm.value = alarm
  formData.value = {
    name: alarm.name,
    dailyCount: alarm.daily_count
  }
  showAddDialog.value = true
}

async function saveAlarm() {
  if (!formData.value.name.trim()) {
    alert('请输入事件名称')
    return
  }
  
  if (formData.value.dailyCount < 1 || formData.value.dailyCount > 20) {
    alert('每天提醒次数应在1-20之间')
    return
  }

  try {
    if (editingAlarm.value) {
      await updateAlarm(editingAlarm.value.id!, formData.value.name, formData.value.dailyCount)
    } else {
      await addAlarm(formData.value.name, formData.value.dailyCount)
    }
    await loadAlarms()
    closeDialog()
    scheduleAllReminders()
  } catch (error) {
    console.error('保存闹钟失败:', error)
    alert('保存失败，请重试')
  }
}

function closeDialog() {
  showAddDialog.value = false
  editingAlarm.value = null
  formData.value = {
    name: '',
    dailyCount: 5
  }
}

async function toggleActive(alarm: RandomAlarm) {
  await toggleAlarmActive(alarm.id!, !alarm.is_active)
  await loadAlarms()
  scheduleAllReminders()
}

async function deleteAlarmConfirm(id: number) {
  if (confirm('确定要删除这个闹钟吗？')) {
    await deleteAlarm(id)
    await loadAlarms()
    scheduleAllReminders()
  }
}

function triggerReminder(alarm: RandomAlarm) {
  if (alarm.completed_today >= alarm.daily_count) return
  currentReminder.value = alarm
  showReminder.value = true
}

async function completeTask() {
  if (currentReminder.value) {
    await completeReminder(currentReminder.value.id!)
    await loadAlarms()
  }
  showReminder.value = false
  currentReminder.value = null
}

function snoozeTask() {
  if (currentReminder.value) {
    // 15分钟后再次提醒
    setTimeout(() => {
      if (currentReminder.value) {
        showReminder.value = true
      }
    }, 15 * 60 * 1000)
  }
  showReminder.value = false
}

function scheduleAllReminders() {
  clearAllTimers()
  
  const activeAlarms = alarms.value.filter(a => a.is_active)
  
  activeAlarms.forEach(alarm => {
    const remaining = alarm.daily_count - alarm.completed_today
    if (remaining <= 0) return
    
    const times = generateRandomTimes(remaining)
    const timers: number[] = []
    
    times.forEach(time => {
      const now = new Date()
      const targetTime = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      targetTime.setHours(hours, minutes, 0, 0)
      
      if (targetTime > now) {
        const delay = targetTime.getTime() - now.getTime()
        const timer = window.setTimeout(() => {
          triggerReminder(alarm)
        }, delay)
        timers.push(timer)
      }
    })
    
    reminderTimers.set(alarm.id!, timers)
  })
}

function generateRandomTimes(count: number): string[] {
  const times: string[] = []
  const workHoursStart = 8 // 8:00
  const workHoursEnd = 22 // 22:00
  const totalMinutes = (workHoursEnd - workHoursStart) * 60
  
  const usedMinutes = new Set<number>()
  
  for (let i = 0; i < count; i++) {
    let randomMinute: number
    do {
      randomMinute = Math.floor(Math.random() * totalMinutes)
    } while (usedMinutes.has(randomMinute))
    
    usedMinutes.add(randomMinute)
    const hours = workHoursStart + Math.floor(randomMinute / 60)
    const minutes = randomMinute % 60
    times.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  return times.sort()
}

function clearAllTimers() {
  reminderTimers.forEach(timers => {
    timers.forEach(timer => clearTimeout(timer))
  })
  reminderTimers.clear()
}

function scheduleResetTimer() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const delay = tomorrow.getTime() - now.getTime()
  
  resetTimer = window.setTimeout(async () => {
    await resetDailyCount()
    await loadAlarms()
    scheduleAllReminders()
    scheduleResetTimer()
  }, delay)
}
</script>

<style scoped>
.random-alarm-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h2 {
  color: #333;
  font-size: 28px;
  margin: 0;
}

.add-btn {
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #35a372;
}

.alarm-list {
  display: grid;
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 10px 0;
}

.hint {
  font-size: 14px;
}

.alarm-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.alarm-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 20px;
}

.alarm-meta {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.alarm-actions {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.edit-btn {
  background: #f0f0f0;
  color: #333;
}

.edit-btn:hover {
  background: #e0e0e0;
}

.delete-btn {
  background: #fee;
  color: #c33;
}

.delete-btn:hover {
  background: #fdd;
}

.progress-section {
  margin: 15px 0;
}

.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #35a372);
  transition: width 0.3s ease;
}

.progress-text {
  color: #666;
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.completed-badge {
  background: #42b983;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.alarm-controls {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.trigger-btn {
  padding: 8px 16px;
  background: #6c9ef8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.trigger-btn:hover:not(:disabled) {
  background: #5a8ee6;
}

.trigger-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 22px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #42b983;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.cancel-btn, .save-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #42b983;
  color: white;
}

.save-btn:hover {
  background: #35a372;
}

/* 提醒弹窗样式 */
.reminder-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reminder-dialog {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.reminder-dialog h2 {
  margin: 0 0 20px 0;
  font-size: 32px;
}

.reminder-text {
  font-size: 20px;
  color: #333;
  margin: 0 0 30px 0;
}

.reminder-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.complete-btn, .snooze-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  transition: all 0.2s;
}

.complete-btn {
  background: #42b983;
  color: white;
}

.complete-btn:hover {
  background: #35a372;
  transform: scale(1.05);
}

.snooze-btn {
  background: #f0f0f0;
  color: #666;
}

.snooze-btn:hover {
  background: #e0e0e0;
}
</style>
