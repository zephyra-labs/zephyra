<script setup lang="ts">
import { Plus, RefreshCw } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'new-contract'): void
  (e: 'refresh'): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <!-- Title -->
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Contract Management
      </h1>
      <p class="text-gray-500 text-sm">
        Manage, deploy, and monitor trade contracts.
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- New Contract Button -->
      <button
        class="inline-flex items-center gap-1 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('new-contract')"
      >
        <Plus class="w-4 h-4" />
        New Contract
      </button>

      <!-- Refresh Button -->
      <button
        class="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('refresh')"
      >
        <RefreshCw class="w-4 h-4" />
        Refresh
      </button>
    </div>
  </div>
</template>
