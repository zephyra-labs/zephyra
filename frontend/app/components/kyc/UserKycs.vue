<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { KYC } from '~/types/Kyc'
import { useKYC } from '~/composables/useKycs'

interface Props {
  account: string | null
  approvedMintersKYC: string[]
  isAdmin: boolean
}

const props = defineProps<Props>()

defineEmits(['refresh-requested'])

const { getKycsByOwner } = useKYC()
const userKycs = ref<KYC[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const statusClass = (status: string) => {
  switch (status) {
    case 'Draft': return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    case 'Reviewed': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
    case 'Signed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
    case 'Revoked': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
    default: return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }
}

async function fetchUserKycs() {
  if (!props.account) return
  loading.value = true
  error.value = null
  try {
    const kycs = await getKycsByOwner(props.account)
    userKycs.value = kycs
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'Failed to fetch your KYCs'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.approvedMintersKYC && props.account) fetchUserKycs()
})

watch(() => props.account, () => {
  if (props.approvedMintersKYC && props.account) fetchUserKycs()
})

onMounted(() => {
  window.addEventListener('kyc-minted', fetchUserKycs)
})

onUnmounted(() => {
  window.removeEventListener('kyc-minted', fetchUserKycs)
})
</script>

<template>
  <div v-if="props.approvedMintersKYC && props.account && !props.isAdmin" class="p-4 space-y-4">
    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Your KYCs</h3>

    <p v-if="loading" class="text-gray-500 dark:text-gray-400">Refreshing your KYCs...</p>
    <p v-if="!loading && !userKycs.length" class="text-gray-500 dark:text-gray-400">You have no KYCs yet.</p>
    <p v-if="error" class="text-red-500 dark:text-red-400">{{ error }}</p>

    <div v-if="userKycs.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="nft in userKycs"
        :key="nft.tokenId"
        class="p-4 rounded-xl bg-white dark:bg-gray-900 shadow border space-y-2"
      >
        <div class="flex justify-between items-start">
          <div>
            <p><strong>Token ID:</strong> {{ nft.tokenId }}</p>
            <p>
              <strong>Status:</strong>
              <span
                :class="statusClass(nft.status)"
                class="px-2 py-1 rounded-full text-sm font-medium"
              >
                {{ nft.status }}
              </span>
            </p>
          </div>
          <img
            v-if="nft.metadataUrl"
            :src="nft.metadataUrl"
            class="w-24 h-24 object-cover rounded border dark:border-gray-600"
          />
        </div>
        <p><strong>Name:</strong> {{ nft.name ?? '—' }}</p>
        <p><strong>Description:</strong> {{ nft.description ?? '—' }}</p>
      </div>
    </div>
  </div>
</template>
