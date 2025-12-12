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
          <div class="todo-meta">
            <div v-if="todo.expected_completion_time" class="todo-time">
              ⏰ 期望完成: {{ formatDateTime(todo.expected_completion_time) }}
            </div>
            <div v-if="todo.reminder_time" class="todo-time reminder">
              🔔 提醒: {{ formatDateTime(todo.reminder_time) }}
            </div>
          </div>
        </div>
      </div>

      <div class="todo-actions">
        <div class="actions-dropdown-wrapper">
          <button 
            @click="showActionsMenu = !showActionsMenu"
            class="icon-button actions-toggle"
            title="操作"
          >
            ⋯
          </button>
          <div v-if="showActionsMenu" class="actions-menu">
            <div class="time-inputs" v-if="!getEditingState(todo.id).editing">
              <div class="icon-button-wrapper">
                <button 
                  type="button"
                  class="icon-button" 
                  :class="{ 'has-value': todo.expected_completion_time }"
                  @click.stop="showExpectedTimePicker = !showExpectedTimePicker"
                  title="期望完成时间"
                >
                  ⏰
                </button>
                <div v-if="showExpectedTimePicker" class="picker-popup">
                  <DateTimePicker
                    v-model="todo.expected_completion_time"
                    @update:modelValue="$emit('updateExpectedCompletionTime', todo.id, $event)"
                    icon="⏰"
                    placeholder="期望完成"
                  />
                </div>
              </div>

              <div class="icon-button-wrapper">
                <button 
                  type="button"
                  class="icon-button" 
                  :class="{ 'has-value': todo.reminder_time }"
                  @click.stop="showReminderTimePicker = !showReminderTimePicker"
                  title="提醒时间"
                >
                  🔔
                </button>
                <div v-if="showReminderTimePicker" class="picker-popup">
                  <DateTimePicker
                    v-model="todo.reminder_time"
                    @update:modelValue="$emit('updateReminderTime', todo.id, $event)"
                    icon="🔔"
                    placeholder="提醒时间"
                  />
                </div>
              </div>

              <div v-if="level === 0" class="icon-button-wrapper">
                <button 
                  type="button"
                  class="icon-button" 
                  :class="{ 'has-value': todo.group_id !== null }"
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
                      :class="{ 'active': todo.group_id === null }"
                      @click="selectGroup(null)"
                    >
                      未分组
                    </div>
                    <div 
                      v-for="group in groups" 
                      :key="group.id"
                      class="group-option"
                      :class="{ 'active': todo.group_id === group.id }"
                      @click="selectGroup(group.id)"
                    >
                      <span v-if="group.color" class="group-color" :style="{ backgroundColor: group.color }"></span>
                      {{ group.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button @click.stop="handleAddSubtodo" class="icon-button" title="添加子项">
                ➕
              </button>
              <button @click.stop="handleDelete" class="icon-button delete-icon-btn" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </div>
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
        @updateExpectedCompletionTime="(id, time) => $emit('updateExpectedCompletionTime', id, time)"
        @updateReminderTime="(id, time) => $emit('updateReminderTime', id, time)"
        @updateGroup="(id, groupId) => $emit('updateGroup', id, groupId)"
        @addSubtodo="(id) => $emit('addSubtodo', id)"
        @deleteTodo="(id) => $emit('deleteTodo', id)"
      />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { TodoItem as TodoItemType } from '../../utils/todoStore'
import { todoStore } from '../../utils/todoStore'
import Checkbox from './Checkbox.vue'
import DateTimePicker from './DateTimePicker.vue'

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
  updateExpectedCompletionTime: [id: number, time: string | null]
  updateReminderTime: [id: number, time: string | null]
  updateGroup: [id: number, groupId: number | null]
  addSubtodo: [parentId: number]
  deleteTodo: [id: number]
}>()

const { groups } = todoStore

const editInput = ref<HTMLInputElement | null>(null)
const showExpectedTimePicker = ref(false)
const showReminderTimePicker = ref(false)
const showGroupSelector = ref(false)
const showActionsMenu = ref(false)

const hasChildren = computed(() => props.todo.children && props.todo.children.length > 0)

// 获取编辑状态
const getEditingState = (id: number) => {
  return props.editingStates.get(id) || { editing: false }
}

// 格式化日期时间显示
const formatDateTime = (dateTimeStr: string | null) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

const selectGroup = (groupId: number | null) => {
  emit('updateGroup', props.todo.id, groupId)
  showGroupSelector.value = false
}

const handleAddSubtodo = () => {
  emit('addSubtodo', props.todo.id)
  showActionsMenu.value = false
}

const handleDelete = () => {
  emit('deleteTodo', props.todo.id)
  showActionsMenu.value = false
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.icon-button-wrapper') && !target.closest('.actions-dropdown-wrapper')) {
    showExpectedTimePicker.value = false
    showReminderTimePicker.value = false
    showGroupSelector.value = false
    showActionsMenu.value = false
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

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.todo-time {
  font-size: 12px;
  color: #666;
  background: #fff3e0;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.todo-time.reminder {
  background: #fce4ec;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.actions-dropdown-wrapper {
  position: relative;
}

.actions-toggle {
  font-size: 24px;
  font-weight: bold;
}

.actions-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1000;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.actions-menu .time-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.time-inputs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.picker-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
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

.delete-icon-btn:hover {
  background: #ffebee !important;
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
    justify-content: flex-start;
  }
  
  .time-inputs {
    width: 100%;
    flex-direction: column;
  }
}
</style>
