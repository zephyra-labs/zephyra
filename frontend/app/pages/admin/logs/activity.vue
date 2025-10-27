<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivityLogs } from '~/composables/useActivityLogs'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, XCircle, FileText, FileImage, File, TruckIcon, UserPlus, UserMinus, Database } from 'lucide-vue-next'

const account = ref('')
const { fetchActivityLogs, refreshActivityLogs, getActivityState } = useActivityLogs()

onMounted(() => {
  if (account.value) fetchActivityLogs(account.value, { limit: 20 })
})

const state = computed(() => getActivityState(account.value))

const getActionIcon = (action: string, type: string) => {
  if (type === 'backend') return Database
  switch(action) {
    case 'mintDocument': return FileText
    case 'sign': return CheckCircle2
    case 'deploy': return File
    case 'deposit': return FileImage
    case 'startShipping': return TruckIcon
    case 'complete': return CheckCircle2
    case 'cancel': return XCircle
    case 'addMinter': return UserPlus
    case 'removeMinter': return UserMinus
    default: return File
  }
}

const getStatusColor = (action: string, status?: string) => {
  if(status) {
    if(status === 'success') return 'bg-green-100 text-green-700'
    if(status === 'failed') return 'bg-red-100 text-red-700'
  }
  switch(action) {
    case 'deposit': return 'bg-blue-100 text-blue-700'
    case 'startShipping': return 'bg-yellow-100 text-yellow-700'
    case 'complete': return 'bg-green-100 text-green-700'
    case 'cancel': return 'bg-red-100 text-red-700'
    case 'addMinter': 
    case 'removeMinter': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const isRecent = (ts: number) => Date.now() - ts < 24 * 60 * 60 * 1000
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Activity Logs</h1>

    <!-- Account input -->
    <div class="mb-4">
      <label class="block font-semibold mb-2">Account:</label>
      <input
        v-model="account"
        type="text"
        placeholder="Enter account address"
        class="border rounded px-3 py-2 w-full dark:bg-gray-800 dark:text-gray-100"
        @change="refreshActivityLogs(account)"
      />
    </div>

    <!-- Skeleton loading -->
    <div v-if="state.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="state.logs.length === 0" class="text-gray-400 dark:text-gray-500 text-center py-10">
      <XCircle class="mx-auto w-12 h-12 mb-2" />
      No activity logs found.
    </div>

    <!-- Logs -->
    <div v-else class="space-y-4">
      <div
        v-for="log in state.logs"
        :key="log.timestamp + (log.txHash || log.action)"
        :class="['bg-white dark:bg-gray-900 border rounded-xl shadow p-4 flex gap-4 items-start transition hover:shadow-lg',
                 isRecent(log.timestamp) ? 'border-l-4 border-indigo-400' : '']"
      >
        <!-- Icon -->
        <component :is="getActionIcon(log.action, log.type)" class="w-6 h-6 text-blue-500 mt-1" />

        <!-- Main content -->
        <div class="flex-1 space-y-1">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="font-semibold capitalize">{{ log.action }}</span>
              <span class="text-gray-500 text-sm" :title="new Date(log.timestamp).toLocaleString()">
                {{ formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) }}
              </span>
            </div>
            <span class="text-xs text-gray-400">{{ log.type }}</span>
          </div>

          <!-- Account & Contract -->
          <div class="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-2">
            <span>
              Account: 
              <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-800 dark:text-gray-100">
                {{ log.account }}
              </code>
            </span>
            <span v-if="log.contractAddress">
              Contract: 
              <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-800 dark:text-gray-100">
                {{ log.contractAddress }}
              </code>
            </span>
          </div>

          <!-- Extra info -->
          <div v-if="log.extra" class="text-sm text-gray-700 dark:text-gray-300 mt-1 space-y-1">
            <template v-if="log.type==='backend'">
              <div v-if="log.extra.count">Count: {{ log.extra.count }}</div>
              <div v-else-if="log.action==='createCompany'">
                <div><strong>Company Created:</strong> {{ log.extra.name }}</div>
                <div>{{ log.extra.address }}, {{ log.extra.city }}, {{ log.extra.country }}</div>
                <div>Email: {{ log.extra.email }} | Phone: {{ log.extra.phone || '-' }}</div>
              </div>
            </template>
            <template v-else-if="log.action==='mintDocument'">
              <div class="flex items-center gap-2">
                <span>File:</span>
                <span class="font-medium">{{ log.extra.fileName }}</span>
                <span v-if="log.extra.docType" class="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700">{{ log.extra.docType }}</span>
              </div>
            </template>
            <template v-else-if="log.action==='deploy'">
              <div>Importer: {{ log.extra.importer }}</div>
              <div>Exporter: {{ log.extra.exporter }}</div>
              <div>Required: {{ log.extra.requiredAmount }}</div>
            </template>
            <template v-else-if="log.extra.amount">
              <div>Amount: {{ log.extra.amount }}</div>
              <div>Token: {{ log.extra.token }}</div>
            </template>
          </div>

          <!-- On-chain info -->
          <div v-if="log.onChainInfo" class="flex flex-wrap gap-2 mt-2">
            <span :class="getStatusColor(log.action, log.onChainInfo.status) + ' px-2 py-1 rounded text-xs font-medium'">
              {{ log.onChainInfo.status.toUpperCase() }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">Block: {{ log.onChainInfo.blockNumber }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">Confirmations: {{ log.onChainInfo.confirmations }}</span>
          </div>

          <!-- Tx hash -->
          <div v-if="log.txHash" class="text-xs text-blue-500 dark:text-blue-400 break-all mt-1">
            Tx: {{ log.txHash }}
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="!state.finished && !state.loading" class="mt-6 text-center">
      <button
        class="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition"
        @click="fetchActivityLogs(account, { limit: 20 })"
      >
        Load More
      </button>
    </div>

    <div v-if="state.finished" class="mt-4 text-center text-gray-500 dark:text-gray-400">
      No more logs.
    </div>
  </div>
</template>
