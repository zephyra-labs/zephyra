<script setup lang="ts">
defineProps<{
  role: 'admin' | 'importer' | 'exporter' | 'logistics' | 'none'
}>()

// Helper: badge text & warna berdasarkan role
const badge = {
  admin: { text: 'Admin', bg: 'bg-indigo-600', textColor: 'text-white' },
  importer: { text: 'Importer', bg: 'bg-blue-600', textColor: 'text-white' },
  exporter: { text: 'Exporter', bg: 'bg-purple-600', textColor: 'text-white' },
  logistics: { text: 'Logistic', bg: 'bg-green-600', textColor: 'text-white' },
  none: { text: 'None', bg: 'bg-gray-200 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' }
}
</script>

<template>
  <div class="mt-2 text-gray-700 dark:text-gray-300">
    <span class="font-medium">Your Role:</span>
    <span class="ml-2">
      <span
        :class="`${badge[role].bg} ${badge[role].textColor} px-2 py-1 rounded-full text-xs`"
      >
        {{ badge[role].text }}
      </span>
    </span>
  </div>
</template>
