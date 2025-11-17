<template>
  <div class="main-layout">
    <TitleBar :is-expanded="isExpanded" @toggle-expand="toggleExpand" />
    <transition name="expand">
      <div v-show="isExpanded" class="expandable-content">
        <NavigationTabs />
        <div class="content">
          <router-view />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TitleBar from '../components/TitleBar.vue';
import NavigationTabs from '../components/NavigationTabs.vue';

const isExpanded = ref(true);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.expandable-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 100vh;
}
</style>
