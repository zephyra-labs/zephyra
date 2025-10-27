<script setup lang="ts">
import { useContractLogs } from '~/composables/useContractLogs'
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-vue-next'

const { logs, loading, getContractState, toggleContract } = useContractLogs()

const isRecent = (ts: number) => Date.now() - ts < 24 * 60 * 60 * 1000
const formatDate = (ts: number) => new Date(ts).toLocaleString()
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Contract Logs</h1>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="logs.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-10">
      No contracts found.
    </div>

    <!-- Contract Accordion -->
    <div v-else class="space-y-4">
      <div
        v-for="contract in logs"
        :key="contract"
        class="border rounded-xl shadow-sm overflow-hidden dark:border-gray-700"
      >
        <!-- Header -->
        <button
          class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition"
          @click="toggleContract(contract)"
        >
          <span class="font-medium truncate">Contract: {{ contract }}</span>
          <ChevronRight
            :class="getContractState(contract).isOpen ? 'rotate-90 text-indigo-600' : 'text-gray-400 dark:text-gray-300'"
            class="w-5 h-5 transition-transform duration-200"
          />
        </button>

        <!-- Body -->
        <transition name="accordion">
          <div v-show="getContractState(contract).isOpen" class="p-4 border-t bg-white dark:bg-gray-900">
            <!-- Loading skeleton for history -->
            <div v-if="getContractState(contract).loading" class="space-y-2">
              <div v-for="i in 3" :key="i" class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            </div>

            <!-- Empty history -->
            <div v-else-if="getContractState(contract).history.length === 0" class="text-gray-500 dark:text-gray-400">
              No history found.
            </div>

            <!-- Table -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th class="border px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th class="border px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Account</th>
                    <th class="border px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Action</th>
                    <th class="border px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th class="border px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(log, i) in getContractState(contract).history"
                    :key="i"
                    class="bg-white even:bg-gray-50 dark:bg-gray-900 dark:even:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-150"
                    :class="isRecent(log.timestamp) ? 'border-l-4 border-indigo-400' : ''"
                  >
                    <td class="border px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(log.timestamp) }}</td>
                    <td class="border px-3 py-2 text-sm font-mono truncate max-w-xs" :title="log.account">{{ log.account }}</td>
                    <td class="border px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{{ log.action }}</td>
                    <td class="border px-3 py-2 text-sm">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full text-white"
                        :class="{
                          'bg-green-500': log.onChainInfo?.status === 'success',
                          'bg-yellow-500': log.onChainInfo?.status === 'pending',
                          'bg-red-500': log.onChainInfo?.status === 'failed'
                        }"
                      >
                        <CheckCircle v-if="log.onChainInfo?.status === 'success'" class="w-3 h-3" />
                        <Clock v-else-if="log.onChainInfo?.status === 'pending'" class="w-3 h-3" />
                        <XCircle v-else-if="log.onChainInfo?.status === 'failed'" class="w-3 h-3" />
                        {{ log.onChainInfo?.status || '-' }}
                      </span>
                    </td>
                    <td class="border px-3 py-2 text-sm font-mono truncate max-w-xs" :title="log.txHash">{{ log.txHash }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.3s ease;
}
.accordion-enter-from, .accordion-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
}
.accordion-enter-to, .accordion-leave-from {
  max-height: 1000px;
  opacity: 1;
  padding: 1rem;
}
</style>
