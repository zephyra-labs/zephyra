<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDocuments } from '~/composables/useDocuments'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-vue-next'

// --- Tipe log untuk UI ---
interface DocumentLogUI {
  action: 'mintDocument' | 'reviewDocument' | 'signDocument' | 'revokeDocument' | 'linkDocument'
  txHash: string
  account: string
  signer?: string
  linkedContract?: string
  extra?: any
  timestamp: number
  onChainInfo?: Record<string, any>
  user: string
  status: string
}

// --- Tipe dokumen dengan history untuk UI ---
interface DocumentWithLogs {
  tokenId: number
  name: string
  owner: string
  status: string
  history: DocumentLogUI[]
}

// --- Composable ---
const { getAllDocuments } = useDocuments()
const documents = ref<DocumentWithLogs[]>([])
const loading = ref(true)
const expanded = ref<Record<number, boolean>>({})

// --- Fetch semua dokumen dan lognya ---
const fetchDocuments = async () => {
  loading.value = true
  try {
    const docs = await getAllDocuments()

    // Map dokumen dan langsung ambil history dari response
    const docsWithLogs: DocumentWithLogs[] = docs.map((doc) => {
      const logsUI: DocumentLogUI[] = (doc.history ?? []).map((log: any) => ({
        action: log.action,
        txHash: log.txHash,
        account: log.account,
        signer: log.signer,
        linkedContract: log.linkedContract,
        timestamp: Number(log.timestamp), // pastikan Number
        user: log.account || doc.owner,
        status: doc.status || 'Unknown',
      }))
      // Sort history terbaru di atas
      logsUI.sort((a, b) => b.timestamp - a.timestamp)

      return {
        tokenId: doc.tokenId,
        name: doc.name || 'Unnamed Document',
        owner: doc.owner,
        status: doc.status || 'Draft',
        history: logsUI,
      }
    })

    // Sort dokumen berdasarkan history terbaru
    documents.value = docsWithLogs.sort((a, b) => {
      const tA = a.history[0]?.timestamp || 0
      const tB = b.history[0]?.timestamp || 0
      return tB - tA
    })
  } catch (err) {
    console.error('Failed to fetch document logs:', err)
  } finally {
    loading.value = false
  }
}

const toggleHistory = (tokenId: number) => {
  expanded.value[tokenId] = !expanded.value[tokenId]
}

onMounted(fetchDocuments)
</script>

<template>
  <section class="p-4 max-w-6xl mx-auto">
    <!-- Header -->
    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Document Logs</h2>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-10">
      <Loader2 class="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400" />
    </div>

    <!-- Empty state -->
    <div v-else-if="documents.length === 0" class="text-gray-400 dark:text-gray-500 text-center py-10">
      No document logs available.
    </div>

    <!-- Document list -->
    <div v-else class="space-y-4">
      <div
        v-for="doc in documents"
        :key="doc.tokenId"
        class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg dark:hover:shadow-gray-700 transition"
      >
        <!-- Header -->
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-indigo-700 dark:text-indigo-400 truncate">{{ doc.name }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Token ID: <span class="font-mono">{{ doc.tokenId }}</span> | Owner: {{ doc.owner }}
            </p>
            <p class="mt-1">
              Status:
              <span
                :class="{
                  'text-green-600 dark:text-green-400 font-semibold': doc.status === 'Approved',
                  'text-red-600 dark:text-red-400 font-semibold': doc.status === 'Rejected',
                  'text-gray-500 dark:text-gray-400 font-semibold': doc.status === 'Draft' || doc.status === 'Unknown'
                }"
              >
                {{ doc.status }}
              </span>
            </p>
          </div>

          <!-- Toggle history -->
          <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition" @click="toggleHistory(doc.tokenId)">
            <component :is="expanded[doc.tokenId] ? ChevronUp : ChevronDown" class="w-5 h-5 text-gray-500 dark:text-gray-300"/>
          </button>
        </div>

        <!-- History logs -->
        <div v-if="expanded[doc.tokenId]" class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
          <div
            v-for="(log, j) in doc.history"
            :key="j"
            class="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded"
          >
            <p><strong>Action:</strong> {{ log.action }}</p>
            <p><strong>User:</strong> {{ log.user }}</p>
            <p v-if="log.signer"><strong>Signer:</strong> {{ log.signer }}</p>
            <p v-if="log.linkedContract"><strong>Linked Contract:</strong> {{ log.linkedContract }}</p>
            <p class="text-gray-400 dark:text-gray-400 text-xs">{{ new Date(log.timestamp).toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>