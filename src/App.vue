
<template>
  <div class="container">
    <div class="tabs">
      <router-link to="/todos" class="tab" active-class="active">待办清单</router-link>
      <router-link to="/pomodoro" class="tab" active-class="active">番茄时钟</router-link>
      <router-link to="/week" class="tab" active-class="active">月历</router-link>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// No imports needed here anymore
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}
.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
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
</style>