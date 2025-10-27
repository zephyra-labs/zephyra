<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | null
  deployedContracts: string[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const selectedContract = computed({
  get: () => props.modelValue,
  set: (val: string | null) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Select Contract
    </label>
    <select
      v-model="selectedContract"
      class="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-400"
    >
      <option disabled value="">-- Select a contract --</option>
      <option v-for="addr in deployedContracts" :key="addr" :value="addr">
        {{ addr }}
      </option>
    </select>
  </div>
</template>
