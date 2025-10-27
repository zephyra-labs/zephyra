<script setup lang="ts">
import type { Ref } from 'vue'
import { FileUp, Loader2 } from 'lucide-vue-next'

interface Props {
  selectedFile: File | null
  minting: Ref<boolean>
  onFileChange: (e: Event) => void
  verifyAndMint: () => Promise<void>
}

const props = defineProps<Props>()
</script>

<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</label>
    <input
      type="file"
      class="block w-full text-sm border rounded-lg cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
      @change="props.onFileChange"
    />
    <div v-if="props.selectedFile" class="flex items-center justify-between mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-700/50">
      <span class="text-gray-700 dark:text-gray-200 truncate">{{ props.selectedFile.name }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-300">{{ (props.selectedFile.size / 1024).toFixed(1) }} KB</span>
    </div>
    <button
      class="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      :disabled="!props.selectedFile || props.minting.value"
      @click="props.verifyAndMint"
    >
      <Loader2 v-if="props.minting.value" class="w-4 h-4 animate-spin" />
      <FileUp v-else class="w-4 h-4" />
      {{ props.minting.value ? 'Minting...' : 'Verify & Mint' }}
    </button>
  </div>
</template>
