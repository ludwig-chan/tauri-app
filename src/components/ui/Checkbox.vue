<template>
  <input
    type="checkbox"
    :checked="modelValue"
    @change="$emit('update:modelValue', $event.target.checked)"
    class="custom-checkbox"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.custom-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  position: relative;
  transition: background-color 0.2s, border-color 0.2s;
}

.custom-checkbox:checked {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.custom-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 14px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.custom-checkbox:hover {
  border-color: #45a049;
}
</style>
