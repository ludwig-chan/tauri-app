<template>
  <div class="clipboard-container">
    <!-- 当前剪贴板区域 -->
    <div class="current-clipboard-section">
      <div class="section-header">
        <h2>当前剪贴板</h2>
        <button @click="refreshCurrentClipboard" class="refresh-btn" title="刷新">
          <span class="refresh-icon">↻</span>
        </button>
      </div>
      <div class="current-clipboard-card" @click="copyToClipboard(currentClipboard)">
        <div v-if="currentClipboard" class="current-content">
          {{ currentClipboard }}
        </div>
        <div v-else class="current-empty">
          剪贴板为空
        </div>
        <div class="current-actions">
          <button 
            v-if="currentClipboard" 
            @click.stop="saveCurrentToHistory" 
            class="save-current-btn"
            title="保存到历史"
          >
            保存到历史
          </button>
        </div>
      </div>
    </div>

    <!-- 历史剪贴板区域 -->
    <div class="history-clipboard-section">
      <div class="section-header">
        <h2>剪贴板历史</h2>
        <div class="header-actions">
          <button @click="showAddDialog = true" class="add-btn">新增记录</button>
          <button @click="clearHistory" class="clear-btn">清空历史</button>
        </div>
      </div>
      
      <div v-if="displayHistory.length === 0" class="empty-state">
        <p>暂无剪贴板历史</p>
      </div>
      
      <div v-else class="clipboard-list">
        <div
          v-for="(item, index) in displayHistory"
          :key="item.timestamp"
          class="clipboard-item"
        >
          <div class="item-header">
            <span class="item-time">{{ formatTime(item.timestamp) }}</span>
            <div class="item-actions">
              <button @click.stop="editItem(index)" class="edit-btn">编辑</button>
              <button @click.stop="copyToClipboard(item.content)" class="copy-btn">复制</button>
              <button @click.stop="deleteItem(index)" class="delete-btn">删除</button>
            </div>
          </div>
          <div 
            v-if="editingIndex === index"
            class="item-edit"
          >
            <textarea
              v-model="editingContent"
              class="edit-textarea"
              @click.stop
            ></textarea>
            <div class="edit-actions">
              <button @click.stop="saveEdit(index)" class="save-btn">保存</button>
              <button @click.stop="cancelEdit" class="cancel-btn">取消</button>
            </div>
          </div>
          <div 
            v-else
            class="item-content"
            @click="copyToClipboard(item.content)"
          >{{ item.content }}</div>
        </div>
      </div>
    </div>
    
    <!-- 新增记录对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="cancelAdd">
      <div class="dialog-content" @click.stop>
        <h3>新增记录</h3>
        <textarea
          v-model="newContent"
          class="add-textarea"
          placeholder="请输入内容..."
          autofocus
        ></textarea>
        <div class="dialog-actions">
          <button @click="addNewRecord" class="save-btn">添加</button>
          <button @click="cancelAdd" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { toast } from '@/utils/toast'

interface ClipboardItem {
  content: string
  timestamp: number
}

const clipboardHistory = ref<ClipboardItem[]>([])
const currentClipboard = ref<string>('')
const editingIndex = ref<number | null>(null)

// 从第二条开始显示（跳过第一条，因为第一条就是当前剪贴板内容）
const displayHistory = computed(() => {
  return clipboardHistory.value.slice(1)
})
const editingContent = ref<string>('')
const showAddDialog = ref<boolean>(false)
const newContent = ref<string>('')

// 从 localStorage 加载历史记录
const loadHistory = () => {
  const saved = localStorage.getItem('clipboardHistory')
  if (saved) {
    clipboardHistory.value = JSON.parse(saved)
  }
}

// 保存历史记录到 localStorage
const saveHistory = () => {
  localStorage.setItem('clipboardHistory', JSON.stringify(clipboardHistory.value))
}

// 获取当前剪贴板内容
const refreshCurrentClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    currentClipboard.value = text || ''
  } catch (err) {
    console.log('读取剪贴板失败:', err)
    currentClipboard.value = ''
  }
}

// 保存当前剪贴板内容到历史
const saveCurrentToHistory = () => {
  if (currentClipboard.value && currentClipboard.value.trim()) {
    addToHistory(currentClipboard.value)
    toast.success('已保存到历史记录')
  }
}

// 添加新的剪贴板内容
const addToHistory = (content: string) => {
  // 检查是否已存在相同内容
  const existingIndex = clipboardHistory.value.findIndex(item => item.content === content)
  
  if (existingIndex !== -1) {
    // 如果已存在，将其移到最前面
    const existingItem = clipboardHistory.value.splice(existingIndex, 1)[0]
    existingItem.timestamp = Date.now() // 更新时间戳
    clipboardHistory.value.unshift(existingItem)
  } else {
    // 如果不存在，添加新项
    clipboardHistory.value.unshift({
      content,
      timestamp: Date.now()
    })
  }
  
  // 限制历史记录数量为50条
  if (clipboardHistory.value.length > 50) {
    clipboardHistory.value = clipboardHistory.value.slice(0, 50)
  }
  
  saveHistory()
}

// 复制到剪贴板
const copyToClipboard = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    toast.success('复制成功')
  } catch (err) {
    console.error('复制失败:', err)
    toast.error('复制失败')
  }
}

// 编辑项目（displayHistory 的索引需要 +1 才是 clipboardHistory 的真实索引）
const editItem = (index: number) => {
  const realIndex = index + 1
  editingIndex.value = index
  editingContent.value = clipboardHistory.value[realIndex].content
}

// 保存编辑
const saveEdit = (index: number) => {
  const realIndex = index + 1
  if (editingContent.value.trim()) {
    clipboardHistory.value[realIndex].content = editingContent.value
    clipboardHistory.value[realIndex].timestamp = Date.now()
    saveHistory()
  }
  cancelEdit()
}

// 取消编辑
const cancelEdit = () => {
  editingIndex.value = null
  editingContent.value = ''
}

// 新增记录
const addNewRecord = async () => {
  if (newContent.value.trim()) {
    // 添加到历史记录
    addToHistory(newContent.value)
    // 复制到系统剪贴板
    try {
      await navigator.clipboard.writeText(newContent.value)
      toast.success('添加成功并已复制到剪贴板')
    } catch (err) {
      console.error('复制到剪贴板失败:', err)
      toast.success('添加成功')
    }
    newContent.value = ''
    showAddDialog.value = false
  } else {
    toast.warning('请输入内容')
  }
}

// 取消新增
const cancelAdd = () => {
  showAddDialog.value = false
  newContent.value = ''
}

// 删除单个项目（displayHistory 的索引需要 +1 才是 clipboardHistory 的真实索引）
const deleteItem = (index: number) => {
  const realIndex = index + 1
  clipboardHistory.value.splice(realIndex, 1)
  saveHistory()
}

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空所有剪贴板历史吗？')) {
    clipboardHistory.value = []
    saveHistory()
    toast.success('已清空历史记录')
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}

// 监听剪贴板变化（需要用户授权）
const startMonitoring = async () => {
  try {
    // 请求剪贴板权限
    const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
    
    if (permission.state === 'granted' || permission.state === 'prompt') {
      // 定期检查剪贴板内容
      setInterval(async () => {
        try {
          const text = await navigator.clipboard.readText()
          if (text && text.trim()) {
            // 更新当前剪贴板显示
            currentClipboard.value = text
            // 自动添加到历史（如果内容变化）
            addToHistory(text)
          }
        } catch (err) {
          // 忽略读取失败
        }
      }, 2000)
    }
  } catch (err) {
    console.log('剪贴板监控不可用:', err)
  }
}

onMounted(() => {
  loadHistory()
  refreshCurrentClipboard()
  startMonitoring()
})
</script>

<style scoped>
.clipboard-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 当前剪贴板区域 */
.current-clipboard-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #42b983;
  border-color: #42b983;
  color: white;
}

.refresh-icon {
  font-size: 18px;
}

.current-clipboard-card {
  background: linear-gradient(135deg, #42b983 0%, #35495e 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(66, 185, 131, 0.3);
  position: relative;
}

.current-clipboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 185, 131, 0.4);
}

.current-content {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-all;
  max-height: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
}

.current-empty {
  font-size: 14px;
  opacity: 0.7;
  text-align: center;
  padding: 20px 0;
}

.current-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.save-current-btn {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.save-current-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

/* 历史剪贴板区域 */
.history-clipboard-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.add-btn {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #359268;
}

.clear-btn {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #d32f2f;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.clipboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clipboard-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clipboard-item:hover {
  border-color: #42b983;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.copy-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #42b983;
  color: #42b983;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.edit-btn:hover,
.copy-btn:hover {
  background: #42b983;
  color: white;
}

.delete-btn {
  padding: 4px 12px;
  background: transparent;
  color: #f44336;
  border: 1px solid #f44336;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #f44336;
  color: white;
}

.item-edit {
  margin-top: 8px;
}

.edit-textarea {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #42b983;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.edit-textarea:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.edit-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-btn {
  padding: 6px 16px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #359268;
}

.cancel-btn {
  padding: 6px 16px;
  background: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #666;
}

.dialog-overlay {
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

.dialog-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.add-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.add-textarea:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.item-content {
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  cursor: pointer;
}
</style>
