<template>
  <div v-if="visible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>添加待办事项</h3>
        <div class="selected-date">{{ formatSelectedDate }}</div>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>
      
      <div class="dialog-body">
        <div class="input-group">
          <label for="todo-content">待办内容</label>
          <input 
            id="todo-content"
            v-model="todoContent"
            @keyup.enter="addNewTodo"
            placeholder="请输入待办事项内容..."
            class="todo-input"
            ref="todoInputRef"
          />
        </div>

        <div class="input-group">
          <DateTimePicker
            v-model="todoExpectedTime"
            label="期望完成时间"
            icon="⏰"
            placeholder="选择期望完成时间"
          />
        </div>

        <div class="input-group">
          <DateTimePicker
            v-model="todoReminderTime"
            label="提醒时间"
            icon="🔔"
            placeholder="选择提醒时间"
          />
        </div>
      </div>
      
      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-btn">取消</button>
        <button @click="addNewTodo" class="confirm-btn" :disabled="!todoContent.trim()">
          添加
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { todoStore } from '../../utils/todoStore'
import DateTimePicker from './DateTimePicker.vue'
import type { TodoItem } from '../../utils/todoStore'

interface Props {
  visible: boolean
  selectedDate?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  selectedDate: null
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'todo-added': [todo: TodoItem]
}>()

const todoContent = ref('')
const todoExpectedTime = ref<string | null>(null)
const todoReminderTime = ref<string | null>(null)
const todoInputRef = ref<HTMLInputElement | null>(null)

// 使用共享的待办事项状态管理
const { addTodo } = todoStore

// 格式化选中的日期显示
const formatSelectedDate = computed(() => {
  if (!props.selectedDate) return ''
  return props.selectedDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 监听弹窗显示状态，设置初始日期和焦点
watch(() => props.visible, (visible) => {
  if (visible) {
    // 聚焦到输入框
    nextTick(() => {
      todoInputRef.value?.focus()
    })
  } else {
    // 清空输入内容
    todoContent.value = ''
    todoExpectedTime.value = null
    todoReminderTime.value = null
  }
})

// 关闭弹窗
const closeDialog = () => {
  emit('update:visible', false)
}

// 添加待办事项
const addNewTodo = async () => {
  if (!todoContent.value.trim()) return
  
  try {
    const newTodo = await addTodo(
      todoContent.value, 
      null, // due_date 已移除
      null,
      todoExpectedTime.value, 
      todoReminderTime.value
    )
    
    if (newTodo) {
      // 触发事件，通知父组件待办事项已添加
      emit('todo-added', newTodo)
      
      // 关闭弹窗
      closeDialog()
    }
  } catch (error) {
    console.error('添加待办事项失败:', error)
    alert('添加待办事项失败，请重试')
  }
}

// 按Escape键关闭弹窗
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    closeDialog()
  }
}

// 添加键盘事件监听
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
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
  animation: fadeIn 0.2s ease-out;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  animation: scaleIn 0.2s ease-out;
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  background: linear-gradient(135deg, #42b983 0%, #369970 100%);
  color: white;
}

.dialog-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.selected-date {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  color: white;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dialog-body {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.todo-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.todo-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.todo-input::placeholder {
  color: #999;
}

.dialog-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.confirm-btn {
  background: linear-gradient(135deg, #42b983 0%, #369970 100%);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #369970 0%, #2d8660 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 480px) {
  .dialog-content {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-header {
    padding: 16px 20px 12px;
  }
  
  .dialog-header h3 {
    font-size: 18px;
  }
  
  .selected-date {
    font-size: 13px;
  }
  
  .dialog-body {
    padding: 20px;
  }
  
  .input-group {
    margin-bottom: 16px;
  }
  
  .todo-input {
    padding: 10px 14px;
    font-size: 15px;
  }
  
  .dialog-footer {
    padding: 12px 20px 20px;
    flex-direction: column-reverse;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>
