<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-content" @click.stop>
      <h2 class="dialog-title">{{ habit ? '编辑习惯' : '新建习惯' }}</h2>
      
      <form @submit.prevent="handleSubmit" class="habit-form">
        <!-- 习惯名称 -->
        <div class="form-group">
          <label for="name">习惯名称 *</label>
          <input 
            id="name"
            v-model="formData.name" 
            type="text" 
            required
            placeholder="例如：每天读书30分钟"
          />
        </div>

        <!-- 描述 -->
        <div class="form-group">
          <label for="description">描述</label>
          <textarea 
            id="description"
            v-model="formData.description" 
            rows="3"
            placeholder="添加一些备注..."
          />
        </div>

        <!-- 开始日期和结束日期 -->
        <div class="form-row">
          <div class="form-group">
            <label for="start-date">开始日期 *</label>
            <input 
              id="start-date"
              v-model="formData.start_date" 
              type="date" 
              required
            />
          </div>
          <div class="form-group">
            <label for="end-date">结束日期</label>
            <input 
              id="end-date"
              v-model="formData.end_date" 
              type="date"
              :min="formData.start_date"
            />
            <small>留空表示无限期</small>
          </div>
        </div>

        <!-- 重复周期 -->
        <div class="form-row">
          <div class="form-group">
            <label for="recurrence-type">重复周期 *</label>
            <select id="recurrence-type" v-model="formData.recurrence_type" required>
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div class="form-group">
            <label for="recurrence-interval">间隔 *</label>
            <input 
              id="recurrence-interval"
              v-model.number="formData.recurrence_interval" 
              type="number" 
              min="1"
              required
            />
            <small>{{ getIntervalText }}</small>
          </div>
        </div>

        <!-- 时段选择 -->
        <div class="form-group">
          <label>完成时段</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="morning" 
                v-model="selectedTimePeriods"
              />
              <span>早上 (6:00-12:00)</span>
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="afternoon" 
                v-model="selectedTimePeriods"
              />
              <span>下午 (12:00-18:00)</span>
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="evening" 
                v-model="selectedTimePeriods"
              />
              <span>晚上 (18:00-24:00)</span>
            </label>
          </div>
          <small>不选择表示全天任意时间完成即可</small>
        </div>

        <!-- 提醒时间 -->
        <div class="form-group">
          <label>提醒时间</label>
          <div class="reminder-times">
            <div v-for="(time, index) in reminderTimes" :key="index" class="reminder-item">
              <input 
                v-model="reminderTimes[index]" 
                type="time"
                class="time-input"
              />
              <button 
                type="button" 
                class="remove-btn"
                @click="removeReminderTime(index)"
                v-if="reminderTimes.length > 1"
              >
                ✕
              </button>
            </div>
            <button 
              type="button" 
              class="add-time-btn"
              @click="addReminderTime"
            >
              + 添加提醒时间
            </button>
          </div>
        </div>

        <!-- 是否激活 -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.is_active" />
            <span>激活此习惯</span>
          </label>
        </div>

        <!-- 操作按钮 -->
        <div class="dialog-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">取消</button>
          <button type="submit" class="submit-btn">{{ habit ? '保存' : '创建' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Habit } from '../../utils/habitDb'

interface Props {
  visible: boolean
  habit: Habit | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>]
}>()

const formData = ref({
  name: '',
  description: null as string | null,
  start_date: new Date().toISOString().split('T')[0],
  end_date: null as string | null,
  recurrence_type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'hourly',
  recurrence_interval: 1,
  is_active: true
})

const selectedTimePeriods = ref<string[]>([])
const reminderTimes = ref<string[]>(['08:00'])

// 监听habit变化，填充表单
watch(() => props.habit, (newHabit) => {
  if (newHabit) {
    formData.value = {
      name: newHabit.name,
      description: newHabit.description,
      start_date: newHabit.start_date,
      end_date: newHabit.end_date,
      recurrence_type: newHabit.recurrence_type,
      recurrence_interval: newHabit.recurrence_interval,
      is_active: newHabit.is_active
    }
    selectedTimePeriods.value = newHabit.time_periods 
      ? JSON.parse(newHabit.time_periods) 
      : []
    reminderTimes.value = newHabit.reminder_times 
      ? JSON.parse(newHabit.reminder_times) 
      : ['08:00']
  } else {
    // 重置表单
    formData.value = {
      name: '',
      description: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      recurrence_type: 'daily',
      recurrence_interval: 1,
      is_active: true
    }
    selectedTimePeriods.value = []
    reminderTimes.value = ['08:00']
  }
}, { immediate: true })

const getIntervalText = computed(() => {
  const interval = formData.value.recurrence_interval
  const type = formData.value.recurrence_type
  const typeText = {
    hourly: '小时',
    daily: '天',
    weekly: '周',
    monthly: '月'
  }
  return `每${interval > 1 ? interval : ''}${typeText[type]}`
})

const addReminderTime = () => {
  reminderTimes.value.push('12:00')
}

const removeReminderTime = (index: number) => {
  reminderTimes.value.splice(index, 1)
}

const handleOverlayClick = () => {
  emit('close')
}

const handleSubmit = () => {
  const habitData = {
    ...formData.value,
    time_periods: selectedTimePeriods.value.length > 0 
      ? JSON.stringify(selectedTimePeriods.value) 
      : null,
    reminder_times: reminderTimes.value.filter(t => t).length > 0
      ? JSON.stringify(reminderTimes.value.filter(t => t))
      : null
  }
  emit('save', habitData)
}
</script>

<style scoped>
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
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-title {
  font-size: 24px;
  margin: 0 0 24px 0;
  color: #2c3e50;
}

.habit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

input[type="text"],
input[type="date"],
input[type="number"],
input[type="time"],
select,
textarea {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #42b983;
}

textarea {
  resize: vertical;
}

small {
  color: #7f8c8d;
  font-size: 12px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.reminder-times {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminder-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.time-input {
  flex: 1;
}

.remove-btn {
  padding: 6px 10px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.remove-btn:hover {
  background: #c0392b;
}

.add-time-btn {
  padding: 8px 12px;
  background: #ecf0f1;
  color: #2c3e50;
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.add-time-btn:hover {
  background: #e0e6e8;
  border-color: #95a5a6;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: #ecf0f1;
  color: #2c3e50;
}

.cancel-btn:hover {
  background: #d5dbdb;
}

.submit-btn {
  background: #42b983;
  color: white;
}

.submit-btn:hover {
  background: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    padding: 24px;
  }
}
</style>
