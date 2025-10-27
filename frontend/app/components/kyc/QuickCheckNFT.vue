<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import type { KYC } from '~/types/Kyc'

interface Props {
  modelValue: bigint | null
  nftInfo: KYC | null
  checkNFT: () => Promise<void>
  isAdmin: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: bigint | null): void
}>()

const localTokenId = ref<string>(props.modelValue?.toString() ?? '')

watch(localTokenId, (val) => {
  const str = val !== null && val !== undefined ? String(val).trim() : ''
  if (str !== '') {
    try {
      emit('update:modelValue', BigInt(str))
    } catch {
      emit('update:modelValue', null)
    }
  } else {
    emit('update:modelValue', null)
  }
})

// computed class untuk status
const statusClass = computed(() => {
  if (!props.nftInfo) return ''
  switch (props.nftInfo.status) {
    case 'Draft':
      return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    case 'Reviewed':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
    case 'Signed':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
    case 'Revoked':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
    default:
      return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }
})
</script>

<template>
  <div v-if="props.isAdmin" class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
    <h3 class="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
      <Search class="w-5 h-5" /> Quick Check NFT
    </h3>

    <!-- Input token ID -->
    <div class="flex gap-2 flex-wrap">
      <input
        v-model="localTokenId"
        type="number"
        placeholder="Enter token ID"
        class="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        class="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        :disabled="!localTokenId || localTokenId.toString() === ''"
        @click="props.checkNFT"
      >
        <Search class="w-4 h-4" /> Check
      </button>
    </div>

    <!-- NFT Info Card -->
    <div
      v-if="props.nftInfo"
      class="p-5 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 space-y-4 mt-2 transition-all duration-200 hover:shadow-lg"
    >
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="space-y-2">
          <p><strong>Token ID:</strong> {{ props.nftInfo.tokenId }}</p>
          <p><strong>Owner:</strong> {{ props.nftInfo.owner }}</p>
          <p>
            <strong>Status:</strong>
            <span
              class="inline-block px-2 py-1 rounded-full text-sm font-medium"
              :class="statusClass"
            >
              {{ props.nftInfo.status }}
            </span>
          </p>
          <p>
            <strong>File Hash:</strong>
            <span class="break-all">{{ props.nftInfo.fileHash }}</span>
          </p>
          <p><strong>Created At:</strong> {{ new Date(props.nftInfo.createdAt).toLocaleString() }}</p>
        </div>

        <img
          v-if="props.nftInfo.metadataUrl"
          :src="props.nftInfo.metadataUrl"
          alt="Document preview"
          class="w-32 h-32 object-cover rounded border dark:border-gray-600 shadow-sm"
        />
      </div>

      <div class="space-y-1">
        <p><strong>Name:</strong> {{ props.nftInfo.name ?? '—' }}</p>
        <p><strong>Description:</strong> {{ props.nftInfo.description ?? '—' }}</p>
      </div>
    </div>
  </div>
</template>
