<template>
  <div class="tabs">
    <router-link
      v-for="tab in navTabs"
      :key="tab.path"
      :to="tab.path"
      class="tab"
      active-class="active"
    >
      <span class="tab-emoji" :aria-label="tab.label">{{ tab.emoji }}</span>
      {{ tab.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { navTabs } from '../utils/navTabs'
</script>

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
