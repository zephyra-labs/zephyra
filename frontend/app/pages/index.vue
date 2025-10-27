<script setup lang="ts">
import { ref } from 'vue'
import { useWallet } from '~/composables/useWallets'
import Button from '~/components/ui/Button.vue'

const { account, connectWallet } = useWallet()
const loading = ref(false)

const handleConnect = async () => {
  try {
    loading.value = true
    await connectWallet()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
    
    <!-- Hero Section -->
    <section class="text-center max-w-3xl space-y-6">
      <h1 class="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400">Welcome to TradeChain</h1>
      <p class="text-gray-700 dark:text-gray-300 text-lg md:text-xl">
        The easiest way to manage wallets, smart contracts, and documents on-chain.
      </p>
      
      <!-- Wallet Connect -->
      <div class="mt-6">
        <Button 
          v-if="!account" 
          :disabled="loading" 
          class="px-6 py-3 text-lg"
          @click="handleConnect"
        >
          <span v-if="loading">Connecting...</span>
          <span v-else>Connect Wallet</span>
        </Button>

        <div v-else class="text-gray-800 dark:text-gray-200 font-mono text-lg">
          Connected: {{ account }}
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="mt-10 space-x-4">
        <NuxtLink to="/wallets">
          <Button class="px-6 py-2 text-base">Explore Wallets</Button>
        </NuxtLink>
        <NuxtLink to="/contracts">
          <Button class="px-6 py-2 text-base">View Contracts</Button>
        </NuxtLink>
      </div>
    </section>

    <!-- Features Section -->
    <section class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
        <h3 class="font-semibold text-xl mb-2">Wallet Management</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          Easily connect and manage multiple wallets with full transparency.
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
        <h3 class="font-semibold text-xl mb-2">Smart Contracts</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          Deploy, monitor, and interact with contracts directly from the dashboard.
        </p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
        <h3 class="font-semibold text-xl mb-2">Documents</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          Store, verify, and track on-chain documents with ease and security.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
main {
  scroll-behavior: smooth;
}
</style>
