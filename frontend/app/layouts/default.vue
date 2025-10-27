<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toast from '~/components/Toast.vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
const loadingUser = ref(true)

onMounted(async () => {
  loadingUser.value = true
  await userStore.fetchCurrentUser().catch(() => null)
  loadingUser.value = false
})
</script>

<template>
  <div>
    <!-- Loading Overlay -->
    <div
      v-if="loadingUser"
      class="fixed inset-0 z-50 flex justify-center items-center bg-gray-50 dark:bg-gray-900"
    >
      <svg
        class="animate-spin h-12 w-12 text-indigo-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <div class="hidden">
        <NuxtPage />
      </div>
    </div>

    <!-- Actual Layout -->
    <div
      v-else
      class="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
    >
      
      <!-- Header -->
      <AppHeader class="sticky top-0 z-50" />

      <!-- Main Content -->
      <main class="flex-1 p-6 dark:bg-gray-800 transition-colors duration-300">
        <div class="max-w-7xl mx-auto flex flex-col gap-6">
          <NuxtPage />
        </div>
      </main>

      <!-- Footer -->
      <footer
        class="bg-white dark:bg-gray-900 shadow-inner p-4 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300"
      >
        &copy; 2025 TradeChain
      </footer>

      <!-- Global Toast -->
      <Toast />
    </div>
  </div>
</template>
