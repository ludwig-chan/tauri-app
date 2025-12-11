<template>
  <div class="todo-container">
    <div class="content-wrapper">
      <!-- 左侧分组管理 -->
      <aside class="sidebar">
        <GroupManager :selected-group-id="selectedGroupId" @selectGroup="handleSelectGroup" />
      </aside>

      <!-- 右侧待办列表 -->
      <main class="main-content">
        <h1 class="todo-title">待办清单</h1>
        <AddTodoForm :groups="groups" @add="handleAddTodo" />

        <div class="todo-list">
          <TodoItem v-for="todo in filteredTodos" :key="todo.id" :todo="todo" :level="0" :editing-states="editingStates"
            @updateStatus="handleUpdateTodoStatus" @updateContent="handleUpdateTodoContent"
            @updateExpectedCompletionTime="handleUpdateExpectedCompletionTime"
            @updateReminderTime="handleUpdateReminderTime" @updateGroup="handleUpdateTodoGroup"
            @addSubtodo="openSubtodoDialog" @deleteTodo="handleDeleteTodo" />
        </div>

        <!-- 子待办添加对话框 -->
        <SubtodoDialog :visible="subtodoDialogVisible" :parent-id="selectedParentId" @close="closeSubtodoDialog"
          @add="handleAddSubtodo" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import TodoItem from '../components/ui/TodoItem.vue'
import SubtodoDialog from '../components/ui/SubtodoDialog.vue'
import AddTodoForm from '../components/ui/AddTodoForm.vue'
import GroupManager from '../components/ui/GroupManager.vue'
import { todoStore } from '../utils/todoStore'

const subtodoDialogVisible = ref(false)
const selectedParentId = ref<number | null>(null)
const selectedGroupId = ref<number | null | 'all'>('all')

// 编辑状态管理
const editingStates = ref(new Map<number, { editing: boolean; previousContent?: string }>())

// 使用共享的待办事项状态
const {
  todos,
  groups,
  initializeTodos,
  addTodo,
  updateTodoStatus,
  updateTodoContent,
  updateTodoExpectedCompletionTime,
  updateTodoReminderTime,
  updateTodoGroup,
  deleteTodo
} = todoStore

// 根据选中的分组过滤待办事项
const filteredTodos = computed(() => {
  if (selectedGroupId.value === 'all') {
    return todos.value
  } else if (selectedGroupId.value === null) {
    return todos.value.filter(todo => todo.group_id === null)
  } else {
    return todos.value.filter(todo => todo.group_id === selectedGroupId.value)
  }
})

// 处理分组选择
const handleSelectGroup = (groupId: number | null | 'all') => {
  selectedGroupId.value = groupId
}

// 初始化数据库和加载待办事项
onMounted(async () => {
  try {
    await initializeTodos()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

const handleAddTodo = async (data: {
  content: string
  expectedCompletionTime: string | null
  reminderTime: string | null
  groupId: number | null
}) => {
  try {
    await addTodo(
      data.content,
      null, // due_date 已移除
      null, // parent_id
      data.expectedCompletionTime,
      data.reminderTime,
      data.groupId
    )
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

const handleUpdateTodoGroup = async (id: number, groupId: number | null) => {
  try {
    await updateTodoGroup(id, groupId)
  } catch (error) {
    console.error('更新待办事项分组失败:', error)
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
  height: 100%;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  height: 100%;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.todo-title {
  margin-bottom: 24px;
  color: #2c3e50;
  font-size: 28px;
  text-align: center;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
