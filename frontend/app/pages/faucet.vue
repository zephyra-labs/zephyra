<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useMockUSDC } from '~/composables/useMockUSDC'
import { useWallet } from '~/composables/useWallets'

// Lucide icons
import { Loader2, CheckCircle2, XCircle, DollarSignIcon } from 'lucide-vue-next'

const { mint, getBalance, minting } = useMockUSDC()
const { account } = useWallet()

const recipient = ref(account.value || '')
const amount = ref(1000)
const balance = ref<number | null>(null)
const message = ref('')

// --- Fungsi ambil balance
const fetchBalance = async (addr?: string) => {
  if (!addr) return
  balance.value = await getBalance(addr as `0x${string}`)
}

// --- Watch account, update recipient & balance otomatis
watch(account, (newAccount) => {
  if (newAccount) {
    recipient.value = newAccount
    fetchBalance(newAccount)
  } else {
    recipient.value = ''
    balance.value = null
  }
}, { immediate: true })

const handleMint = async () => {
  if (!recipient.value || !amount.value) return
  message.value = ''
  try {
    const result = await mint(recipient.value as `0x${string}`, amount.value)
    balance.value = result.balance
    message.value = `Minted ${amount.value} MUSDC! Tx: ${result.receipt.transactionHash}`
  } catch (err: any) {
    message.value = `Mint failed: ${err.message || err}`
  }
}

// --- On mounted, fetch balance untuk account sekarang
onMounted(() => {
  if (account.value) fetchBalance(account.value)
})
</script>

<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-white/90 dark:bg-gray-900 backdrop-blur-md shadow-lg rounded-xl space-y-6">

    <h1 class="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100">
      <DollarSignIcon class="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> MUSDC Faucet
    </h1>

    <!-- Recipient -->
    <div class="space-y-1">
      <label class="block font-semibold text-gray-700 dark:text-gray-300">Recipient Address</label>
      <input
        v-model="recipient"
        type="text"
        placeholder="0x..."
        class="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-indigo-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-600"
      />
    </div>

    <!-- Amount -->
    <div class="space-y-1">
      <label class="block font-semibold text-gray-700 dark:text-gray-300">Amount (MUSDC)</label>
      <input
        v-model="amount"
        type="number"
        min="1"
        class="w-full border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-indigo-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-indigo-600"
      />
    </div>

    <!-- Mint Button -->
    <button
      :disabled="minting" 
      class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      @click="handleMint"
    >
      <Loader2 v-if="minting" class="w-4 h-4 animate-spin" />
      {{ minting ? 'Minting...' : 'Mint MUSDC' }}
    </button>

    <!-- Message / Feedback -->
    <div
      v-if="message"
      class="flex items-center gap-2 p-3 rounded-lg transition-colors duration-200"
      :class="message.includes('Minted')
        ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
        : 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'"
    >
      <CheckCircle2 v-if="message.includes('Minted')" class="w-5 h-5" />
      <XCircle v-else class="w-5 h-5" />
      <span class="truncate">{{ message }}</span>
    </div>

    <!-- Current Balance -->
    <div class="mt-2 text-gray-700 dark:text-gray-300 space-y-1">
      <p class="font-medium">Current Balance:</p>
      <div v-if="balance === null" class="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div v-else class="text-lg font-semibold">{{ balance }} MUSDC</div>
    </div>

  </div>
</template>

<style scoped>
input:disabled {
  background-color: #f0f0f0;
}
</style>
