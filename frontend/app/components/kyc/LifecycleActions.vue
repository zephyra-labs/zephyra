<script setup lang="ts">
import { Loader2, PenLine, Signature, Ban } from 'lucide-vue-next'

interface Props {
  tokenId: bigint | null
  processing: boolean
  handleReview: () => Promise<void>
  handleSign: () => Promise<void>
  handleRevoke: () => Promise<void>
  isAdmin: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div v-if="props.tokenId && props.isAdmin" class="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
    <h3 class="font-semibold text-gray-800 dark:text-gray-100">Lifecycle Actions</h3>
    <div class="flex flex-wrap gap-2">
      <button
        class="flex-1 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        :disabled="props.processing"
        @click="props.handleReview"
      >
        <Loader2 v-if="props.processing" class="w-4 h-4 animate-spin" />
        <PenLine v-else class="w-4 h-4" /> Review
      </button>
      <button
        class="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        :disabled="props.processing"
        @click="props.handleSign"
      >
        <Loader2 v-if="props.processing" class="w-4 h-4 animate-spin" />
        <Signature v-else class="w-4 h-4" /> Sign
      </button>
      <button
        class="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        :disabled="props.processing"
        @click="props.handleRevoke"
      >
        <Loader2 v-if="props.processing" class="w-4 h-4 animate-spin" />
        <Ban v-else class="w-4 h-4" /> Revoke
      </button>
    </div>
  </div>
</template>
