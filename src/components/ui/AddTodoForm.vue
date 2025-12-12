<template>
  <div class="input-area">
    <div class="unified-input-box" :class="{ 'focused': isFocused }">
      <input 
        v-model="todoContent" 
        @keyup.enter="handleAdd" 
        @focus="isFocused = true"
        @blur="isFocused = false"
        placeholder="添加新的待办事项（回车添加）..." 
        class="todo-input" 
      />
      
      <div class="icon-buttons">
        <DateTimePicker 
          v-model="expectedCompletionTime" 
          icon="📅" 
          placeholder="选择期望完成时间"
          title="设置期望完成时间"
          compact
        />

        <div class="icon-button-wrapper more-options-wrapper">
          <button 
            type="button"
            class="icon-button more-options-btn" 
            :class="{ 'has-value': reminderTime || selectedGroupId !== null }"
            @click="showMoreOptions = !showMoreOptions"
            title="更多选项"
          >
            ⋯
          </button>
          <div v-if="showMoreOptions" class="picker-popup more-options-popup">
            <div class="more-options-content">
              <div class="icon-button-wrapper">
                <button 
                  type="button"
                  class="icon-button" 
                  :class="{ 'has-value': reminderTime }"
                  @click.stop="showReminderTimePicker = !showReminderTimePicker"
                  title="设置提醒时间"
                >
                  🔔
                </button>
                <div v-if="showReminderTimePicker" class="picker-popup">
                  <DateTimePicker 
                    v-model="reminderTime" 
                    label="提醒时间" 
                    icon="🔔" 
                    placeholder="选择提醒时间" 
                  />
                </div>
              </div>

              <div class="icon-button-wrapper">
                <button 
                  type="button"
                  class="icon-button" 
                  :class="{ 'has-value': selectedGroupId !== null }"
                  @click.stop="showGroupSelector = !showGroupSelector"
                  title="选择分组"
                >
                  📁
                </button>
                <div v-if="showGroupSelector" class="picker-popup group-popup">
                  <div class="popup-label">选择分组</div>
                  <div class="group-options">
                    <div 
                      class="group-option" 
                      :class="{ 'active': selectedGroupId === null }"
                      @click="selectGroup(null)"
                    >
                      未分组
                    </div>
                    <div 
                      v-for="group in groups" 
                      :key="group.id"
                      class="group-option"
                      :class="{ 'active': selectedGroupId === group.id }"
                      @click="selectGroup(group.id)"
                    >
                      <span v-if="group.color" class="group-color" :style="{ backgroundColor: group.color }"></span>
                      {{ group.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DateTimePicker from './DateTimePicker.vue'

interface Group {
  id: number
  name: string
  color?: string
}

interface Props {
  groups: Group[]
}

interface Emits {
  (e: 'add', data: {
    content: string
    expectedCompletionTime: string | null
    reminderTime: string | null
    groupId: number | null
  }): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const todoContent = ref('')
const expectedCompletionTime = ref<string | null>(null)
const reminderTime = ref<string | null>(null)
const selectedGroupId = ref<number | null>(null)
const showExpectedTimePicker = ref(false)
const showReminderTimePicker = ref(false)
const showGroupSelector = ref(false)
const showMoreOptions = ref(false)
const isFocused = ref(false)

const selectGroup = (groupId: number | null) => {
  selectedGroupId.value = groupId
  showGroupSelector.value = false
}

const handleAdd = () => {
  if (!todoContent.value.trim()) return

  emit('add', {
    content: todoContent.value,
    expectedCompletionTime: expectedCompletionTime.value,
    reminderTime: reminderTime.value,
    groupId: selectedGroupId.value
  })

  // 清空输入（保留分组选择）
  todoContent.value = ''
  expectedCompletionTime.value = null
  reminderTime.value = null
  showExpectedTimePicker.value = false
  showReminderTimePicker.value = false
  showMoreOptions.value = false
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.icon-button-wrapper') && !target.closest('.more-options-wrapper')) {
    showExpectedTimePicker.value = false
    showReminderTimePicker.value = false
    showGroupSelector.value = false
    showMoreOptions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.input-area {
  margin-bottom: 24px;
}

.unified-input-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.unified-input-box:hover {
  border-color: #bdbdbd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.unified-input-box.focused {
  border-color: #42b983;
  box-shadow: 0 0 0 4px rgba(66, 185, 131, 0.1), 0 4px 12px rgba(66, 185, 131, 0.15);
}

.todo-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 8px;
  font-size: 16px;
  color: #333;
}

.todo-input::placeholder {
  color: #999;
}

.icon-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.icon-button-wrapper {
  position: relative;
}

.icon-button {
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

.icon-button:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.icon-button.has-value {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
}

.more-options-btn {
  font-size: 24px;
  font-weight: bold;
}

.more-options-popup {
  min-width: auto;
  padding: 12px;
}

.more-options-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.picker-popup {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1000;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 280px;
}

.group-popup {
  min-width: 200px;
  padding: 12px;
}

.popup-label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.group-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-option {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-option:hover {
  background: #f5f5f5;
}

.group-option.active {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
  color: #42b983;
  font-weight: 500;
}

.group-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .unified-input-box {
    flex-wrap: wrap;
  }

  .todo-input {
    flex-basis: 100%;
    order: 1;
  }

  .icon-buttons {
    flex-basis: 100%;
    order: 2;
    border-left: none;
    border-top: 1px solid #e0e0e0;
    padding-left: 0;
    padding-top: 8px;
    margin-top: 4px;
    justify-content: flex-start;
  }

  .picker-popup {
    left: 0;
    right: auto;
  }
}
</style>
