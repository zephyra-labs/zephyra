<script setup lang="ts">
import { Loader2, Plus, Minus, Users } from 'lucide-vue-next'

// Props dari parent
defineProps<{
  isAdmin: boolean
  minterAddress: string
  addingMinter: boolean
  removingMinter: boolean
  approvedMintersKYC: string[]
  loadingMintersKYC: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:minterAddress', value: string): void
  (e: 'addMinter'): void
  (e: 'removeMinter'): void
}>()

// Input handler
const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  emit('update:minterAddress', val)
}
</script>

<template>
  <div v-if="isAdmin" class="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
    <h3 class="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-lg">
      <Users class="w-5 h-5" /> Manage Minters
    </h3>

    <!-- Minter input -->
    <div class="flex flex-col sm:flex-row gap-2 items-stretch">
      <input
        :value="minterAddress"
        type="text"
        placeholder="Enter minter address"
        class="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
        @input="onInput"
      />

      <div class="flex gap-2 flex-shrink-0">
        <button
          class="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          :disabled="addingMinter || !minterAddress || approvedMintersKYC.includes(minterAddress.toLowerCase())"
          @click="emit('addMinter')"
        >
          <Loader2 v-if="addingMinter" class="w-4 h-4 animate-spin" />
          <Plus v-else class="w-4 h-4" /> Add
        </button>

        <button
          class="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          :disabled="removingMinter || !minterAddress || !approvedMintersKYC.includes(minterAddress.toLowerCase())"
          @click="emit('removeMinter')"
        >
          <Loader2 v-if="removingMinter" class="w-4 h-4 animate-spin" />
          <Minus v-else class="w-4 h-4" /> Remove
        </button>
      </div>
    </div>

    <!-- Approved Minters List -->
    <div class="mt-2">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Approved Minters:</p>
      <div class="flex flex-wrap gap-2 mt-1 max-h-36 overflow-y-auto">
        <span
          v-for="addr in approvedMintersKYC"
          :key="addr"
          class="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono truncate max-w-[180px] hover:brightness-200 transition-transform"
          :title="addr"
        >
          {{ addr }}
        </span>
        <span v-if="loadingMintersKYC" class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Loader2 class="w-3 h-3 animate-spin" /> Loading...
        </span>
      </div>
    </div>
  </div>
</template>
