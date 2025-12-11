<template>
  <div class="tabs" @wheel="handleWheel">
    <template v-for="(group, groupIndex) in navGroups" :key="group.name">
      <!-- 分隔线（第一组不需要） -->
      <div v-if="groupIndex > 0" class="separator"></div>
      
      <router-link
        v-for="tab in group.tabs"
        :key="tab.path"
        :to="tab.path"
        class="tab"
        active-class="active"
      >
        {{ tab.label }}
      </router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { navGroups } from '../utils/navTabs'

const handleWheel = (event: WheelEvent) => {
  const container = event.currentTarget as HTMLElement
  // 阻止默认的垂直滚动
  event.preventDefault()
  // 将垂直滚动转换为横向滚动
  container.scrollLeft += event.deltaY
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 16px;
  padding: 20px 20px 0 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  align-items: center;
}

.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.separator {
  width: 1px;
  height: 24px;
  background: #d0d0d0;
  flex-shrink: 0;
  margin: 0 4px;
}

.tab {
  padding: 8px 20px;
  border-radius: 6px 6px 0 0;
  background: #f5f5f5;
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab.active {
  background: #42b983;
  color: #fff;
}

.tab:not(.active):hover {
  background: #e0e0e0;
}
</style>
