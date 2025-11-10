<template>
  <div class="clipboard-container">
    <div class="clipboard-header">
      <h2>剪贴板历史</h2>
      <button @click="clearHistory" class="clear-btn">清空历史</button>
    </div>
    
    <div v-if="clipboardHistory.length === 0" class="empty-state">
      <p>暂无剪贴板历史</p>
    </div>
    
    <div v-else class="clipboard-list">
      <div
        v-for="(item, index) in clipboardHistory"
        :key="index"
        class="clipboard-item"
        @click="copyToClipboard(item.content)"
      >
        <div class="item-header">
          <span class="item-time">{{ formatTime(item.timestamp) }}</span>
          <button @click.stop="deleteItem(index)" class="delete-btn">删除</button>
        </div>
        <div class="item-content">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ClipboardItem {
  content: string
  timestamp: number
}

const clipboardHistory = ref<ClipboardItem[]>([])

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

// 添加新的剪贴板内容
const addToHistory = (content: string) => {
  // 避免重复添加相同内容
  const lastItem = clipboardHistory.value[0]
  if (lastItem && lastItem.content === content) {
    return
  }
  
  clipboardHistory.value.unshift({
    content,
    timestamp: Date.now()
  })
  
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
    alert('已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败')
  }
}

// 删除单个项目
const deleteItem = (index: number) => {
  clipboardHistory.value.splice(index, 1)
  saveHistory()
}

// 清空历史
const clearHistory = () => {
  if (confirm('确定要清空所有剪贴板历史吗？')) {
    clipboardHistory.value = []
    saveHistory()
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
  startMonitoring()
})
</script>

<style scoped>
.clipboard-container {
  max-width: 800px;
  margin: 0 auto;
}

.clipboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.clipboard-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
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
  -webkit-box-orient: vertical;
}
</style>
