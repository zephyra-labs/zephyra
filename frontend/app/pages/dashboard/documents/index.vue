<script setup lang="ts">
import { onMounted } from 'vue'
import { NuxtLink } from '#components'
import { useContracts } from '~/composables/useContracts'
import { FileText, RefreshCw, Paperclip } from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'

const { contracts, loading, fetchMyContracts, contractStates } = useContracts()

onMounted(() => {
  fetchMyContracts()
})

// --- Helpers ---
const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

const roleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'exporter': return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'
    case 'importer': return 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100'
    case 'logistics': return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'
    case 'bank': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getRole = (contract: string) => contractStates[contract]?.role ?? 'Guest'
</script>

<template>
  <div class="max-w-7xl mx-auto p-4 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">My Contracts</h1>
        <p class="text-gray-500 mt-1 text-sm">
          View and manage your active trade contracts. Click a card to open its document dashboard.
        </p>
      </div>
      <Button 
        variant="outline" 
        class="flex items-center gap-2 text-sm"
        :disabled="loading"
        @click="fetchMyContracts"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </Button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div v-for="n in 6" :key="n" class="p-4 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 animate-pulse">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!contracts.length" class="text-center py-16 text-gray-500">
      <FileText class="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p class="text-lg font-medium">No contracts found</p>
      <p class="text-sm text-gray-400">You are not participating in any contracts yet.</p>
    </div>

    <!-- Contract Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div 
        v-for="contract in contracts.filter(c => contractStates[c]?.role)"
        :key="contract"
        class="p-5 rounded-xl shadow-sm border bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col justify-between transition hover:shadow-md hover:-translate-y-1 duration-200"
      >
        <!-- Top -->
        <div>
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-gray-800 dark:text-gray-200 truncate text-base">
                {{ contractStates[contract]?.name || shorten(contract) }}
              </h2>
              <p class="text-xs text-gray-400 truncate" :title="contract">
                {{ contract }}
              </p>
            </div>
            <span
              class="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap"
              :class="contractStates[contract]?.finished 
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'">
              {{ contractStates[contract]?.finished ? 'Finished' : 'Active' }}
            </span>
          </div>

          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span 
              :class="['px-2 py-0.5 rounded-full font-medium', roleColor(getRole(contract))]"
            >
              {{ getRole(contract) }}
            </span>

            <span 
              v-if="contractStates[contract]?.lastTimestamp" 
              class="text-gray-500 dark:text-gray-400"
            >
              Last update: {{ new Date(contractStates[contract].lastTimestamp).toLocaleDateString() }}
            </span>

            <!-- 📎 Document Count -->
            <span v-if="contractStates[contract]?.documentCount !== undefined" class="text-gray-400 flex items-center gap-1 ml-auto">
              <Paperclip class="w-3 h-3" />
              {{ contractStates[contract].documentCount }} docs
            </span>
          </div>
        </div>

        <!-- Action -->
        <div class="mt-4">
          <NuxtLink :to="`/dashboard/documents/${contract}`">
            <Button variant="outline" class="w-full text-sm">Open Dashboard</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
