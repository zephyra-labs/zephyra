<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import {
  Check,
  FileText,
  Handshake,
  DollarSign,
  Truck,
  Plane,
  Ship,
  Warehouse,
  PackageCheck,
  Flag,
  XCircle,
} from "lucide-vue-next"
import { useToast } from "@/composables/useToast"

interface Props {
  currentStage: number
  userRole: 'importer' | 'exporter' | 'admin' | 'logistics' | null
  importerSigned?: boolean
  exporterSigned?: boolean
  depositDone?: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e: "update:stage", val: number): void }>()

const { addToast } = useToast()

// --- Stage mapping with updated icons ---
const stages = [
  { key: 0, label: "Draft", icon: FileText },
  { key: 1, label: "Signed", icon: Handshake },
  { key: 2, label: "Deposited", icon: DollarSign },
  { key: 3, label: "Ship Init", icon: Truck },
  { key: 4, label: "Transit", icon: Plane },
  { key: 5, label: "Arrived", icon: Ship },
  { key: 6, label: "Cleared", icon: Warehouse },
  { key: 7, label: "Delivered", icon: PackageCheck },
  { key: 8, label: "Completed", icon: Flag },
  { key: 9, label: "Cancelled", icon: XCircle },
]

// --- Cancel check ---
const isCancelled = computed(() => props.currentStage === 11)

// --- Status logic ---
const isCompleted = (idx: number) => {
  if (isCancelled.value) return false
  switch (idx) {
    case 0: return props.currentStage >= 0
    case 1: return props.importerSigned && props.exporterSigned
    case 2: return props.depositDone
    case 3: return props.currentStage >= 5
    case 4: return props.currentStage >= 6
    case 5: return props.currentStage >= 7
    case 6: return props.currentStage >= 8
    case 7: return props.currentStage >= 9
    case 8: return props.currentStage >= 10
    case 9: return props.currentStage >= 11
    default: return false
  }
}

const highlightStage = () => {
  if (isCancelled.value) return -1
  if (props.currentStage === 0 || props.currentStage === 1) {
    if (props.userRole === "importer" && !props.importerSigned) return 1
    if (props.userRole === "exporter" && !props.exporterSigned) return 1
  }
  if (props.currentStage === 3 && props.userRole === "importer" && !props.depositDone) return 2
  if (props.currentStage === 4 && props.userRole === "exporter") return 3
  if (props.currentStage === 5 && props.userRole === "logistics") return 4
  if (props.currentStage === 6 && props.userRole === "logistics") return 5
  if (props.currentStage === 7 && props.userRole === "importer") return 6
  if (props.currentStage === 8 && props.userRole === "importer") return 7
  if (props.currentStage === 9 && props.userRole === "importer") return 8
  return -1
}

const isActionRequired = (idx: number) => highlightStage() === idx

// --- Real-time polling ---
const interval = ref<number>()
const fetchStage = async () => emit("update:stage", props.currentStage)
onMounted(() => (interval.value = window.setInterval(fetchStage, 8000)))
onUnmounted(() => interval.value && clearInterval(interval.value))

// --- Toast events ---
watch(
  () => props.currentStage,
  (newStage, oldStage) => {
    if (newStage !== oldStage) addToast(`Contract status: ${statusBadge.value}`, "info")
  }
)
watch(() => props.depositDone, (done) => done && addToast("Deposit has been completed", "success"))
watch(() => props.importerSigned && props.exporterSigned, (both) => both && addToast("Both parties signed the contract", "success"))

// --- Badge status ---
const statusBadge = computed(() => {
  if (isCancelled.value) return "Cancelled"
  if (props.currentStage === 11) return "Completed"
  switch (props.currentStage) {
    case -1: return "Ready to Deploy"
    case 0: return "Draft / Pending signatures"
    case 1: return "Signing in progress from exporter"
    case 2: return "Signing in progress from importer"
    case 3: return "Waiting for deposit from importer"
    case 4: return "Ready to ship"
    case 5: return "Shipping initiated"
    case 6: return "In transit"
    case 7: return "Arrived at destination"
    case 8: return "Customs cleared"
    case 9: return "Delivered / Pending completion"
    case 10: return "Completed"
    default: return "Unknown"
  }
})
</script>

<template>
  <div class="w-full" role="region" aria-label="Contract stepper">
    <div class="flex items-center justify-between gap-2" role="list" aria-label="Contract progress stepper">
      <div
        v-for="(stage, idx) in stages"
        :key="stage.key"
        class="flex flex-col items-center flex-1 relative"
        role="listitem"
        :aria-label="stage.label"
        tabindex="0"
        @keyup.enter.prevent="isActionRequired(idx) && addToast(`Action required: ${stage.label}`, 'warning')"
        @keyup.space.prevent="isActionRequired(idx) && addToast(`Action required: ${stage.label}`, 'warning')"
      >
        <div
          class="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 focus:outline-none"
          :class="[
            isCancelled
              ? 'bg-red-500 text-white dark:bg-red-600'
              : isCompleted(idx)
                ? 'bg-green-500 text-white dark:bg-green-600'
                : isActionRequired(idx)
                  ? 'bg-yellow-400 text-white animate-pulse dark:bg-yellow-500'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-200',
            isActionRequired(idx) && !isCancelled ? 'ring-2 ring-blue-400 dark:ring-blue-500 animate-pulse' : ''
          ]"
        >
          <component :is="stage.icon" class="w-5 h-5" />

          <!-- Signed indicators -->
          <template v-if="stage.key === 1 && !isCancelled">
            <span v-if="props.importerSigned" class="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-gray-900"/>
            <span v-if="props.exporterSigned" class="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white dark:border-gray-900"/>
            <Check v-if="props.importerSigned && props.exporterSigned" class="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full text-green-600 dark:bg-gray-900 dark:text-green-400"/>
          </template>

          <Check v-if="isCompleted(idx) && idx > 1 && idx < 5 && !isCancelled" class="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full text-green-600 dark:bg-gray-900 dark:text-green-400"/>
        </div>

        <span
          class="mt-2 text-xs font-medium text-center"
          :class="[
            isCancelled
              ? 'text-red-600 dark:text-red-400'
              : isCompleted(idx)
                ? 'text-green-600 dark:text-green-400'
                : isActionRequired(idx)
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-500 dark:text-gray-300'
          ]"
        >
          {{ stage.label }}
        </span>

        <!-- Connector line -->
        <div v-if="idx < stages.length" class="h-0.5 w-full mt-2 transition-colors duration-300" :class="[isCancelled ? 'bg-red-500 dark:bg-red-600' : isCompleted(idx) ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-700']"/>
      </div>
    </div>

    <div class="flex justify-center mt-4">
      <span
        class="px-3 py-1 text-xs font-medium rounded-full"
        :class="[
          isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
          props.currentStage === 6 ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
          'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
        ]"
      >
        {{ statusBadge }}
      </span>
    </div>
  </div>
</template>
