<script setup lang="ts">
import { watch, computed } from 'vue'
import { useNotification } from '~/composables/useNotification'
import { useWallet } from '~/composables/useWallets'

const { account } = useWallet()
const { 
  notifications, 
  unreadCount, 
  loading, 
  fetchNotificationsByUser, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = useNotification()

watch(account, (acc) => {
  if (acc) fetchNotificationsByUser(acc)
}, { immediate: true })

const sortedNotifications = computed(() => [...notifications.value].sort((a,b) => b.createdAt - a.createdAt))

const formatDate = (ts: number) => new Date(ts).toLocaleString()

const markAsReadWithLog = async (id: string) => await markAsRead(id)
const deleteNotificationWithLog = async (id: string) => await deleteNotification(id)
const markAllAsReadWithLog = async () => await markAllAsRead()
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        Notifications
        <span
          v-if="unreadCount"
          class="ml-2 text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-0.5"
        >
          {{ unreadCount }}
        </span>
      </h1>
      <button
        class="mt-3 sm:mt-0 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
        :disabled="!unreadCount"
        @click="markAllAsReadWithLog"
      >
        Mark all as read
      </button>
    </div>

    <!-- States -->
    <div v-if="loading" class="text-center py-10 text-gray-500 dark:text-gray-400">
      Loading notifications...
    </div>
    <div
      v-else-if="!notifications.length"
      class="text-center py-10 text-gray-400 dark:text-gray-500"
    >
      No notifications
    </div>

    <!-- Notifications list -->
    <ul class="space-y-2">
      <li
        v-for="n in sortedNotifications"
        :key="n.id"
        :class="[ 
          'rounded-lg p-4 shadow-sm hover:shadow-md transition-all border-l-4',
          'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-50',
          !n.read ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700'
        ]"
      >
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {{ n.title }}
            </h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm mt-0.5 truncate">
              {{ n.message }}
            </p>
          </div>
          <p class="text-gray-400 dark:text-gray-400 text-xs mt-1 sm:mt-0 whitespace-nowrap">
            {{ formatDate(n.createdAt) }}
          </p>
        </div>

        <!-- Executor -->
        <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 italic truncate">
          by: {{ n.executorId }}
        </p>

        <!-- Extra data -->
        <div
          v-if="n.extraData?.data"
          class="mt-2 text-gray-600 dark:text-gray-300 text-xs space-y-0.5"
        >
          <div
            v-for="(value, key) in n.extraData.data"
            :key="key"
            class="flex justify-between"
          >
            <span class="font-medium">{{ key }}:</span>
            <span>{{ value }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-2 mt-3">
          <button
            v-if="!n.read"
            class="text-blue-600 dark:text-blue-400 text-xs px-3 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition"
            @click="markAsReadWithLog(n.id)"
          >
            Mark as read
          </button>
          <button
            class="text-red-600 dark:text-red-400 text-xs px-3 py-1 rounded border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/40 transition"
            @click="deleteNotificationWithLog(n.id)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
li {
  transform: translateY(0);
  transition: all 0.25s ease;
}
li:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
</style>
