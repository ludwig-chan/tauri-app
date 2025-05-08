<template>
  <div class="todo-container">
    <h1 class="todo-title">待办清单</h1>
    <div class="input-area">
      <input 
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="添加新的待办事项..."
      />
      <button @click="addTodo">添加</button>
    </div>

    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" class="todo-item">
        <div class="todo-content">
          <Checkbox
            v-model="todo.completed"
            @update:modelValue="toggleTodo(todo.id)"
          />
          <span 
            v-if="!todo.editing" 
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
        </div>
        <button @click="deleteTodo(todo.id)" class="delete-btn">删除</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Checkbox from '../components/ui/Checkbox.vue'
import { execSQL, selectSQL } from '../utils/db'
import { initializeTodoTable } from '../utils/initDb'

interface TodoItem {
  id: number
  content: string
  completed: boolean
  editing?: boolean
  previousContent?: string
}

const newTodo = ref('')
const todos = ref<TodoItem[]>([])
const editInput = ref<HTMLInputElement | null>(null)

// 初始化数据库和加载待办事项
onMounted(async () => {
  try {
    await initializeTodoTable()
    await loadTodos()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 从数据库加载所有待办事项
const loadTodos = async () => {
  try {
    const result = await selectSQL<TodoItem>('SELECT id, content, completed FROM todos ORDER BY id DESC')
    todos.value = result.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed),
      editing: false
    }))
  } catch (error) {
    console.error('加载待办事项失败:', error)
  }
}

const addTodo = async () => {
  if (!newTodo.value.trim()) return
  
  try {
    const result = await execSQL(
      'INSERT INTO todos (content, completed) VALUES (?, ?) RETURNING id',
      [newTodo.value, false]
    )
    
    const id = result.lastInsertId
    todos.value.unshift({
      id,
      content: newTodo.value,
      completed: false,
      editing: false
    })
    newTodo.value = ''
  } catch (error) {
    console.error('添加待办事项失败:', error)
  }
}

const toggleTodo = async (id: number) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    try {
      await execSQL(
        'UPDATE todos SET completed = ? WHERE id = ?',
        [!todo.completed, id]
      )
      todo.completed = !todo.completed
    } catch (error) {
      console.error('更新待办事项状态失败:', error)
    }
  }
}

const deleteTodo = async (id: number) => {
  try {
    await execSQL('DELETE FROM todos WHERE id = ?', [id])
    todos.value = todos.value.filter(t => t.id !== id)
  } catch (error) {
    console.error('删除待办事项失败:', error)
  }
}

const startEdit = (todo: TodoItem) => {
  todo.previousContent = todo.content
  todo.editing = true
  setTimeout(() => {
    if (editInput.value) {
      editInput.value.focus()
    }
  })
}

const finishEdit = async (todo: TodoItem) => {
  if (!todo.content.trim()) {
    await deleteTodo(todo.id)
  } else {
    try {
      await execSQL(
        'UPDATE todos SET content = ? WHERE id = ?',
        [todo.content, todo.id]
      )
      todo.editing = false
      delete todo.previousContent
    } catch (error) {
      console.error('更新待办事项内容失败:', error)
      // 如果更新失败，恢复原来的内容
      if (todo.previousContent !== undefined) {
        todo.content = todo.previousContent
      }
    }
  }
}

const cancelEdit = (todo: TodoItem) => {
  if (todo.previousContent !== undefined) {
    todo.content = todo.previousContent
  }
  todo.editing = false
  delete todo.previousContent
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
}

input {
  flex-grow: 1;
  padding: 8px 12px;
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
  padding: 10px;
  margin-bottom: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
  margin-right: 10px;
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
}
</style>
