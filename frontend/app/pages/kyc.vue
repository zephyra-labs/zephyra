<script setup lang="ts">
import { computed } from 'vue'
import { useKycDashboard } from '~/composables/useKycDashboard'

import WalletInfo from '~/components/kyc/WalletInfo.vue'
import FileUploadMint from '~/components/kyc/FileUploadMint.vue'
import UserKycs from '~/components/kyc/UserKycs.vue'
import QuickCheckNFT from '~/components/kyc/QuickCheckNFT.vue'
import LifecycleActions from '~/components/kyc/LifecycleActions.vue'
import FeedbackMessage from '~/components/kyc/FeedbackMessage.vue'
import MinterManagement from '~/components/MinterManagement.vue'

import { FileUp } from 'lucide-vue-next'

// composable KYC
const kyc = useKycDashboard()

// unwrap semua Ref/ComputedRef untuk child component
const account = computed(() => kyc.account.value)
const isAdmin = computed(() => kyc.isAdmin.value)
const approvedMintersKYC = computed(() => kyc.approvedMintersKYC.value)
const loadingMintersKYC = computed(() => kyc.loadingMintersKYC.value)
const selectedFile = computed(() => kyc.selectedFile.value)
const tokenId = computed({
  get: () => kyc.tokenId.value,
  set: (val: string | number) => {
    if (val === null || val === undefined || val === '') {
      kyc.tokenId.value = null
    } else if (typeof val === 'bigint') {
      kyc.tokenId.value = val
    } else if (typeof val === 'number' && !isNaN(val)) {
      kyc.tokenId.value = BigInt(val)
    } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
      try {
        kyc.tokenId.value = BigInt(val)
      } catch {
        kyc.tokenId.value = null
      }
    } else {
      kyc.tokenId.value = null
    }
  },
})
const nftInfo = computed(() => kyc.nftInfo.value)
const processing = computed(() => kyc.processing.value)
const minterAddress = computed({
  get: () => kyc.minterAddress.value,
  set: (val: string) => (kyc.minterAddress.value = val),
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6 bg-white/90 dark:bg-gray-900 backdrop-blur-md rounded-xl shadow-lg">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
      <FileUp class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      KYC Document Verification & Minting
    </h2>

    <WalletInfo
      :account="account"
      :is-admin="isAdmin"
      :approved-minters-k-y-c="approvedMintersKYC"
      :loading-minters-k-y-c="loadingMintersKYC"
    />

    <FileUploadMint
      :selected-file="selectedFile"
      :minting="kyc.minting"
      :on-file-change="kyc.onFileChange"
      :verify-and-mint="kyc.verifyAndMint"
    />

    <UserKycs
      :account="account"
      :approved-minters-k-y-c="approvedMintersKYC"
      :is-admin="isAdmin"
    />

    <MinterManagement
      v-model:minter-address="minterAddress"
      :adding-minter="kyc.addingMinter.value"
      :removing-minter="kyc.removingMinter.value"
      :approved-minters-k-y-c="approvedMintersKYC"
      :loading-minters-k-y-c="loadingMintersKYC"
      :is-admin="isAdmin"
      @add-minter="kyc.handleAddMinter"
      @remove-minter="kyc.handleRemoveMinter"
    />

    <QuickCheckNFT
      v-model:model-value="tokenId"
      :nft-info="nftInfo"
      :check-n-f-t="kyc.checkNFT"
      :is-admin="isAdmin"
    />

    <LifecycleActions
      v-if="nftInfo"
      :token-id="tokenId"
      :processing="processing"
      :handle-review="kyc.handleReview"
      :handle-sign="kyc.handleSign"
      :handle-revoke="kyc.handleRevoke"
      :is-admin="isAdmin"
    />

    <FeedbackMessage 
      v-if="kyc.success" 
      type="success" 
      :message="kyc.success.value || ''" 
    />
    <FeedbackMessage 
      v-if="kyc.error" 
      type="error" 
      :message="kyc.error.value || ''" 
    />
  </div>
</template>
