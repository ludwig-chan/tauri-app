<template>
  <div class="titlebar" data-tauri-drag-region>
    <button class="titlebar-button toggle-expand" @click="toggleExpand" @mousedown.stop :title="isExpanded ? '收起' : '展开'">
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none"
        :class="{ 'rotated': !isExpanded }"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="titlebar-search">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8.5 8.5L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input 
        type="text" 
        class="search-input" 
        placeholder="搜索..." 
        v-model="searchQuery"
        @click.stop
        @mousedown.stop
      />
    </div>
    <div class="titlebar-controls">
      <button class="titlebar-button settings" @click="goToSettings" title="设置">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 10.5C9.38071 10.5 10.5 9.38071 10.5 8C10.5 6.61929 9.38071 5.5 8 5.5C6.61929 5.5 5.5 6.61929 5.5 8C5.5 9.38071 6.61929 10.5 8 10.5Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M13.5 8.8V7.2L12.1 6.9C12 6.5 11.8 6.2 11.6 5.9L12.3 4.7L11.3 3.7L10.1 4.4C9.8 4.2 9.5 4 9.1 3.9L8.8 2.5H7.2L6.9 3.9C6.5 4 6.2 4.2 5.9 4.4L4.7 3.7L3.7 4.7L4.4 5.9C4.2 6.2 4 6.5 3.9 6.9L2.5 7.2V8.8L3.9 9.1C4 9.5 4.2 9.8 4.4 10.1L3.7 11.3L4.7 12.3L5.9 11.6C6.2 11.8 6.5 12 6.9 12.1L7.2 13.5H8.8L9.1 12.1C9.5 12 9.8 11.8 10.1 11.6L11.3 12.3L12.3 11.3L11.6 10.1C11.8 9.8 12 9.5 12.1 9.1L13.5 8.8Z" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
      <button class="titlebar-button" @click="minimizeWindow" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="2" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12">
          <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <path d="M3 3.5h7.5V11H3V3.5z" fill="none" stroke="currentColor" stroke-width="1"/>
          <path d="M1.5 1v7.5H3v-6h6V1H1.5z" fill="currentColor"/>
        </svg>
      </button>
      <button class="titlebar-button close" @click="closeWindow" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

defineProps<{
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  toggleExpand: [];
}>();

const appWindow = getCurrentWindow();
const router = useRouter();
const searchQuery = ref('');
const isMaximized = ref(false);

const updateMaximizedState = async () => {
  isMaximized.value = await appWindow.isMaximized();
};

onMounted(() => {
  updateMaximizedState();
  appWindow.onResized(() => {
    updateMaximizedState();
  });
});

const minimizeWindow = async () => {
  await appWindow.minimize();
};

const toggleMaximize = async () => {
  if (isMaximized.value) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
  await updateMaximizedState();
};

const closeWindow = async () => {
  await appWindow.close();
};

const goToSettings = () => {
  router.push('/settings');
};

const toggleExpand = () => {
  emit('toggleExpand');
};
</script>

<style scoped>
.titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background: #2c2c2c;
  color: #ffffff;
  user-select: none;
  -webkit-user-select: none;
  gap: 12px;
}

.titlebar-search {
  margin-left: 12px;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  height: 22px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0 8px;
  gap: 6px;
}

.search-icon {
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 12px;
  min-width: 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.titlebar-controls {
  display: flex;
  height: 100%;
}

.titlebar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

.titlebar-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.titlebar-button.settings {
  margin-right: auto;
}

.titlebar-button.close:hover {
  background-color: #e81123;
}

.titlebar-button.toggle-expand {
  width: 32px;
  margin-left: 4px;
}

.titlebar-button.toggle-expand svg {
  transition: transform 0.3s ease;
}

.titlebar-button.toggle-expand svg.rotated {
  transform: rotate(-90deg);
}

.titlebar-button svg {
  pointer-events: none;
}
</style>
