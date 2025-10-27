<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  account: string | null
  isAdmin: boolean
  approvedMintersKYC: string[]
  loadingMintersKYC: boolean
}

const props = defineProps<Props>()

const isApprovedMinter = computed(() => {
  if (!props.account) return false
  return props.approvedMintersKYC.some(addr => addr.toLowerCase() === props.account!.toLowerCase())
})
</script>

<template>
  <div class="space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border">
    <p><strong>Wallet:</strong> {{ props.account || 'Not connected' }}</p>
    <p v-if="props.isAdmin">
      <strong>Admin: </strong>
      <span :class="props.isAdmin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
        {{ props.isAdmin ? 'Yes' : 'No' }}
      </span>
    </p>
    <p v-if="!props.isAdmin">
      <strong>Approved Minter: </strong>
      <span :class="isApprovedMinter ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
        {{ isApprovedMinter ? 'Yes' : 'No' }}
      </span>
    </p>
  </div>
</template>
