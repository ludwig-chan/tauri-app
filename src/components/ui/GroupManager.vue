<template>
  <div class="group-manager">
    <div class="groups-header">
      <h3>分组管理</h3>
      <button @click="showAddDialog = true" class="add-group-btn" title="新建分组">
        ➕ 新建分组
      </button>
    </div>
    
    <div class="groups-list">
      <div 
        v-for="(group, index) in groups" 
        :key="group.id" 
        class="group-item"
        :class="{ 'selected': selectedGroupId === group.id, 'dragging': draggingIndex === index }"
        draggable="true"
        @dragstart="handleDragStart(index, $event)"
        @dragend="handleDragEnd"
        @dragover.prevent="handleDragOver(index)"
        @drop="handleDrop(index)"
        @click="$emit('selectGroup', group.id)"
      >
        <div class="drag-handle" title="拖动排序">⋮⋮</div>
        <div class="group-color" :style="{ backgroundColor: group.color }"></div>
        <span class="group-name">{{ group.name }}</span>
        <div class="group-actions">
          <button 
            @click.stop="startEdit(group)" 
            class="icon-btn" 
            title="编辑"
          >
            ✏️
          </button>
          <button 
            @click.stop="confirmDelete(group)" 
            class="icon-btn" 
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div 
        class="group-item"
        :class="{ 'selected': selectedGroupId === null }"
        @click="$emit('selectGroup', null)"
      >
        <div class="group-color" style="background-color: #999"></div>
        <span class="group-name">未分组</span>
      </div>
      
      <div 
        class="group-item"
        :class="{ 'selected': selectedGroupId === 'all' }"
        @click="$emit('selectGroup', 'all')"
      >
        <div class="group-color" style="background-color: #42b983"></div>
        <span class="group-name">全部</span>
      </div>
    </div>

    <!-- 添加/编辑分组对话框 -->
    <div v-if="showAddDialog || editingGroup" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-content">
        <h3>{{ editingGroup ? '编辑分组' : '新建分组' }}</h3>
        
        <div class="form-group">
          <label>分组名称</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="输入分组名称"
            class="form-input"
            @keyup.enter="handleSubmit"
          />
        </div>
        
        <div class="form-group">
          <label>分组颜色</label>
          <div class="color-picker">
            <input 
              v-model="formData.color" 
              type="color" 
              class="color-input"
            />
            <span class="color-value">{{ formData.color }}</span>
          </div>
          <div class="preset-colors">
            <div 
              v-for="color in presetColors" 
              :key="color"
              class="preset-color"
              :style="{ backgroundColor: color }"
              :class="{ 'selected': formData.color === color }"
              @click="formData.color = color"
            ></div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeDialog" class="btn btn-cancel">取消</button>
          <button @click="handleSubmit" class="btn btn-primary">
            {{ editingGroup ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { todoStore, type TodoGroup } from '../../utils/todoStore'

interface Props {
  selectedGroupId?: number | null | 'all'
}

const props = withDefaults(defineProps<Props>(), {
  selectedGroupId: 'all'
})

const emit = defineEmits<{
  selectGroup: [groupId: number | null | 'all']
}>()

const { groups, addGroup, updateGroup, deleteGroup, updateGroupOrder } = todoStore

// 拖拽相关状态
const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const showAddDialog = ref(false)
const editingGroup = ref<TodoGroup | null>(null)
const formData = ref({
  name: '',
  color: '#42b983'
})

const presetColors = [
  '#42b983', '#409EFF', '#67C23A', '#E6A23C', 
  '#F56C6C', '#909399', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#3B82F6', '#EF4444'
]

const startEdit = (group: TodoGroup) => {
  editingGroup.value = group
  formData.value = {
    name: group.name,
    color: group.color
  }
}

const closeDialog = () => {
  showAddDialog.value = false
  editingGroup.value = null
  formData.value = {
    name: '',
    color: '#42b983'
  }
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    alert('请输入分组名称')
    return
  }
  
  try {
    if (editingGroup.value) {
      await updateGroup(editingGroup.value.id, formData.value.name, formData.value.color)
    } else {
      await addGroup(formData.value.name, formData.value.color)
    }
    closeDialog()
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请重试')
  }
}

const confirmDelete = async (group: TodoGroup) => {
  if (confirm(`确定要删除分组"${group.name}"吗？该分组下的待办事项将变为未分组。`)) {
    try {
      await deleteGroup(group.id)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }
}

// 拖拽处理
const handleDragStart = (index: number, event: DragEvent) => {
  draggingIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', (event.target as HTMLElement).innerHTML)
  }
}

const handleDragEnd = () => {
  draggingIndex.value = null
  dragOverIndex.value = null
}

const handleDragOver = (index: number) => {
  dragOverIndex.value = index
}

const handleDrop = async (dropIndex: number) => {
  if (draggingIndex.value === null || draggingIndex.value === dropIndex) {
    return
  }
  
  try {
    // 创建新的分组数组
    const newGroups = [...groups.value]
    const draggedGroup = newGroups[draggingIndex.value]
    
    // 移除拖拽的项
    newGroups.splice(draggingIndex.value, 1)
    
    // 插入到新位置
    newGroups.splice(dropIndex, 0, draggedGroup)
    
    // 更新排序
    await updateGroupOrder(newGroups)
  } catch (error) {
    console.error('更新排序失败:', error)
    alert('更新排序失败，请重试')
  } finally {
    draggingIndex.value = null
    dragOverIndex.value = null
  }
}
</script>

<style scoped>
.group-manager {
  width: 100%;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.groups-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.add-group-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #42b983 0%, #369970 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.add-group-btn:hover {
  background: linear-gradient(135deg, #369970 0%, #2d8660 100%);
  transform: translateY(-1px);
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
}

.group-item:hover {
  border-color: #42b983;
  background: #f9f9f9;
}

.group-item.selected {
  border-color: #42b983;
  background: #f0fdf4;
}

.group-item.dragging {
  opacity: 0.5;
  border-style: dashed;
}

.drag-handle {
  color: #999;
  font-size: 14px;
  cursor: grab;
  padding: 4px;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.group-item:hover .drag-handle {
  color: #42b983;
}

.group-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  flex: 1;
  font-size: 15px;
  color: #2c3e50;
}

.group-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.modal-overlay {
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
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.color-input {
  width: 60px;
  height: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  color: #666;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.preset-color {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.preset-color:hover {
  transform: scale(1.1);
}

.preset-color.selected {
  border-color: #2c3e50;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #2c3e50;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #42b983 0%, #369970 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #369970 0%, #2d8660 100%);
}
</style>
