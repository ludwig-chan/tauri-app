<template>
  <div class="time-range-selector">
    <div class="quick-buttons">
      <button
        v-for="option in quickOptions"
        :key="option.value"
        :class="['quick-btn', { active: selectedRange === option.value }]"
        @click="selectQuickRange(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="showCustom" class="custom-range">
      <div class="custom-inputs">
        <div class="date-field">
          <label>开始日期</label>
          <input 
            type="date" 
            v-model="customStartDate"
            :max="customEndDate || undefined"
            class="date-input"
          />
        </div>
        <span class="date-separator">至</span>
        <div class="date-field">
          <label>结束日期</label>
          <input 
            type="date" 
            v-model="customEndDate"
            :min="customStartDate || undefined"
            :max="maxDate"
            class="date-input"
          />
        </div>
        <button @click="applyCustomRange" class="apply-btn">应用</button>
      </div>
    </div>

    <div class="range-info" v-if="currentRange">
      <span class="range-label">{{ currentRange.label }}:</span>
      <span class="range-dates">
        {{ formatRangeDisplay(currentRange.startDate, currentRange.endDate) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  type TimeRangeType, 
  type DateRange, 
  getDateRange, 
  getTodayDate,
  formatDateDisplay 
} from '../../utils/dateUtils'

interface QuickOption {
  value: TimeRangeType
  label: string
}

interface Props {
  modelValue?: TimeRangeType
  showCustomOption?: boolean
  initialRange?: TimeRangeType
}

const props = withDefaults(defineProps<Props>(), {
  showCustomOption: true,
  initialRange: 'today'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: TimeRangeType): void
  (e: 'change', range: DateRange): void
}>()

const selectedRange = ref<TimeRangeType>(props.initialRange)
const customStartDate = ref('')
const customEndDate = ref('')
const showCustom = computed(() => selectedRange.value === 'custom')
const maxDate = getTodayDate()

const quickOptions: QuickOption[] = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'week', label: '本周' },
  { value: 'last7days', label: '近7天' },
  { value: 'month', label: '本月' },
  { value: 'last30days', label: '近30天' },
  { value: 'year', label: '本年' },
]

if (props.showCustomOption) {
  quickOptions.push({ value: 'custom', label: '自定义' })
}

const currentRange = computed(() => {
  if (selectedRange.value === 'custom') {
    if (customStartDate.value && customEndDate.value) {
      return {
        startDate: customStartDate.value,
        endDate: customEndDate.value,
        label: '自定义'
      }
    }
    return null
  }
  return getDateRange(selectedRange.value)
})

function selectQuickRange(type: TimeRangeType) {
  selectedRange.value = type
  emit('update:modelValue', type)
  
  if (type !== 'custom') {
    const range = getDateRange(type)
    emit('change', range)
  }
}

function applyCustomRange() {
  if (customStartDate.value && customEndDate.value) {
    const range: DateRange = {
      startDate: customStartDate.value,
      endDate: customEndDate.value,
      label: '自定义'
    }
    emit('change', range)
  }
}

function formatRangeDisplay(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatDateDisplay(startDate)
  }
  return `${startDate} ~ ${endDate}`
}

// 初始化时触发一次 change
watch(() => selectedRange.value, () => {}, { immediate: true })

// 组件挂载时触发初始值
const range = getDateRange(props.initialRange)
emit('change', range)
</script>

<style scoped>
.time-range-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 10px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-btn:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.quick-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.custom-range {
  padding-top: 10px;
  border-top: 1px dashed #ddd;
}

.custom-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-field label {
  font-size: 12px;
  color: #666;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

.date-separator {
  color: #999;
  padding-bottom: 8px;
}

.apply-btn {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.apply-btn:hover {
  background: #5a6fd6;
}

.range-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.range-label {
  font-weight: 500;
}

.range-dates {
  color: #333;
}
</style>
