<script setup lang="ts">
import { ref } from 'vue'
import Button from '~/components/ui/Button.vue'
import { Wallet, PlugZap, Loader2, LogOut, Copy } from 'lucide-vue-next'
import { useWallet } from '~/composables/useWallets'
import { useBalance } from '~/composables/useBalance'

const { account, connectWallet, disconnectWallet } = useWallet()
const { nativeBalance, usdcBalance, loading } = useBalance()

const loadingConnect = ref(false)
const copied = ref(false)

// --- Connect / Disconnect
const handleConnect = async () => {
  try {
    loadingConnect.value = true
    await connectWallet()
  } catch (e) {
    console.error(e)
  } finally {
    loadingConnect.value = false
  }
}

const handleDisconnect = () => {
  disconnectWallet()
}

// --- Utils
const shortenAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

const copyAddress = async () => {
  if (account.value) {
    await navigator.clipboard.writeText(account.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>

<template>
  <div class="p-6 max-w-md mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Wallet class="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Wallet</h1>
    </div>

    <div
      class="bg-white/90 dark:bg-gray-900 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 transition-all duration-300 hover:shadow-2xl"
    >
      <!-- Connected State -->
      <div v-if="account" class="space-y-6">
        <!-- Account -->
        <div>
          <p class="text-gray-700 dark:text-gray-300 font-medium mb-2">Connected Account</p>
          <div
            class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 font-mono text-sm transition-colors"
          >
            <span :title="account" class="truncate">{{ shortenAddress(account) }}</span>
            <button
              class="flex items-center gap-1 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
              :title="'Copy full address'"
              @click="copyAddress"
            >
              <Copy class="w-4 h-4" />
              <span v-if="copied" class="text-xs text-green-500 ml-1">Copied!</span>
            </button>
          </div>
        </div>

        <!-- Balances -->
        <div class="space-y-3">
          <!-- ETH -->
          <div class="flex items-center gap-3">
            <span class="text-gray-700 dark:text-gray-300 font-medium w-16">ETH:</span>
            <span
              v-if="!loading && nativeBalance !== null"
              class="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold transition-colors"
            >
              {{ nativeBalance.toFixed(4) }}
            </span>
            <div v-else class="w-24 h-5 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
          </div>

          <!-- MUSDC -->
          <div class="flex items-center gap-3">
            <span class="text-gray-700 dark:text-gray-300 font-medium w-16">MUSDC:</span>
            <span
              v-if="!loading && usdcBalance !== null"
              class="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold transition-colors"
            >
              {{ usdcBalance.toFixed(4) }}
            </span>
            <div v-else class="w-24 h-5 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        <!-- Disconnect -->
        <Button
          class="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 active:bg-red-800 transition-colors duration-200"
          title="Disconnect wallet"
          @click="handleDisconnect"
        >
          <LogOut class="w-5 h-5" /> Disconnect
        </Button>
      </div>

      <!-- Not Connected State -->
      <div v-else class="space-y-4 text-center">
        <p class="text-gray-500 dark:text-gray-400">No wallet connected.</p>
        <Button
          class="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-800 active:bg-indigo-800 transition-colors duration-200"
          :disabled="loadingConnect"
          title="Connect your wallet"
          @click="handleConnect"
        >
          <PlugZap class="w-5 h-5" />
          <span v-if="!loadingConnect">Connect Wallet</span>
          <span v-else class="flex items-center gap-2">
            <Loader2 class="w-4 h-4 animate-spin" /> Connecting...
          </span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth hover for card */
.backdrop-blur-md {
  backdrop-filter: blur(12px);
}
</style>
