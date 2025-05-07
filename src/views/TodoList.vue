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
import { ref } from 'vue'
import Checkbox from '../components/ui/Checkbox.vue'

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
let nextId = 1

const addTodo = () => {
  if (!newTodo.value.trim()) return
  
  todos.value.push({
    id: nextId++,
    content: newTodo.value,
    completed: false,
    editing: false
  })
  newTodo.value = ''
}

const toggleTodo = (id: number) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.completed = !todo.completed
}

const deleteTodo = (id: number) => {
  todos.value = todos.value.filter(t => t.id !== id)
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

const finishEdit = (todo: TodoItem) => {
  if (!todo.content.trim()) {
    deleteTodo(todo.id)
  } else {
    todo.editing = false
    delete todo.previousContent
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
