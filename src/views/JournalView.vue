<template>
  <div class="journal-view">
    <div class="journal-header">
      <IconDropdown
        v-model="currentType"
        :options="journalTypes"
        placeholder="📝 日记"
      />
      <DatePicker v-model="currentDate" :mode="currentType" />
    </div>

    <!-- 天气、心情和地点选择器 -->
    <div class="mood-weather-section">
      <div class="selector-group" v-if="currentType === 'daily'">
        <IconDropdown
          v-model="weather"
          :options="weatherOptions"
          placeholder="🌤️ 天气"
          @update:model-value="autoSave"
        />
      </div>
      <div class="selector-group">
        <IconDropdown
          v-model="mood"
          :options="moodOptions"
          placeholder="😊 心情"
          @update:model-value="autoSave"
        />
      </div>
      <div class="selector-group location-group">
        <span class="selector-label">📍</span>
        <input
          v-model="location"
          type="text"
          class="location-input"
          placeholder="记录当前位置..."
          @input="autoSave"
        />
      </div>
    </div>

    <!-- 标签区域 -->
    <div class="tags-section">
      <span class="tags-label">🏷️ 标签</span>
      <div class="tags-container">
        <span
          v-for="tag in tags"
          :key="tag"
          class="tag-item"
        >
          {{ tag }}
          <button class="tag-remove" @click="removeTag(tag)">×</button>
        </span>
        <div class="tag-input-wrapper">
          <input
            ref="tagInputRef"
            v-model="tagInput"
            type="text"
            class="tag-input"
            placeholder="输入或选择标签..."
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            @focus="showSuggestedTags = true"
            @blur="handleTagInputBlur"
          />
          <div class="suggested-dropdown" v-show="showSuggestedTags && suggestedTags.length > 0">
            <button
              v-for="tag in suggestedTags"
              :key="tag"
              class="suggested-tag"
              @mousedown.prevent="addSuggestedTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
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
import DatePicker from '@/components/ui/DatePicker.vue'
import IconDropdown from '@/components/ui/IconDropdown.vue'

type JournalType = 'daily' | 'weekly' | 'monthly'
type WeatherType = 'sunny' | 'cloudy' | 'overcast' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'foggy' | ''
type MoodType = 'happy' | 'excited' | 'peaceful' | 'neutral' | 'tired' | 'sad' | 'anxious' | 'angry' | ''

interface JournalEntry {
  id: number
  type: JournalType
  date: string
  content: string
  weather?: WeatherType
  mood?: MoodType
  location?: string
  tags?: string[]
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

const weatherOptions = [
  { value: 'sunny' as WeatherType, label: '晴天', icon: '☀️' },
  { value: 'cloudy' as WeatherType, label: '多云', icon: '⛅' },
  { value: 'overcast' as WeatherType, label: '阴天', icon: '☁️' },
  { value: 'rainy' as WeatherType, label: '下雨', icon: '🌧️' },
  { value: 'stormy' as WeatherType, label: '雷雨', icon: '⛈️' },
  { value: 'snowy' as WeatherType, label: '下雪', icon: '❄️' },
  { value: 'windy' as WeatherType, label: '大风', icon: '💨' },
  { value: 'foggy' as WeatherType, label: '雾霾', icon: '🌫️' }
]

const moodOptions = [
  { value: 'happy' as MoodType, label: '开心', icon: '😊' },
  { value: 'excited' as MoodType, label: '兴奋', icon: '🤩' },
  { value: 'peaceful' as MoodType, label: '平静', icon: '😌' },
  { value: 'neutral' as MoodType, label: '一般', icon: '😐' },
  { value: 'tired' as MoodType, label: '疲惫', icon: '😫' },
  { value: 'sad' as MoodType, label: '难过', icon: '😢' },
  { value: 'anxious' as MoodType, label: '焦虑', icon: '😰' },
  { value: 'angry' as MoodType, label: '生气', icon: '😠' }
]

const currentType = ref<JournalType>('daily')
const currentDate = ref(new Date())
const content = ref('')
const weather = ref<WeatherType>('')
const mood = ref<MoodType>('')
const location = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)
const showSuggestedTags = ref(false)
const saveStatus = ref('未保存')
const showHistory = ref(false)
const historyEntries = ref<JournalEntry[]>([])
const currentEntryId = ref<number | null>(null)

// 从历史记录中提取常用标签
const suggestedTags = computed(() => {
  const allTags: Record<string, number> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('journal_')) {
      try {
        const entry: JournalEntry = JSON.parse(localStorage.getItem(key)!)
        if (entry.tags) {
          entry.tags.forEach(tag => {
            allTags[tag] = (allTags[tag] || 0) + 1
          })
        }
      } catch (e) {
        // 忽略
      }
    }
  }
  
  // 预置标签列表
  const presetTags = [
    '工作', '学习', '生活', '旅行', '运动',
    '读书', '灵感', '反思', '感恩', '目标'
  ]
  
  // 合并历史标签和预置标签
  const historyTags = Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
  
  // 优先显示历史常用标签，再补充预置标签
  const combinedTags = [...new Set([...historyTags, ...presetTags])]
  
  return combinedTags
    .filter(tag => !tags.value.includes(tag))
    .slice(0, 6)
})

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

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

// 格式化日期用于保存
function getFormattedDate(): string {
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

function addTag() {
  const tag = tagInput.value.trim().replace(/,/g, '')
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    autoSave()
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  const index = tags.value.indexOf(tag)
  if (index > -1) {
    tags.value.splice(index, 1)
    autoSave()
  }
}

function addSuggestedTag(tag: string) {
  if (!tags.value.includes(tag)) {
    tags.value.push(tag)
    autoSave()
  }
}

function handleTagInputBlur() {
  // 延迟隐藏，让 mousedown 事件有时间触发
  setTimeout(() => {
    showSuggestedTags.value = false
  }, 150)
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
      weather: weather.value,
      mood: mood.value,
      location: location.value,
      tags: tags.value,
      displayDate: getFormattedDate(),
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
    weather.value = entry.weather || ''
    mood.value = entry.mood || ''
    location.value = entry.location || ''
    tags.value = entry.tags || []
    tagInput.value = ''
    currentEntryId.value = entry.id
    saveStatus.value = `上次保存于 ${new Date(entry.updatedAt).toLocaleTimeString('zh-CN')}`
  } else {
    content.value = ''
    weather.value = ''
    mood.value = ''
    location.value = ''
    tags.value = []
    tagInput.value = ''
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

.mood-weather-section {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.selector-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  font-size: 14px;
  color: #666;
}

.location-group {
  flex: 1;
  min-width: 200px;
}

.location-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #f9f9f9;
  transition: all 0.2s;
  outline: none;
}

.location-input:focus {
  border-color: #42b983;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

.location-input::placeholder {
  color: #aaa;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tags-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 16px;
  font-size: 13px;
}

.tag-remove {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tag-remove:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

.tag-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 150px;
}

.tag-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px dashed #ccc;
  border-radius: 16px;
  font-size: 13px;
  color: #333;
  background: transparent;
  outline: none;
  transition: all 0.2s;
}

.tag-input:focus {
  border-color: #42b983;
  border-style: solid;
  background: #fff;
}

.tag-input::placeholder {
  color: #aaa;
}

.suggested-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  padding: 8px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  z-index: 10;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggested-tag {
  padding: 4px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  background: #fafafa;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggested-tag:hover {
  border-color: #42b983;
  color: #42b983;
  background: rgba(66, 185, 131, 0.08);
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
