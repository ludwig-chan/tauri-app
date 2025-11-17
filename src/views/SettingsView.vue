<template>
  <div class="settings-view">
    <h1 class="title">设置</h1>
    
    <div class="settings-section">
      <h2 class="section-title">常规设置</h2>
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">启动时自动运行</span>
          <span class="label-desc">应用程序将在系统启动时自动运行</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="settings.autoStart">
          <span class="slider"></span>
        </label>
      </div>
      
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">最小化到系统托盘</span>
          <span class="label-desc">关闭窗口时最小化到系统托盘而不是退出</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="settings.minimizeToTray">
          <span class="slider"></span>
        </label>
      </div>
    </div>
    
    <div class="settings-section">
      <h2 class="section-title">外观</h2>
      <div class="setting-item">
        <div class="setting-label">
          <span class="label-text">主题</span>
          <span class="label-desc">选择应用程序的主题</span>
        </div>
        <select v-model="settings.theme" class="select-input">
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="auto">跟随系统</option>
        </select>
      </div>
    </div>
    
    <div class="settings-section">
      <h2 class="section-title">关于</h2>
      <div class="about-info">
        <div class="info-row">
          <span class="info-label">版本号：</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-row">
          <span class="info-label">构建日期：</span>
          <span class="info-value">2025-01-14</span>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button class="btn btn-primary" @click="saveSettings">保存设置</button>
      <button class="btn btn-secondary" @click="resetSettings">重置为默认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Settings {
  autoStart: boolean
  minimizeToTray: boolean
  theme: 'light' | 'dark' | 'auto'
}

const settings = ref<Settings>({
  autoStart: false,
  minimizeToTray: true,
  theme: 'auto'
})

onMounted(() => {
  loadSettings()
})

const loadSettings = () => {
  const saved = localStorage.getItem('app-settings')
  if (saved) {
    try {
      settings.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('app-settings', JSON.stringify(settings.value))
    // 这里可以添加保存成功的提示
    alert('设置已保存')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('保存设置失败')
  }
}

const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？')) {
    settings.value = {
      autoStart: false,
      minimizeToTray: true,
      theme: 'auto'
    }
    saveSettings()
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
}

.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.label-text {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.label-desc {
  font-size: 13px;
  color: #666;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #42b983;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.select-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select-input:hover {
  border-color: #42b983;
}

.select-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.about-info {
  padding: 12px 0;
}

.info-row {
  display: flex;
  padding: 8px 0;
  font-size: 14px;
}

.info-label {
  color: #666;
  min-width: 100px;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #35a372;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn:active {
  transform: translateY(0);
}
</style>
