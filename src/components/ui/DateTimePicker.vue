<template>
  <div class="datetime-picker">
    <!-- 收缩模式：只显示图标 -->
    <div v-if="compact && !isExpanded" class="compact-mode">
      <button
        type="button"
        class="compact-icon-btn"
        :class="{ 'has-value': modelValue }"
        @click="toggleExpanded"
        :title="title || placeholder"
      >
        {{ icon }}
      </button>
    </div>

    <!-- 展开模式：显示完整选择器 -->
    <div v-else class="expanded-mode">
      <div class="picker-label" v-if="label">{{ label }}</div>
      <div class="picker-wrapper" :class="{ 'has-value': modelValue, 'is-focused': isFocused }">
        <div class="icon">{{ icon }}</div>
        <input
          ref="inputRef"
          :type="type"
          :value="modelValue"
          @input="handleInput"
          @focus="isFocused = true"
          @blur="handleBlur"
          :placeholder="placeholder"
          class="picker-input"
          :title="title"
        />
        <button
          v-if="modelValue && clearable"
          @click="clearValue"
          class="clear-btn"
          type="button"
          title="清除"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Props {
  modelValue: string | null
  type?: 'date' | 'datetime-local' | 'time'
  label?: string
  placeholder?: string
  icon?: string
  clearable?: boolean
  title?: string
  compact?: boolean  // 是否使用紧凑模式（只显示图标）
}

const props = withDefaults(defineProps<Props>(), {
  type: 'datetime-local',
  placeholder: '选择时间',
  icon: '📅',
  clearable: true,
  title: '',
  compact: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const isFocused = ref(false)
const isExpanded = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const toggleExpanded = async () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.showPicker?.()
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value || null)
}

const handleBlur = () => {
  isFocused.value = false
  // 在紧凑模式下，失去焦点后收起
  if (props.compact) {
    setTimeout(() => {
      isExpanded.value = false
    }, 200)
  }
}

const clearValue = () => {
  emit('update:modelValue', null)
}
</script>

<style scoped>
.datetime-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 紧凑模式样式 */
.compact-mode {
  display: inline-block;
}

.compact-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.compact-icon-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.compact-icon-btn.has-value {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
}

/* 展开模式样式 */
.expanded-mode {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 2px;
}

.picker-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s ease;
  gap: 8px;
}

.picker-wrapper:hover {
  border-color: #bdbdbd;
}

.picker-wrapper.is-focused {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.picker-wrapper.has-value {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.icon {
  font-size: 18px;
  line-height: 1;
  user-select: none;
  flex-shrink: 0;
}

.picker-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  min-width: 0;
  font-family: inherit;
}

.picker-input::placeholder {
  color: #999;
}

.picker-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.picker-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.clear-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
  line-height: 1;
}

.clear-btn:hover {
  background: #e0e0e0;
  color: #666;
}

@media (max-width: 768px) {
  .picker-wrapper {
    padding: 10px 12px;
  }
  
  .picker-input {
    font-size: 15px;
  }
}
</style>
