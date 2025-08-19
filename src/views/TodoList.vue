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
      <input 
        v-model="newTodoDate"
        type="date"
        class="date-input"
        placeholder="选择日期 (可选)"
      />
      <button @click="addNewTodo">添加</button>
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
        @updateDate="handleUpdateTodoDate"
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
import { todoStore } from '../utils/todoStore'

const newTodo = ref('')
const newTodoDate = ref('')
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
  updateTodoDate, 
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
    await addTodo(newTodo.value, newTodoDate.value || null)
    newTodo.value = ''
    newTodoDate.value = ''
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

const handleUpdateTodoDate = async (id: number, date: string | null) => {
  try {
    await updateTodoDate(id, date)
  } catch (error) {
    console.error('更新待办事项日期失败:', error)
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

const handleAddSubtodo = async (content: string, dueDate: string | null, parentId: number) => {
  try {
    await addTodo(content, dueDate, parentId)
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
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.todo-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
}

.date-input {
  min-width: 150px;
  padding: 8px 12px;
}

input {
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .input-area {
    flex-direction: column;
  }
  
  .todo-input,
  .date-input {
    min-width: 100%;
  }
}
</style>
