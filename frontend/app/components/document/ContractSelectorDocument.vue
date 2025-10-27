<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | null
  userRole: 'importer' | 'exporter' | 'admin' | 'logistics' | null
  userIsMinter: boolean
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
    <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Role:</span>

        <span v-if="userRole==='importer'" class="px-2 py-1 rounded-full text-white text-xs bg-green-600">Importer</span>
        <span v-else-if="userRole==='exporter'" class="px-2 py-1 rounded-full text-white text-xs bg-blue-600">Exporter</span>
        <span v-else-if="userRole==='admin'" class="px-2 py-1 rounded-full text-white text-xs bg-indigo-600">Admin</span>

        <span v-if="userIsMinter" class="px-2 py-1 rounded-full text-white text-xs bg-purple-600">Approved Minter</span>

        <span v-if="!userRole && !userIsMinter" class="text-sm text-gray-500 dark:text-gray-400">No role assigned</span>
    </div>

    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Contract</label>
    <select
        v-model="selectedContract"
        class="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-400"
    >
        <option class="text-gray-700 dark:text-gray-300" disabled value="">-- Select a contract --</option>
        <option v-for="addr in deployedContracts" :key="addr" :value="addr">{{ addr }}</option>
    </select>
    </div>
</template>
