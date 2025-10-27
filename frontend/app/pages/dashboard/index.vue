<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, FileArchive, Loader2 } from 'lucide-vue-next'
import { countUp } from '~/utils/animations'
import { useDashboard } from '~/composables/useDashboard'

const { userDashboard, loading, fetchUserDashboard } = useDashboard()

// Animated counters
const animatedContracts = ref(0)
const animatedDocuments = ref(0)

const animateTotals = () => {
  if (userDashboard.value) {
    countUp(userDashboard.value.totalContracts, animatedContracts)
    countUp(userDashboard.value.totalDocuments, animatedDocuments)
  }
}

onMounted(async () => {
  await fetchUserDashboard()
  console.log(userDashboard.value)
  animateTotals()
})
</script>

<template>
  <section
    class="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white dark:from-gray-900 dark:to-gray-950 rounded-xl p-6 shadow-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0"
  >
    <div>
      <h2 class="text-2xl font-bold">User Dashboard</h2>
      <p class="mt-1 text-indigo-100 dark:text-gray-300">
        Overview of network activity, contracts, and documents.
      </p>
    </div>
    <div>
      <button
        class="bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-200 px-4 py-2 rounded-lg shadow hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
        :disabled="loading"
        title="Refresh dashboard data"
        @click="fetchUserDashboard"
      >
        <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
        {{ loading ? 'Refreshing...' : 'Refresh Data' }}
      </button>
    </div>
  </section>

  <!-- Overview Cards -->
  <section class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
    <div
      class="bg-white dark:bg-gray-900 rounded-xl shadow hover:shadow-lg transition p-5 flex items-center gap-4 ring-1 ring-gray-200 dark:ring-gray-700"
    >
      <FileText class="w-10 h-10 text-green-600 dark:text-green-400" />
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Contracts</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Total deployed contracts</p>
        <div class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
          <span v-if="loading" class="animate-pulse">---</span>
          <span v-else>{{ animatedContracts }}</span>
        </div>
      </div>
    </div>

    <div
      class="bg-white dark:bg-gray-900 rounded-xl shadow hover:shadow-lg transition p-5 flex items-center gap-4 ring-1 ring-gray-200 dark:ring-gray-700"
    >
      <FileArchive class="w-10 h-10 text-orange-600 dark:text-orange-400" />
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Documents</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Total stored documents</p>
        <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
          <span v-if="loading" class="animate-pulse">---</span>
          <span v-else>{{ animatedDocuments }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Recent Contracts -->
  <section v-if="userDashboard?.recentContracts?.length" class="mt-8">
    <h3 class="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Recent Contracts</h3>
    <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow ring-1 ring-gray-200 dark:ring-gray-700">
      <table class="w-full table-auto text-left">
        <thead class="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th class="p-3 text-gray-600 dark:text-gray-300">Address</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Last Action</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Account</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in userDashboard.recentContracts" :key="c.address" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td class="p-3 font-mono text-sm truncate dark:text-white">{{ c.address }}</td>
            <td class="p-3 dark:text-white">{{ c.lastAction?.action || '-' }}</td>
            <td class="p-3 font-mono text-sm truncate dark:text-white">{{ c.lastAction?.account || '-' }}</td>
            <td class="p-3 dark:text-white">{{ c.lastAction ? new Date(c.lastAction.timestamp).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Recent Documents -->
  <section v-if="userDashboard?.recentDocuments?.length" class="mt-8">
    <h3 class="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">Recent Documents</h3>
    <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow ring-1 ring-gray-200 dark:ring-gray-700">
      <table class="w-full table-auto text-left">
        <thead class="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th class="p-3 text-gray-600 dark:text-gray-300">Token ID</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Owner</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Type</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Status</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Last Action</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Performed By</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Linked Contract</th>
            <th class="p-3 text-gray-600 dark:text-gray-300">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in userDashboard.recentDocuments" :key="d.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td class="p-3 dark:text-white">{{ d.tokenId }}</td>
            <td class="p-3 font-mono text-sm truncate dark:text-white">{{ d.owner }}</td>
            <td class="p-3 dark:text-white">{{ d.docType }}</td>
            <td class="p-3 dark:text-white">
              <span class="px-2 py-1 rounded-full text-sm" :class="d.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                {{ d.status }}
              </span>
            </td>
            <td class="p-3 dark:text-white">{{ d.lastAction?.action || '-' }}</td>
            <td class="p-3 font-mono text-sm truncate dark:text-white">{{ d.lastAction?.signer || d.lastAction?.account || '-' }}</td>
            <td class="p-3 font-mono text-sm truncate dark:text-white">{{ d.lastAction?.linkedContract || '-' }}</td>
            <td class="p-3 dark:text-white">{{ d.lastAction ? new Date(d.lastAction.timestamp).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
