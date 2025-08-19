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

    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" class="todo-item">
        <div class="todo-content">
          <Checkbox
            :model-value="todo.completed"
            @update:modelValue="(value) => handleUpdateTodoStatus(todo.id, value)"
          />
          <div class="todo-text-container">
            <span 
              v-if="!getEditingState(todo.id).editing" 
              :class="{ completed: todo.completed }"
              @dblclick="startEdit(todo)"
            >
              {{ todo.content }}
            </span>
            <input
              v-else
              v-model="todo.content"
              @blur="finishEdit(todo)"
              @keyup.enter="finishEdit(todo)"
              @keyup.esc="cancelEdit(todo)"
              ref="editInput"
              class="edit-input"
            />
            <div v-if="todo.due_date" class="todo-date">
              📅 {{ formatDate(todo.due_date) }}
            </div>
          </div>
        </div>
        <div class="todo-actions">
          <input 
            v-if="!getEditingState(todo.id).editing"
            v-model="todo.due_date"
            type="date"
            @change="handleUpdateTodoDate(todo.id, todo.due_date || null)"
            class="date-input-small"
            :title="todo.due_date ? '修改日期' : '添加日期'"
          />
          <button @click="handleDeleteTodo(todo.id)" class="delete-btn">删除</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Checkbox from '../components/ui/Checkbox.vue'
import { todoStore } from '../utils/todoStore'

const newTodo = ref('')
const newTodoDate = ref('')
const editInput = ref<HTMLInputElement | null>(null)

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

// 获取编辑状态
const getEditingState = (id: number) => {
  return editingStates.value.get(id) || { editing: false }
}

// 格式化日期显示
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

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

// 更新待办事项日期
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

const startEdit = (todo: { id: number; content: string }) => {
  const todo_item = todos.value.find(t => t.id === todo.id)
  if (todo_item) {
    editingStates.value.set(todo.id, {
      editing: true,
      previousContent: todo_item.content
    })
    nextTick(() => {
      if (editInput.value) {
        editInput.value.focus()
      }
    })
  }
}

const finishEdit = async (todo: { id: number; content: string }) => {
  if (!todo.content.trim()) {
    await handleDeleteTodo(todo.id)
  } else {
    try {
      await updateTodoContent(todo.id, todo.content)
      editingStates.value.delete(todo.id)
    } catch (error) {
      console.error('更新待办事项内容失败:', error)
      // 如果更新失败，恢复原来的内容
      const state = getEditingState(todo.id)
      if (state.previousContent !== undefined) {
        const todo_item = todos.value.find(t => t.id === todo.id)
        if (todo_item) {
          todo_item.content = state.previousContent
        }
      }
    }
  }
}

const cancelEdit = (todo: { id: number; content: string }) => {
  const state = getEditingState(todo.id)
  if (state.previousContent !== undefined) {
    const todo_item = todos.value.find(t => t.id === todo.id)
    if (todo_item) {
      todo_item.content = state.previousContent
    }
  }
  editingStates.value.delete(todo.id)
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

.date-input-small {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
  min-width: 120px;
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
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.todo-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-grow: 1;
}

.todo-text-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-date {
  font-size: 12px;
  color: #666;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completed {
  text-decoration: line-through;
  color: #888;
}

.delete-btn {
  background-color: #ff4444;
  padding: 4px 8px;
  font-size: 14px;
}

.delete-btn:hover {
  background-color: #cc0000;
}

.edit-input {
  margin: 0;
  padding: 4px 8px;
  font-size: 16px;
  flex-grow: 1;
}

span {
  cursor: pointer;
  padding: 4px 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .input-area {
    flex-direction: column;
  }
  
  .todo-input,
  .date-input {
    min-width: 100%;
  }
  
  .todo-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .todo-actions {
    justify-content: flex-end;
  }
  
  .date-input-small {
    min-width: 100px;
  }
}
</style>
