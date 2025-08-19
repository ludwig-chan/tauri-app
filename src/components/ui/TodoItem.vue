<template>
  <div class="todo-item-container">
    <div class="todo-item" :class="{ 'has-children': hasChildren, 'is-child': level > 0 }" :style="{ paddingLeft: (level * 20) + 'px' }">
      <div class="todo-content">
        <!-- 展开/收起按钮 -->
        <button 
          v-if="hasChildren"
          @click="toggleExpanded"
          class="expand-btn"
          :class="{ 'expanded': todo.expanded }"
        >
          ▶
        </button>
        <div v-else class="expand-placeholder"></div>

        <Checkbox
          :model-value="todo.completed"
          @update:modelValue="(value) => $emit('updateStatus', todo.id, value)"
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
          @change="$emit('updateDate', todo.id, todo.due_date || null)"
          class="date-input-small"
          :title="todo.due_date ? '修改日期' : '添加日期'"
        />
        <button @click="$emit('addSubtodo', todo.id)" class="add-subtodo-btn" title="添加子项">
          ➕
        </button>
        <button @click="$emit('deleteTodo', todo.id)" class="delete-btn">删除</button>
      </div>
    </div>

    <!-- 递归渲染子项 -->
    <transition-group name="subtodo" tag="div" class="subtodos" v-if="hasChildren && todo.expanded">
      <TodoItem
        v-for="child in todo.children"
        :key="child.id"
        :todo="child"
        :level="level + 1"
        :editing-states="editingStates"
        @updateStatus="(id, value) => $emit('updateStatus', id, value)"
        @updateContent="(id, content) => $emit('updateContent', id, content)"
        @updateDate="(id, date) => $emit('updateDate', id, date)"
        @addSubtodo="(id) => $emit('addSubtodo', id)"
        @deleteTodo="(id) => $emit('deleteTodo', id)"
      />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { TodoItem as TodoItemType } from '../../utils/todoStore'
import Checkbox from './Checkbox.vue'

interface Props {
  todo: TodoItemType
  level?: number
  editingStates: Map<number, { editing: boolean; previousContent?: string }>
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

// 定义 emits
const emit = defineEmits<{
  updateStatus: [id: number, value: boolean]
  updateContent: [id: number, content: string]
  updateDate: [id: number, date: string | null]
  addSubtodo: [parentId: number]
  deleteTodo: [id: number]
}>()

const editInput = ref<HTMLInputElement | null>(null)

const hasChildren = computed(() => props.todo.children && props.todo.children.length > 0)

// 获取编辑状态
const getEditingState = (id: number) => {
  return props.editingStates.get(id) || { editing: false }
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

const toggleExpanded = () => {
  props.todo.expanded = !props.todo.expanded
}

const startEdit = (todo: TodoItemType) => {
  props.editingStates.set(todo.id, {
    editing: true,
    previousContent: todo.content
  })
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
    }
  })
}

const finishEdit = async (todo: TodoItemType) => {
  if (!todo.content.trim()) {
    emit('deleteTodo', todo.id)
  } else {
    emit('updateContent', todo.id, todo.content)
    props.editingStates.delete(todo.id)
  }
}

const cancelEdit = (todo: TodoItemType) => {
  const state = getEditingState(todo.id)
  if (state.previousContent !== undefined) {
    todo.content = state.previousContent
  }
  props.editingStates.delete(todo.id)
}
</script>

<style scoped>
.todo-item-container {
  width: 100%;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 4px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
  transition: all 0.2s ease;
}

.todo-item.is-child {
  background-color: #f5f5f5;
  border-left-color: #ccc;
  margin-left: 0;
}

.todo-item.has-children {
  border-left-color: #4CAF50;
}

.todo-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-grow: 1;
}

.expand-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  transition: transform 0.2s ease;
  width: 20px;
  text-align: center;
}

.expand-btn.expanded {
  transform: rotate(90deg);
}

.expand-btn:hover {
  color: #4CAF50;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.expand-placeholder {
  width: 20px;
  height: 20px;
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

.date-input-small {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 120px;
}

.add-subtodo-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.add-subtodo-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #cc0000;
}

.completed {
  text-decoration: line-through;
  color: #888;
}

.edit-input {
  margin: 0;
  padding: 4px 8px;
  font-size: 16px;
  flex-grow: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
}

span {
  cursor: pointer;
  padding: 4px 0;
  line-height: 1.4;
}

.subtodos {
  margin-top: 8px;
}

/* 动画效果 */
.subtodo-enter-active,
.subtodo-leave-active {
  transition: all 0.3s ease;
}

.subtodo-enter-from,
.subtodo-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 768px) {
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
