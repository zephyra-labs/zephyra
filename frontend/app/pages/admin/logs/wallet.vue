<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWallet } from '~/composables/useWallets'
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-vue-next'

const { account, fetchAllWalletLogs } = useWallet()
const logs = ref<any[]>([])
const loading = ref(false)

// --- Filter / Search ---
const actionFilter = ref<'all' | 'connect' | 'disconnect'>('all')
const searchQuery = ref('')

// --- Pagination / Lazy load ---
const visibleLogs = ref(20)
const loadMore = () => visibleLogs.value += 20

// --- Fetch logs function ---
const fetchLogs = async () => {
  if (!account.value) {
    logs.value = []
    return
  }

  loading.value = true
  try {
    logs.value = await fetchAllWalletLogs()
  } finally {
    loading.value = false
  }
}

// --- Auto refresh on account change ---
watch(account, fetchLogs, { immediate: true })

// --- Computed: filtered + searched logs ---
const filteredLogs = computed(() =>
  logs.value
    .filter(log => actionFilter.value === 'all' ? true : log.action === actionFilter.value)
    .filter(log => log.account.toLowerCase().includes(searchQuery.value.toLowerCase()))
)

// --- Utils ---
const formatDate = (ts: number) => new Date(ts).toLocaleString()
const isRecent = (ts: number) => (Date.now() - ts) < 24 * 60 * 60 * 1000
const counts = computed(() => ({
  all: logs.value.length,
  connect: logs.value.filter(l => l.action==='connect').length,
  disconnect: logs.value.filter(l => l.action==='disconnect').length
}))
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">Wallet Logs</h1>

    <!-- Controls: Filter + Search -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div class="flex gap-2 flex-wrap">
        <button
          :class="actionFilter==='all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700'"
          class="px-3 py-1 rounded-lg transition flex items-center gap-1"
          @click="actionFilter = 'all'"
        >
          All <span v-if="counts.all" class="text-xs bg-white text-indigo-600 px-1 rounded-full">{{ counts.all }}</span>
        </button>

        <button
          :class="actionFilter==='connect' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700'"
          class="px-3 py-1 rounded-lg transition flex items-center gap-1"
          @click="actionFilter = 'connect'"
        >
          Connect <span v-if="counts.connect" class="text-xs bg-white text-green-600 px-1 rounded-full">{{ counts.connect }}</span>
        </button>

        <button
          :class="actionFilter==='disconnect' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700'"
          class="px-3 py-1 rounded-lg transition flex items-center gap-1"
          @click="actionFilter = 'disconnect'"
        >
          Disconnect <span v-if="counts.disconnect" class="text-xs bg-white text-red-600 px-1 rounded-full">{{ counts.disconnect }}</span>
        </button>
      </div>

      <div class="relative w-full sm:w-64">
        <Search class="absolute w-4 h-4 left-2 top-2.5 text-gray-400 dark:text-gray-300" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by account..."
          class="pl-8 pr-3 py-1 border rounded-lg text-sm w-full focus:ring focus:ring-indigo-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-10">
      <Loader2 class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
      <XCircle class="w-12 h-12 mb-2" />
      <p class="text-sm">No wallet logs found.</p>
    </div>

    <!-- Logs Table -->
    <div v-else class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow p-4">
      <table class="min-w-full table-auto border-collapse">
        <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Account</th>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(log, i) in filteredLogs.slice(0, visibleLogs)"
            :key="i"
            :class="[
              'transition hover:bg-indigo-50 dark:hover:bg-indigo-900',
              i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800',
              isRecent(log.timestamp) ? 'bg-indigo-50 dark:bg-indigo-900 border-l-4 border-indigo-400' : ''
            ]"
          >
            <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ formatDate(log.timestamp) }}</td>
            <td class="px-4 py-2 text-sm font-mono truncate max-w-xs">{{ log.account }}</td>
            <td class="px-4 py-2 text-sm">
              <span
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                :class="log.action==='connect' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'"
              >
                <CheckCircle v-if="log.action==='connect'" class="w-3 h-3" />
                <XCircle v-else class="w-3 h-3" />
                {{ log.action }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Load more button -->
      <div v-if="visibleLogs < filteredLogs.length" class="flex justify-center mt-4">
        <button
          class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          @click="loadMore"
        >
          Load More
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
table { min-width: 100%; }
</style>
