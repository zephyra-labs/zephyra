<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useKYC } from '~/composables/useKycs'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-vue-next'

interface KYCWithHistory {
  tokenId: string
  owner: string
  name?: string
  status: string
  createdAt: number
  updatedAt?: number
  history?: {
    action: string
    account: string
    executor: string
    timestamp: number
  }[]
}

const { getAllKycs } = useKYC()
const kycs = ref<KYCWithHistory[]>([])
const loading = ref(true)
const expanded = ref<Record<string, boolean>>({})

const fetchKycs = async () => {
  loading.value = true
  try {
    const rawKycs = await getAllKycs()

    kycs.value = rawKycs.map((k: any) => ({
      tokenId: k.tokenId,
      owner: k.owner,
      name: k.name,
      status: k.status || 'N/A',
      createdAt: Number(k.createdAt),
      updatedAt: k.updatedAt ? Number(k.updatedAt) : undefined,
      history: (k.history ?? []).map((h: any) => ({
        action: h.action,
        account: h.account,
        executor: h.executor || h.account || 'Unknown',
        timestamp: Number(h.timestamp),
      }))
    }))
  } catch (err) {
    console.error('Failed to fetch KYC logs:', err)
  } finally {
    loading.value = false
  }
}

const toggleHistory = (tokenId: string) => {
  expanded.value[tokenId] = !expanded.value[tokenId]
}
onMounted(fetchKycs)
</script>

<template>
  <section class="p-4 max-w-6xl mx-auto">
    <!-- Header -->
    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">KYC Logs</h2>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-10">
      <Loader2 class="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400" />
    </div>

    <!-- Empty state -->
    <div v-else-if="kycs.length === 0" class="text-gray-400 dark:text-gray-500 text-center py-10">
      No KYC documents available.
    </div>

    <!-- KYC list -->
    <div v-else class="space-y-4">
      <div
        v-for="(kyc) in kycs"
        :key="kyc.tokenId"
        class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg dark:hover:shadow-gray-700 transition"
      >
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-indigo-700 dark:text-indigo-400 truncate">{{ kyc.name || 'Unnamed Document' }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Token ID: <span class="font-mono">{{ kyc.tokenId }}</span> | Owner: {{ kyc.owner }}
            </p>
            <p class="mt-1">
              Status:
              <span
                :class="{
                  'text-green-600 dark:text-green-400 font-semibold': kyc.status === 'Approved',
                  'text-red-600 dark:text-red-400 font-semibold': kyc.status === 'Rejected',
                  'text-gray-500 dark:text-gray-400 font-semibold': kyc.status === 'Draft' || kyc.status === 'N/A'
                }"
              >
                {{ kyc.status }}
              </span>
            </p>
          </div>
          <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition" @click="toggleHistory(kyc.tokenId)">
            <component :is="expanded[kyc.tokenId] ? ChevronUp : ChevronDown" class="w-5 h-5 text-gray-500 dark:text-gray-300"/>
          </button>
        </div>

        <!-- History -->
        <div v-if="expanded[kyc.tokenId]" class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
          <div v-for="(h, j) in kyc.history" :key="j" class="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <p><strong>Action:</strong> {{ h.action }}</p>
            <p><strong>Account:</strong> {{ h.account }}</p>
            <p><strong>Executor:</strong> {{ h.executor }}</p>
            <p class="text-gray-400 dark:text-gray-400 text-xs">{{ new Date(h.timestamp).toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
