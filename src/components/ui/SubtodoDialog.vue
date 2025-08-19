<template>
  <div v-if="visible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>添加子待办项</h3>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="input-group">
          <label for="subtodo-content">子待办内容：</label>
          <input
            id="subtodo-content"
            v-model="subtodoContent"
            @keyup.enter="addSubtodo"
            @keyup.esc="closeDialog"
            placeholder="输入子待办事项..."
            class="subtodo-input"
            ref="contentInput"
          />
        </div>
        
        <div class="input-group">
          <label for="subtodo-date">截止日期（可选）：</label>
          <input
            id="subtodo-date"
            v-model="subtodoDate"
            type="date"
            class="date-input"
          />
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="closeDialog" class="cancel-btn">取消</button>
        <button @click="addSubtodo" :disabled="!subtodoContent.trim()" class="add-btn">添加</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  visible: boolean
  parentId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  add: [content: string, dueDate: string | null, parentId: number]
}>()

const subtodoContent = ref('')
const subtodoDate = ref('')
const contentInput = ref<HTMLInputElement | null>(null)

// 当对话框打开时，聚焦输入框
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      contentInput.value?.focus()
    })
  } else {
    // 关闭时清空输入
    subtodoContent.value = ''
    subtodoDate.value = ''
  }
})

const closeDialog = () => {
  emit('close')
}

const addSubtodo = () => {
  if (!subtodoContent.value.trim() || !props.parentId) return
  
  emit('add', subtodoContent.value, subtodoDate.value || null, props.parentId)
  closeDialog()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #666;
}

.dialog-content {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.subtodo-input,
.date-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.subtodo-input:focus,
.date-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.add-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.add-btn {
  background-color: #4CAF50;
  color: white;
}

.add-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.add-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .dialog {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-header,
  .dialog-content,
  .dialog-actions {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
