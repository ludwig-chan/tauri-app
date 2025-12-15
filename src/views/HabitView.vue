<template>
  <div class="habit-container">
    <div class="header">
      <h1 class="title">习惯养成</h1>
      <button class="add-button" @click="openAddDialog">+ 新建习惯</button>
    </div>

    <div v-if="habits.length === 0" class="empty-state">
      <p>还没有创建任何习惯，点击"新建习惯"开始吧！</p>
    </div>

    <div v-else class="habits-list">
      <HabitItem 
        v-for="habit in habits" 
        :key="habit.id" 
        :habit="habit"
        :completions="habitCompletions[habit.id] || []"
        @edit="openEditDialog"
        @delete="handleDeleteHabit"
        @toggle-complete="handleToggleComplete"
      />
    </div>

    <HabitDialog 
      :visible="dialogVisible"
      :habit="editingHabit"
      @close="closeDialog"
      @save="handleSaveHabit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { habitDb, type Habit, type HabitCompletion } from '../utils/habitDb'
import HabitItem from '../components/ui/HabitItem.vue'
import HabitDialog from '../components/ui/HabitDialog.vue'

const habits = ref<Habit[]>([])
const habitCompletions = ref<Record<number, HabitCompletion[]>>({})
const dialogVisible = ref(false)
const editingHabit = ref<Habit | null>(null)

// 加载习惯列表
const loadHabits = async () => {
  try {
    habits.value = await habitDb.getAllHabits()
    // 加载每个习惯最近30天的完成记录
    for (const habit of habits.value) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      habitCompletions.value[habit.id] = await habitDb.getHabitCompletions(
        habit.id,
        startDate.toISOString().split('T')[0]
      )
    }
  } catch (error) {
    console.error('加载习惯列表失败:', error)
  }
}

// 初始化
onMounted(async () => {
  try {
    await habitDb.initTables()
    await loadHabits()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 打开新建对话框
const openAddDialog = () => {
  editingHabit.value = null
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (habit: Habit) => {
  editingHabit.value = habit
  dialogVisible.value = true
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  editingHabit.value = null
}

// 保存习惯
const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    if (editingHabit.value) {
      // 更新
      await habitDb.updateHabit(editingHabit.value.id, habitData)
    } else {
      // 新建
      await habitDb.createHabit(habitData)
    }
    await loadHabits()
    closeDialog()
  } catch (error) {
    console.error('保存习惯失败:', error)
  }
}

// 删除习惯
const handleDeleteHabit = async (id: number) => {
  if (confirm('确定要删除这个习惯吗？')) {
    try {
      await habitDb.deleteHabit(id)
      await loadHabits()
    } catch (error) {
      console.error('删除习惯失败:', error)
    }
  }
}

// 切换完成状态
const handleToggleComplete = async (data: {
  habitId: number
  date: string
  timePeriod: string | null
  completed: boolean
}) => {
  try {
    if (data.completed) {
      await habitDb.markHabitComplete(data.habitId, data.date, data.timePeriod)
    } else {
      await habitDb.unmarkHabitComplete(data.habitId, data.date, data.timePeriod)
    }
    // 重新加载该习惯的完成记录
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    habitCompletions.value[data.habitId] = await habitDb.getHabitCompletions(
      data.habitId,
      startDate.toISOString().split('T')[0]
    )
  } catch (error) {
    console.error('更新完成状态失败:', error)
  }
}
</script>

<style scoped>
.habit-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  color: #2c3e50;
  margin: 0;
}

.add-button {
  padding: 12px 24px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-button:hover {
  background: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 18px;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
