<template>
  <div class="tabs">
    <router-link to="/week" class="tab" active-class="active">
      <span class="tab-emoji" aria-label="月历">📅</span>
      月历
    </router-link>
    <router-link to="/clipboard" class="tab" active-class="active">
      <span class="tab-emoji" aria-label="剪贴板">📋</span>
      剪贴板
    </router-link>
    <router-link to="/pomodoro" class="tab" active-class="active">
      <span class="tab-emoji" aria-label="番茄时钟">🍅</span>
      番茄时钟
    </router-link>
    <router-link to="/todos" class="tab" active-class="active">
      <span class="tab-emoji" aria-label="待办清单">✅</span>
      待办清单
    </router-link>
    <router-link to="/random-alarm" class="tab" active-class="active">
      <span class="tab-emoji" aria-label="随机闹钟">⏰</span>
      随机闹钟
    </router-link>
  </div>
</template>

<style scoped>
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

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-emoji {
  font-size: 20px;
  vertical-align: middle;
}

.tab.active {
  background: #42b983;
  color: #fff;
}

.tab:not(.active):hover {
  background: #e0e0e0;
}
</style>
