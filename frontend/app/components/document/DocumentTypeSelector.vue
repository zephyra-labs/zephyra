<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  modelValue: {
    type: String as PropType<'Invoice' | 'B/L' | 'COO' | 'PackingList' | 'Other'>,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'Invoice' | 'B/L' | 'COO' | 'PackingList' | 'Other'): void
}>()

const selectedType = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
    <select
      v-model="selectedType"
      class="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-400"
    >
      <option value="Invoice">Invoice</option>
      <option value="B/L">B/L</option>
      <option value="COO">COO</option>
      <option value="PackingList">PackingList</option>
      <option value="Other">Other</option>
    </select>
  </div>
</template>
