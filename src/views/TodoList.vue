<template>
  <div class="todo-container">
    <h1 class="todo-title">待办清单</h1>
    <div class="input-area">
      <input 
        v-model="newTodo"
        @keyup.enter="addNewTodo"
        placeholder="添加新的待办事项..."
        class="todo-input"
      />
      <div class="time-pickers">
        <DateTimePicker
          v-model="newExpectedCompletionTime"
          label="期望完成"
          icon="⏰"
          placeholder="选择期望完成时间"
        />
        <DateTimePicker
          v-model="newReminderTime"
          label="提醒时间"
          icon="🔔"
          placeholder="选择提醒时间"
        />
      </div>
      <button @click="addNewTodo" class="add-btn">添加</button>
    </div>

    <div class="todo-list">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :level="0"
        :editing-states="editingStates"
        @updateStatus="handleUpdateTodoStatus"
        @updateContent="handleUpdateTodoContent"
        @updateExpectedCompletionTime="handleUpdateExpectedCompletionTime"
        @updateReminderTime="handleUpdateReminderTime"
        @addSubtodo="openSubtodoDialog"
        @deleteTodo="handleDeleteTodo"
      />
    </div>

    <!-- 子待办添加对话框 -->
    <SubtodoDialog
      :visible="subtodoDialogVisible"
      :parent-id="selectedParentId"
      @close="closeSubtodoDialog"
      @add="handleAddSubtodo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TodoItem from '../components/ui/TodoItem.vue'
import SubtodoDialog from '../components/ui/SubtodoDialog.vue'
import DateTimePicker from '../components/ui/DateTimePicker.vue'
import { todoStore } from '../utils/todoStore'

const newTodo = ref('')
const newExpectedCompletionTime = ref<string | null>(null)
const newReminderTime = ref<string | null>(null)
const subtodoDialogVisible = ref(false)
const selectedParentId = ref<number | null>(null)

// 编辑状态管理
const editingStates = ref(new Map<number, { editing: boolean; previousContent?: string }>())

// 使用共享的待办事项状态
const { 
  todos, 
  initializeTodos, 
  addTodo,
  updateTodoStatus, 
  updateTodoContent,
  updateTodoExpectedCompletionTime,
  updateTodoReminderTime,
  deleteTodo 
} = todoStore

// 初始化数据库和加载待办事项
onMounted(async () => {
  try {
    await initializeTodos()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

const addNewTodo = async () => {
  if (!newTodo.value.trim()) return
  
  try {
    await addTodo(
      newTodo.value, 
      null, // due_date 已移除
      null, // parent_id
      newExpectedCompletionTime.value, 
      newReminderTime.value
    )
    newTodo.value = ''
    newExpectedCompletionTime.value = null
    newReminderTime.value = null
  } catch (error) {
    console.error('添加待办事项失败:', error)
  }
}

const handleUpdateTodoStatus = async (id: number, value: boolean) => {
  try {
    await updateTodoStatus(id, value)
  } catch (error) {
    console.error('更新待办事项状态失败:', error)
  }
}

const handleUpdateTodoContent = async (id: number, content: string) => {
  try {
    await updateTodoContent(id, content)
  } catch (error) {
    console.error('更新待办事项内容失败:', error)
  }
}

const handleUpdateExpectedCompletionTime = async (id: number, time: string | null) => {
  try {
    await updateTodoExpectedCompletionTime(id, time)
  } catch (error) {
    console.error('更新待办事项期望完成时间失败:', error)
  }
}

const handleUpdateReminderTime = async (id: number, time: string | null) => {
  try {
    await updateTodoReminderTime(id, time)
  } catch (error) {
    console.error('更新待办事项提醒时间失败:', error)
  }
}

const handleDeleteTodo = async (id: number) => {
  try {
    await deleteTodo(id)
    // 清理编辑状态
    editingStates.value.delete(id)
  } catch (error) {
    console.error('删除待办事项失败:', error)
  }
}

const openSubtodoDialog = (parentId: number) => {
  selectedParentId.value = parentId
  subtodoDialogVisible.value = true
}

const closeSubtodoDialog = () => {
  subtodoDialogVisible.value = false
  selectedParentId.value = null
}

const handleAddSubtodo = async (
  content: string, 
  dueDate: string | null, 
  parentId: number, 
  expectedCompletionTime?: string | null, 
  reminderTime?: string | null
) => {
  try {
    await addTodo(content, dueDate, parentId, expectedCompletionTime, reminderTime)
  } catch (error) {
    console.error('添加子待办事项失败:', error)
  }
}
</script>

<style scoped>
.todo-container {
  width: 100%;
}

.todo-title {
  margin-bottom: 24px;
  color: #2c3e50;
  font-size: 28px;
  text-align: center;
}

.input-area {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.todo-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.todo-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.time-pickers {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.add-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #42b983 0%, #369970 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.add-btn:hover {
  background: linear-gradient(135deg, #369970 0%, #2d8660 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
}

.add-btn:active {
  transform: translateY(0);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .input-area {
    flex-direction: column;
    align-items: stretch;
  }
  
  .todo-input {
    min-width: 100%;
  }

  .time-pickers {
    flex-direction: column;
    width: 100%;
  }
  
  .add-btn {
    width: 100%;
  }
}
</style>
