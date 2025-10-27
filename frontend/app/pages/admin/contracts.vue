<script setup lang="ts">
import ContractHeader from '~/components/contract/ContractHeader.vue'
import ContractStepper from '~/components/contract/ContractStepper.vue'
import ContractSelector from '~/components/contract/ContractSelector.vue'
import ContractInputs from '~/components/contract/ContractInputs.vue'
import ContractActionButtons from '~/components/contract/ContractActionButtons.vue'

import { useTradeContract } from '~/composables/useTradeContract'

const trade = useTradeContract()
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">

    <!-- Header -->
    <ContractHeader
      @new-contract="trade.handleNewContract"
      @refresh="trade.handleRefreshContracts"
    />

    <!-- Role Info -->
    <RoleInfo :role="trade.userRole?.value ?? 'none'" />

    <!-- Stepper -->
    <ContractStepper
      :current-stage="trade.currentStage.value"
      :user-role="trade.userRole.value"
      :importer-signed="trade.stepStatus.sign.importer"
      :exporter-signed="trade.stepStatus.sign.exporter"
      :deposit-done="trade.stepStatus.deposit"
    />

    <!-- Contract Selection -->
    <ContractSelector
      v-model="trade.selectedContract.value"
      :deployed-contracts="trade.deployedContracts.value"
    />

    <!-- Inputs Section -->
    <ContractInputs
      v-model:importer-value="trade.importerValue.value"
      v-model:exporter-value="trade.exporterValue.value"
      v-model:logistics-value="trade.logisticsValue.value"
      v-model:required-amount-value="trade.requiredAmountValue.value"
      v-model:payment-token-value="trade.paymentTokenValue.value"
      :is-auto-filled="trade.isAutoFilled.value"
      :is-token-auto-filled="trade.isTokenAutoFilled.value"
    />

    <!-- Action Buttons -->
    <ContractActionButtons
      :loading="trade.loadingButton.value"
      :step-status="trade.stepStatus"
      :sign-completed="trade.signCompleted.value"
      :is-admin="trade.isAdmin.value"
      :is-importer="trade.isImporter.value"
      :is-exporter="trade.isExporter.value"
      :is-logistics="trade.isLogistics.value"
      :can-deploy="trade.canDeploy.value"
      :can-sign="trade.canSign.value"
      :can-deposit="trade.canDeposit.value"
      :can-start-shipping="trade.canStartShipping.value"
      :can-complete="trade.canComplete.value"
      :can-cancel="trade.canCancel.value"
      @deploy="trade.handleDeploy"
      @sign="trade.handleSign"
      @deposit="trade.handleDeposit"
      @start-shipping="trade.handleShippingPhase"
      @complete="trade.handleComplete"
      @cancel="trade.handleCancel"
    />
  </div>
</template>
