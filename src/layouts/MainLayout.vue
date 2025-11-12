<template>
  <div class="main-layout">
    <div class="tabs">
      <router-link to="/week" class="tab" active-class="active">月历</router-link>
      <router-link to="/screenshot" class="tab" active-class="active">截图贴图</router-link>
      <router-link to="/clipboard" class="tab" active-class="active">剪贴板</router-link>
      <router-link to="/pomodoro" class="tab" active-class="active">番茄时钟</router-link>
      <router-link to="/todos" class="tab" active-class="active">待办清单</router-link>
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tabs {
  display: flex;
  gap: 16px;
  padding: 20px 20px 0 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  padding: 8px 20px;
  border-radius: 6px 6px 0 0;
  background: #f5f5f5;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}

.tab.active {
  background: #42b983;
  color: #fff;
}

.tab:not(.active):hover {
  background: #e0e0e0;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
