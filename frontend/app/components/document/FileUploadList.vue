<script setup lang="ts">
import type { PropType } from 'vue'

export interface FileProgress {
  file: File
  progress: number
  status: string
  tokenId?: number
}

 defineProps({
  files: {
    type: Array as PropType<File[]>,
    required: true
  },
  fileProgresses: {
    type: Array as PropType<FileProgress[]>,
    required: true
  }
})

defineEmits<{
  (e: 'remove', index: number): void
  (e: 'change', event: Event): void
}>()
</script>

<template>
  <div class="space-y-2 mb-4">
    <!-- Input file -->
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Files</label>
    <input
      type="file"
      multiple
      class="block w-full text-sm text-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-blue-400"
      @change="$emit('change', $event)"
    />

    <!-- File list -->
    <div v-for="(fp, i) in fileProgresses" :key="fp.file.name" class="space-y-1 mt-2">
      <div class="flex justify-between items-center text-sm">
        <span class="truncate">{{ fp.file.name }}</span>
        <div class="flex items-center gap-2">
          <span v-if="fp.status==='success'" class="text-green-600">✅ Token ID: {{ fp.tokenId }}</span>
          <span v-else-if="fp.status==='error'" class="text-red-600">❌ Failed</span>
          <span v-else class="text-gray-500">{{ fp.status }}</span>
          <button class="text-red-500 hover:text-red-700" @click="$emit('remove', i)">✕</button>
        </div>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          :style="{ width: fp.progress + '%' }"
          :class="fp.status==='error' ? 'bg-red-500' : 'bg-blue-600'"
          class="h-2 rounded-full transition-all"
        ></div>
      </div>
    </div>
  </div>
</template>
