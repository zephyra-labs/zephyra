<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check, ExternalLink, FileText } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

interface Props {
  address: string
  chain?: string
  explorerUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  chain: 'Sepolia',
  explorerUrl: 'https://sepolia.etherscan.io'
})

const copied = ref(false)
const router = useRouter()

const shortAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '')

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(props.address)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch (err) {
    console.error('Failed to copy address', err)
  }
}

const explorerLink = computed(() => `${props.explorerUrl}/address/${props.address}`)

const goToDocumentsDashboard = () => {
  router.push(`/dashboard/documents/${props.address}`)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-md p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 transition-all">
    <!-- Left: Contract Info -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Contract Info
        </h2>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200"
          title="Blockchain Network"
        >
          {{ chain }}
        </span>
      </div>
      <div class="text-gray-600 dark:text-gray-400 text-sm break-all flex items-center gap-2">
        <span>{{ shortAddress(address) }}</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex flex-wrap gap-2 items-center justify-start md:justify-end">
      <!-- Copy Button -->
      <button
        class="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
        :title="copied ? 'Copied!' : 'Copy Address'"
        @click="copyAddress"
      >
        <component :is="copied ? Check : Copy" class="w-4 h-4" />
        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>

      <!-- Explorer Button -->
      <a
        :href="explorerLink"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-indigo-50 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
        title="View on Explorer"
      >
        <ExternalLink class="w-4 h-4" />
        <span>Explorer</span>
      </a>

      <!-- Documents Dashboard Button -->
      <button
        class="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all"
        title="Go to Documents Dashboard"
        @click="goToDocumentsDashboard"
      >
        <FileText class="w-4 h-4" />
        <span>Documents Dashboard</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
button, a {
  cursor: pointer;
  user-select: none;
}
</style>
