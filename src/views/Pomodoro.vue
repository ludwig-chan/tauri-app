
<template>
  <div class="pomodoro-container">
    <h1>番茄时钟</h1>
    
    <!-- 待办事项选择区域 -->
    <div class="todo-selection">
      <label class="select-label">选择专注的任务：</label>
      <select v-model="selectedTodoId" class="todo-select" :disabled="isRunning || incompleteTodos.length === 0">
        <option value="">{{ incompleteTodos.length === 0 ? '暂无待办事项' : '选择一个任务...' }}</option>
        <option 
          v-for="todo in incompleteTodos" 
          :key="todo.id" 
          :value="todo.id"
        >
          {{ todo.content }} {{ todo.due_date ? `(${todo.due_date})` : '' }}
        </option>
      </select>
    </div>

    <!-- 计时器显示/编辑区域 -->
    <div class="timer-section">
      <div v-if="!isEditing" class="timer" @click="enableEditing" :class="{ 'editable': !isRunning }">
        {{ minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}
      </div>
      <div v-else class="timer-edit">
        <input 
          ref="timerInput"
          type="number" 
          v-model.number="inputMinutes" 
          min="1" 
          max="60"
          @blur="applyMinutes"
          @keyup.enter="applyMinutes"
          class="timer-input"
        />
        <span class="unit">分钟</span>
      </div>
      
      <!-- 快捷时长选项 -->
      <div v-if="!isRunning" class="quick-timers">
        <button 
          v-for="time in [5, 10, 15, 25, 45]" 
          :key="time"
          @click="setQuickTime(time)"
          class="quick-timer-btn"
          :class="{ 'active': inputMinutes === time }"
        >
          {{ time }}分钟
        </button>
      </div>
    </div>
    
    <div class="controls">
      <button 
        @click="isRunning ? pauseTimer() : startTimer()" 
        :disabled="!isRunning && (!selectedTodoId && incompleteTodos.length > 0)"
      >
        {{ isRunning ? '⏸️' : '▶️' }}
      </button>
      <button @click="resetTimer">🔄</button>
    </div>
    
    <!-- 番茄钟完成提示 -->
    <div v-if="showCompletionDialog" class="completion-dialog">
      <div class="completion-content">
        <h3>🍅 番茄钟完成！</h3>
        <p>你刚刚专注了 {{ inputMinutes }} 分钟</p>
        <div v-if="currentFocusTodo" class="task-completion">
          <p class="completion-task">专注任务：{{ currentFocusTodo.content }}</p>
          <div class="completion-actions">
            <button @click="markTaskCompleted" class="complete-btn">标记任务完成</button>
            <button @click="continueTask" class="continue-btn">继续此任务</button>
            <button @click="closeCompletionDialog" class="close-btn">关闭</button>
          </div>
        </div>
        <div v-else class="completion-actions">
          <button @click="closeCompletionDialog" class="close-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { todoStore, type TodoItem } from '../utils/todoStore';

const defaultMinutes = 25;
const inputMinutes = ref(defaultMinutes);
const minutes = ref(defaultMinutes);
const seconds = ref(0);
const isRunning = ref(false);
const isEditing = ref(false);
const timerInput = ref<HTMLInputElement | null>(null);
const timer = ref<number | null>(null);
const showCompletionDialog = ref(false);

// 待办事项相关状态
const selectedTodoId = ref<number | null>(null);
const currentFocusTodo = ref<TodoItem | null>(null);

// 使用共享的待办事项状态
const { 
  todos, 
  initializeTodos, 
  updateTodoStatus,
  findTodoById
} = todoStore;

// 获取所有未完成的待办事项（平铺结构）
const incompleteTodos = computed(() => {
  const getAllTodosFlat = (todoList: TodoItem[]): TodoItem[] => {
    const result: TodoItem[] = []
    for (const todo of todoList) {
      result.push(todo)
      if (todo.children && todo.children.length > 0) {
        result.push(...getAllTodosFlat(todo.children))
      }
    }
    return result
  }
  
  return getAllTodosFlat(todos.value).filter(todo => !todo.completed)
});

// 初始化数据库和加载待办事项
onMounted(async () => {
  try {
    await initializeTodos();
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

function startTimer() {
  if (isRunning.value) return;
  
  // 设置当前专注的任务
  if (selectedTodoId.value) {
    currentFocusTodo.value = findTodoById(todos.value, selectedTodoId.value);
  } else if (incompleteTodos.value.length > 0) {
    // 如果有未完成的任务但用户没有选择，则不能开始
    return;
  }
  
  isRunning.value = true;
  showCompletionDialog.value = false;
  timer.value = setInterval(() => {
    if (seconds.value === 0) {
      if (minutes.value === 0) {
        clearInterval(timer.value!);
        isRunning.value = false;
        showCompletionDialog.value = true;
        return;
      } else {
        minutes.value--;
        seconds.value = 59;
      }
    } else {
      seconds.value--;
    }
  }, 1000);
}

function pauseTimer() {
  if (timer.value) {
    clearInterval(timer.value);
    isRunning.value = false;
  }
}

function resetTimer() {
  if (timer.value) clearInterval(timer.value);
  isRunning.value = false;
  showCompletionDialog.value = false;
  minutes.value = inputMinutes.value;
  seconds.value = 0;
  currentFocusTodo.value = null;
  selectedTodoId.value = null;
}

function enableEditing() {
  if (!isRunning.value) {
    isEditing.value = true;
    nextTick(() => {
      timerInput.value?.focus();
      timerInput.value?.select();
    });
  }
}

function applyMinutes() {
  if (timer.value) clearInterval(timer.value);
  isRunning.value = false;
  isEditing.value = false;
  showCompletionDialog.value = false;
  minutes.value = inputMinutes.value;
  seconds.value = 0;
}

function setQuickTime(time: number) {
  inputMinutes.value = time;
  applyMinutes();
}

// 处理任务完成
const markTaskCompleted = async () => {
  if (currentFocusTodo.value) {
    try {
      await updateTodoStatus(currentFocusTodo.value.id, true);
      closeCompletionDialog();
    } catch (error) {
      console.error('标记任务完成失败:', error);
    }
  }
};

// 继续当前任务
const continueTask = () => {
  // 保持当前选择的任务，重置计时器准备下一个番茄钟
  resetTimer();
  if (currentFocusTodo.value) {
    selectedTodoId.value = currentFocusTodo.value.id;
  }
};

// 关闭完成对话框
const closeCompletionDialog = () => {
  showCompletionDialog.value = false;
  currentFocusTodo.value = null;
  selectedTodoId.value = null;
  resetTimer();
};

// 防止页面卸载时计时器未清理
watch(isRunning, (val) => {
  if (!val && timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style scoped>
.pomodoro-container {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  background: #fff6f2;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}

h1 {
  color: #e74c3c;
  margin-bottom: 24px;
}

/* 待办事项选择区域 */
.todo-selection {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s;
}

.todo-selection:has(.todo-select:disabled) {
  background: #e8f5e8;
  border-color: #28a745;
}

.select-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.todo-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #495057;
}

.todo-select:disabled {
  background: #fff;
  color: #155724;
  cursor: not-allowed;
  font-weight: 600;
}

/* 计时器编辑样式 */
.timer-section {
  position: relative;
}

.timer {
  font-size: 3rem;
  font-weight: bold;
  margin: 24px 0;
  color: #333;
  transition: all 0.2s;
}

.timer.editable {
  cursor: pointer;
  color: #e74c3c;
}

.timer.editable:hover {
  transform: scale(1.05);
}

.timer-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 0;
}

.timer-input {
  font-size: 2.5rem;
  font-weight: bold;
  width: 120px;
  padding: 8px;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  text-align: center;
  outline: none;
}

.timer-input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.unit {
  font-size: 1.2rem;
  color: #6c757d;
}

.timer-hint {
  font-size: 0.875rem;
  color: #999;
  margin-top: -16px;
  margin-bottom: 16px;
}

.controls button {
  margin: 0 8px;
  padding: 10px 20px;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  background: #e74c3c;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.controls button:hover:not(:disabled) {
  background: #c0392b;
}

/* 完成对话框 */
.completion-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.completion-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.completion-content h3 {
  color: #e74c3c;
  margin-bottom: 16px;
  font-size: 24px;
}

.completion-content p {
  color: #6c757d;
  margin-bottom: 20px;
}

.completion-task {
  font-weight: 600;
  color: #495057;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.completion-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.complete-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.complete-btn:hover {
  background: #218838;
}

.continue-btn {
  background: #fd7e14;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.continue-btn:hover {
  background: #e85b00;
}

.close-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #545b62;
}

/* 计时器编辑样式 */
.timer-section {
  position: relative;
}

.timer {
  font-size: 3rem;
  font-weight: bold;
  margin: 24px 0;
  color: #333;
  transition: all 0.2s;
}

.timer.editable {
  cursor: pointer;
  color: #e74c3c;
}

.timer.editable:hover {
  transform: scale(1.05);
}

.timer-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 0;
}

.timer-input {
  font-size: 2.5rem;
  font-weight: bold;
  width: 120px;
  padding: 8px;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  text-align: center;
  outline: none;
}

.timer-input:focus {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.unit {
  font-size: 1.2rem;
  color: #6c757d;
}

/* 快捷时长按钮 */
.quick-timers {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
  margin-bottom: 8px;
}

.quick-timer-btn {
  padding: 6px 12px;
  border: 2px solid #e9ecef;
  border-radius: 20px;
  background: white;
  color: #6c757d;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-timer-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.quick-timer-btn.active {
  background: #e74c3c;
  border-color: #e74c3c;
  color: white;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .pomodoro-container {
    margin: 20px;
    padding: 16px;
  }
  
  .timer {
    font-size: 2.5rem;
  }
  
  .completion-actions {
    flex-direction: column;
  }
  
  .completion-actions button {
    width: 100%;
    margin: 4px 0;
  }
}
</style>
