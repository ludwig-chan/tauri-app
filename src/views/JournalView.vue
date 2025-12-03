<template>
  <div class="journal-view">
    <div class="journal-header">
      <div class="type-selector">
        <button
          v-for="type in journalTypes"
          :key="type.value"
          :class="['type-btn', { active: currentType === type.value }]"
          @click="currentType = type.value"
        >
          {{ type.icon }} {{ type.label }}
        </button>
      </div>
      <div class="date-navigator">
        <button class="nav-btn" @click="navigateDate(-1)">←</button>
        <span class="current-date">{{ formattedDate }}</span>
        <button class="nav-btn" @click="navigateDate(1)">→</button>
        <button class="today-btn" @click="goToToday">今天</button>
      </div>
    </div>

    <div class="journal-content">
      <div class="editor-section">
        <h3>{{ getTitle() }}</h3>
        <textarea
          v-model="content"
          :placeholder="getPlaceholder()"
          class="journal-editor"
          @input="autoSave"
        ></textarea>
      </div>
    </div>

    <div class="journal-footer">
      <span class="save-status">{{ saveStatus }}</span>
      <div class="actions">
        <button class="action-btn primary" @click="saveJournal">保存</button>
      </div>
    </div>

    <!-- 历史记录侧边栏 -->
    <div class="history-sidebar" :class="{ open: showHistory }">
      <div class="history-header">
        <h4>历史记录</h4>
        <button class="close-btn" @click="showHistory = false">×</button>
      </div>
      <div class="history-list">
        <div
          v-for="entry in historyEntries"
          :key="entry.id"
          class="history-item"
          @click="loadEntry(entry)"
        >
          <span class="history-date">{{ entry.displayDate }}</span>
          <span class="history-type">{{ getTypeLabel(entry.type) }}</span>
        </div>
      </div>
    </div>

    <button class="history-toggle" @click="showHistory = !showHistory">
      📚
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

type JournalType = 'daily' | 'weekly' | 'monthly'

interface JournalEntry {
  id: number
  type: JournalType
  date: string
  content: string
  displayDate: string
  createdAt: string
  updatedAt: string
}

const route = useRoute()

const journalTypes = [
  { value: 'daily' as JournalType, label: '日记', icon: '📝' },
  { value: 'weekly' as JournalType, label: '周记', icon: '📓' },
  { value: 'monthly' as JournalType, label: '月记', icon: '📖' }
]

const currentType = ref<JournalType>('daily')
const currentDate = ref(new Date())
const content = ref('')
const saveStatus = ref('未保存')
const showHistory = ref(false)
const historyEntries = ref<JournalEntry[]>([])
const currentEntryId = ref<number | null>(null)

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

const formattedDate = computed(() => {
  const date = currentDate.value
  switch (currentType.value) {
    case 'daily':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    case 'weekly':
      const weekStart = getWeekStart(date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekStart.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`
    case 'monthly':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
      })
    default:
      return ''
  }
})

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function getDateKey(): string {
  const date = currentDate.value
  switch (currentType.value) {
    case 'daily':
      return date.toISOString().split('T')[0]
    case 'weekly':
      return getWeekStart(date).toISOString().split('T')[0]
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    default:
      return ''
  }
}

function navigateDate(direction: number) {
  const date = new Date(currentDate.value)
  switch (currentType.value) {
    case 'daily':
      date.setDate(date.getDate() + direction)
      break
    case 'weekly':
      date.setDate(date.getDate() + direction * 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + direction)
      break
  }
  currentDate.value = date
}

function goToToday() {
  currentDate.value = new Date()
}

function getTitle(): string {
  switch (currentType.value) {
    case 'daily':
      return '📝 日记'
    case 'weekly':
      return '� 周记'
    case 'monthly':
      return '📖 月记'
    default:
      return ''
  }
}

function getPlaceholder(): string {
  switch (currentType.value) {
    case 'daily':
      return '记录今天发生的事情、想法和感受...'
    case 'weekly':
      return '记录本周的收获和感想...'
    case 'monthly':
      return '回顾本月的整体情况和收获...'
    default:
      return ''
  }
}

function getTypeLabel(type: JournalType): string {
  const typeObj = journalTypes.find((t) => t.value === type)
  return typeObj ? typeObj.label : ''
}

function autoSave() {
  saveStatus.value = '编辑中...'
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(() => {
    saveJournal()
  }, 2000)
}

async function saveJournal() {
  try {
    const key = `journal_${currentType.value}_${getDateKey()}`
    const entry: JournalEntry = {
      id: currentEntryId.value || Date.now(),
      type: currentType.value,
      date: getDateKey(),
      content: content.value,
      displayDate: formattedDate.value,
      createdAt: currentEntryId.value
        ? localStorage.getItem(key)
          ? JSON.parse(localStorage.getItem(key)!).createdAt
          : new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(key, JSON.stringify(entry))
    currentEntryId.value = entry.id
    saveStatus.value = `已保存于 ${new Date().toLocaleTimeString('zh-CN')}`
    loadHistory()
  } catch (error) {
    console.error('保存失败:', error)
    saveStatus.value = '保存失败'
  }
}

function loadJournal() {
  const key = `journal_${currentType.value}_${getDateKey()}`
  const saved = localStorage.getItem(key)
  if (saved) {
    const entry: JournalEntry = JSON.parse(saved)
    content.value = entry.content
    currentEntryId.value = entry.id
    saveStatus.value = `上次保存于 ${new Date(entry.updatedAt).toLocaleTimeString('zh-CN')}`
  } else {
    content.value = ''
    currentEntryId.value = null
    saveStatus.value = '新建'
  }
}

function loadHistory() {
  const entries: JournalEntry[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('journal_')) {
      try {
        const entry: JournalEntry = JSON.parse(localStorage.getItem(key)!)
        entries.push(entry)
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
  historyEntries.value = entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

function loadEntry(entry: JournalEntry) {
  currentType.value = entry.type
  // 解析日期
  const dateParts = entry.date.split('-')
  if (entry.type === 'monthly') {
    currentDate.value = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, 1)
  } else {
    currentDate.value = new Date(entry.date)
  }
  showHistory.value = false
}

// 监听类型和日期变化
watch([currentType, currentDate], () => {
  loadJournal()
})

// 处理路由参数
const handleRouteParams = () => {
  const dateParam = route.query.date as string
  const typeParam = route.query.type as JournalType
  
  if (typeParam && ['daily', 'weekly', 'monthly'].includes(typeParam)) {
    currentType.value = typeParam
  }
  
  if (dateParam) {
    const parsedDate = new Date(dateParam)
    if (!isNaN(parsedDate.getTime())) {
      currentDate.value = parsedDate
    }
  }
}

onMounted(() => {
  handleRouteParams()
  loadJournal()
  loadHistory()
})

// 监听路由参数变化
watch(() => route.query, () => {
  handleRouteParams()
}, { deep: true })
</script>

<style scoped>
.journal-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: #f8f9fa;
  position: relative;
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.type-selector {
  display: flex;
  gap: 8px;
}

.type-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.type-btn:hover {
  background: #e9ecef;
}

.type-btn.active {
  background: #42b983;
  color: #fff;
}

.date-navigator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-btn:hover {
  background: #42b983;
  color: #fff;
}

.current-date {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  min-width: 200px;
  text-align: center;
}

.today-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.today-btn:hover {
  background: #369970;
}

.journal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.editor-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.journal-editor {
  flex: 1;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  outline: none;
  font-family: 'Microsoft YaHei', sans-serif;
}

.journal-editor::placeholder {
  color: #aaa;
}

.journal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.save-status {
  color: #999;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #42b983;
  color: #42b983;
}

.action-btn.primary {
  background: #42b983;
  color: #fff;
  border-color: #42b983;
}

.action-btn.primary:hover {
  background: #369970;
}

/* 历史记录侧边栏 */
.history-sidebar {
  position: fixed;
  right: -320px;
  top: 0;
  width: 300px;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.history-sidebar.open {
  right: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.history-header h4 {
  margin: 0;
  color: #333;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.close-btn:hover {
  background: #e0e0e0;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f5f5;
}

.history-date {
  color: #333;
  font-size: 14px;
}

.history-type {
  color: #999;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.history-toggle {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
  transition: all 0.2s;
  z-index: 99;
}

.history-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(66, 185, 131, 0.4);
}
</style>
