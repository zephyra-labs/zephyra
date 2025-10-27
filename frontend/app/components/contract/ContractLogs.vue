<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { FileText, Loader2 } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'
import { useContractLogs } from '~/composables/useContractLogs'

interface Props {
  contractAddress: string
}

const props = defineProps<Props>()

// Composable logs
const { contractStates, fetchContractLogs, getContractState } = useContractLogs()

// State for this contract
const state = computed(() => {
  return contractStates[props.contractAddress] ?? getContractState(props.contractAddress)
})

// Helpers
const formatTimestamp = (ts: number) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(ts))

const shortAccount = (addr: string) => {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Refresh logs manually
const refreshLogs = async () => {
  state.value.history = []
  state.value.finished = false
  state.value.lastTimestamp = undefined
  await fetchContractLogs(props.contractAddress)
}

// Auto fetch on mounted
onMounted(() => {
  if (!state.value.history.length) refreshLogs()
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-semibold">Logs</h3>
      <Button :disabled="state.loading" @click="refreshLogs">
        <span v-if="state.loading" class="flex items-center gap-2">
          <Loader2 class="w-4 h-4 animate-spin" /> Refreshing...
        </span>
        <span v-else>Refresh Logs</span>
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="state.loading" class="flex justify-center py-10">
      <Loader2 class="animate-spin w-6 h-6 text-gray-500" />
    </div>

    <!-- Logs List -->
    <ul
      v-else
      class="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow-sm"
    >
      <li
        v-for="log in state.history"
        :key="log.txHash || log.timestamp"
        class="py-3 px-3 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div class="flex items-center gap-2 mb-1 sm:mb-0">
          <FileText class="w-4 h-4 text-indigo-500" />
          <span class="font-medium capitalize">{{ log.action }}</span>
        </div>
        <div class="text-sm text-gray-500 flex gap-4 flex-wrap">
          <span title="Full address">{{ shortAccount(log.account) }}</span>
          <span>{{ formatTimestamp(log.timestamp) }}</span>
        </div>
      </li>
    </ul>

    <!-- Empty State -->
    <p
      v-if="!state.loading && state.history.length === 0"
      class="text-gray-400 text-sm mt-3 text-center"
    >
      No logs found for this contract.
    </p>
  </div>
</template>
