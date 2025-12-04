<template>
  <div class="dropdown-selector" @click="toggleDropdown" v-click-outside="closeDropdown">
    <span class="dropdown-display">
      <span v-if="modelValue" class="selected-content">
        <span class="selected-icon">{{ getIcon(modelValue) }}</span>
        <span class="selected-label">{{ getLabel(modelValue) }}</span>
      </span>
      <span v-else class="placeholder-text">{{ placeholder }}</span>
    </span>
    <div class="dropdown-menu" v-show="showDropdown">
      <button
        v-for="option in options"
        :key="option.value"
        :class="['dropdown-item', { active: modelValue === option.value }]"
        @click.stop="selectOption(option.value)"
      >
        <span class="item-icon">{{ option.icon }}</span>
        <span class="item-label">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Option {
  value: string
  label: string
  icon: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showDropdown = ref(false)

// 自定义指令：点击外部关闭下拉框
const vClickOutside = {
  mounted(el: HTMLElement & { _clickOutside?: (event: MouseEvent) => void }, binding: { value: () => void }) {
    el._clickOutside = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement & { _clickOutside?: (event: MouseEvent) => void }) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside)
    }
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

function selectOption(value: string) {
  // 再次点击已选中的选项则取消选择
  const newValue = props.modelValue === value ? '' : value
  emit('update:modelValue', newValue)
  showDropdown.value = false
}

function getIcon(value: string): string {
  const option = props.options.find(o => o.value === value)
  return option ? option.icon : ''
}

function getLabel(value: string): string {
  const option = props.options.find(o => o.value === value)
  return option ? option.label : ''
}
</script>

<style scoped>
.dropdown-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 90px;
}

.dropdown-selector:hover {
  background: #e9ecef;
  border-color: #ccc;
}

.dropdown-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-icon {
  font-size: 18px;
}

.selected-label {
  font-size: 14px;
  color: #333;
}

.placeholder-text {
  font-size: 14px;
  color: #666;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 120px;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.15s;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: #f0f0f0;
}

.dropdown-item.active {
  background: rgba(66, 185, 131, 0.15);
  color: #42b983;
}

.item-icon {
  font-size: 16px;
}

.item-label {
  font-size: 12px;
}
</style>
