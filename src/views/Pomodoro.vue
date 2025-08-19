
<template>
  <div class="pomodoro-container">
    <h1>番茄时钟</h1>
    <div class="timer">{{ minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}</div>
    <div class="controls">
      <button @click="startTimer" :disabled="isRunning">开始</button>
      <button @click="pauseTimer" :disabled="!isRunning">暂停</button>
      <button @click="resetTimer">重置</button>
    </div>
    <div v-if="showAlert" class="alert">时间到！休息一下吧！</div>
    <div class="settings">
      <label>
        设置时长：
        <input type="number" v-model.number="inputMinutes" min="1" max="60" /> 分钟
      </label>
      <button @click="applyMinutes">应用</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const defaultMinutes = 25;
const inputMinutes = ref(defaultMinutes);
const minutes = ref(defaultMinutes);
const seconds = ref(0);
const isRunning = ref(false);
const timer = ref<number | null>(null);
const showAlert = ref(false);

function startTimer() {
  if (isRunning.value) return;
  isRunning.value = true;
  showAlert.value = false;
  timer.value = setInterval(() => {
    if (seconds.value === 0) {
      if (minutes.value === 0) {
        clearInterval(timer.value!);
        isRunning.value = false;
        showAlert.value = true;
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
  showAlert.value = false;
  minutes.value = inputMinutes.value;
  seconds.value = 0;
}

function applyMinutes() {
  if (timer.value) clearInterval(timer.value);
  isRunning.value = false;
  showAlert.value = false;
  minutes.value = inputMinutes.value;
  seconds.value = 0;
}

// 防止页面卸载时计时器未清理
watch(isRunning, (val) => {
  if (!val && timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style scoped>
.pomodoro-container {
  max-width: 350px;
  margin: 40px auto;
  padding: 24px;
  background: #fff6f2;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}
h1 {
  color: #e74c3c;
  margin-bottom: 16px;
}
.timer {
  font-size: 3rem;
  font-weight: bold;
  margin: 24px 0;
  color: #333;
}
.controls button {
  margin: 0 8px;
  padding: 8px 20px;
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
.alert {
  margin-top: 18px;
  color: #fff;
  background: #e74c3c;
  padding: 10px 0;
  border-radius: 6px;
  font-weight: bold;
}
.settings {
  margin-top: 24px;
  font-size: 1rem;
}
.settings input {
  width: 60px;
  margin: 0 8px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.settings button {
  margin-left: 10px;
  padding: 4px 14px;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  background: #e67e22;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.settings button:active {
  background: #d35400;
}
</style>
