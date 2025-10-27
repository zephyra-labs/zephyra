<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  importerValue: string
  exporterValue: string
  logisticsValue: string
  requiredAmountValue: string
  paymentTokenValue: 'ETH' | 'MUSDC'
  isAutoFilled?: boolean
  isTokenAutoFilled?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:importerValue', v: string): void
  (e: 'update:exporterValue', v: string): void
  (e: 'update:logisticsValue', v: string): void
  (e: 'update:requiredAmountValue', v: string): void
  (e: 'update:paymentTokenValue', v: 'ETH' | 'MUSDC'): void
}>()

// biar gampang pakai v-model
const importerModel = computed({
  get: () => props.importerValue,
  set: (v: string) => emits('update:importerValue', v),
})

const exporterModel = computed({
  get: () => props.exporterValue,
  set: (v: string) => emits('update:exporterValue', v),
})

const logisticsModel = computed({
  get: () => props.logisticsValue,
  set: (v: string) => emits('update:logisticsValue', v),
})

const requiredAmountModel = computed({
  get: () => props.requiredAmountValue,
  set: (v: string) => emits('update:requiredAmountValue', v),
})

const paymentTokenModel = computed({
  get: () => props.paymentTokenValue,
  set: (v: 'ETH' | 'MUSDC') => emits('update:paymentTokenValue', v),
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow mt-4">

    <!-- Importer Address -->
    <div class="flex flex-col relative">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Importer Address
        <input
          v-model="importerModel"
          placeholder="0x..."
          :disabled="isAutoFilled"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </label>
      <span
        v-if="isAutoFilled"
        class="absolute right-2 top-1 text-xs text-green-500 dark:text-green-400 italic"
      >
        auto-filled
      </span>
    </div>

    <!-- Exporter Address -->
    <div class="flex flex-col relative">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Exporter Address
        <input
          v-model="exporterModel"
          placeholder="0x..."
          :disabled="isAutoFilled"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </label>
      <span
        v-if="isAutoFilled"
        class="absolute right-2 top-1 text-xs text-green-500 dark:text-green-400 italic"
      >
        auto-filled
      </span>
    </div>
    
    <!-- Logistics Address -->
    <div class="flex flex-col relative">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Logistics Address
        <input
          v-model="logisticsModel"
          placeholder="0x..."
          :disabled="isAutoFilled"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </label>
      <span
        v-if="isAutoFilled"
        class="absolute right-2 top-1 text-xs text-green-500 dark:text-green-400 italic"
      >
        auto-filled
      </span>
    </div>

    <!-- Required Amount -->
    <div class="flex flex-col relative">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Required Amount
        <input
          v-model="requiredAmountModel"
          type="number"
          step="0.0001"
          placeholder="0.5"
          :disabled="isAutoFilled"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </label>
      <span
        v-if="isAutoFilled"
        class="absolute right-2 top-1 text-xs text-green-500 dark:text-green-400 italic"
      >
        auto-filled
      </span>
    </div>

    <!-- Payment Token -->
    <div class="flex flex-col relative">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Payment Token
        <div
          v-if="isTokenAutoFilled"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          {{ paymentTokenModel }}
        </div>
        <select
          v-else
          v-model="paymentTokenModel"
          class="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-400 outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="ETH">ETH</option>
          <option value="MUSDC">MUSDC</option>
        </select>
      </label>
      <span
        v-if="isAutoFilled"
        class="absolute right-2 top-1 text-xs text-green-500 dark:text-green-400 italic"
      >
        auto-filled
      </span>
    </div>
  </div>
</template>
