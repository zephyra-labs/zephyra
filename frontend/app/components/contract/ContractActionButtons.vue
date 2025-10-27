<script setup lang="ts">
import {
  Rocket,
  Loader2,
  Check,
  X,
  PenTool,
  DollarSign,
  Truck,
  Ship,
  PackageCheck,
  Plane,
  CheckCircle2,
  Ban,
  Boxes
} from 'lucide-vue-next'
import Button from '~/components/ui/Button.vue'

interface ShippingStatus {
  initiated: boolean
  inTransit: boolean
  arrivedPort: boolean
  customsCleared: boolean
  delivered: boolean
}

interface StepStatus {
  deploy: boolean
  deposit: boolean
  sign: { importer: boolean; exporter: boolean }
  shipping: ShippingStatus
  completed: boolean
  cancelled: boolean
}

interface Props {
  loading:
    | 'deploy'
    | 'deposit'
    | 'sign'
    | 'shipping'
    | 'completed'
    | 'cancel'
    | 'inTransit'
    | 'arrival'
    | 'customs'
    | 'delivery'
    | null
  stepStatus: StepStatus
  signCompleted: boolean
  isAdmin: boolean
  isImporter: boolean
  isExporter: boolean
  isLogistics: boolean
  canDeploy: boolean
  canSign: boolean
  canDeposit: boolean
  canStartShipping: boolean
  canComplete: boolean
  canCancel: boolean
}

const props = defineProps<Props>()

const emit = defineEmits([
  'deploy',
  'sign',
  'deposit',
  'start-shipping',
  'in-transit',
  'arrival',
  'customs',
  'delivery',
  'complete',
  'cancel'
])
</script>

<template>
  <div class="space-y-3 mt-4">

    <!-- Deploy -->
    <Button
      v-if="props.isAdmin"
      :disabled="props.loading==='deploy' || props.stepStatus.deploy || !props.canDeploy"
      class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded py-3"
      @click="emit('deploy')"
    >
      <Rocket class="w-5 h-5" />
      <span v-if="props.loading==='deploy'">Waiting for Wallet...</span>
      <span v-else>Deploy Contract</span>
      <Loader2 v-if="props.loading==='deploy'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.deploy" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Sign -->
    <Button
      v-if="props.isImporter || props.isExporter"
      :disabled="!props.stepStatus.deploy || props.loading==='sign' || props.signCompleted || !props.canSign"
      class="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded py-3"
      @click="emit('sign')"
    >
      <PenTool class="w-5 h-5" />
      <span v-if="props.loading==='sign'">Waiting for Wallet...</span>
      <span v-else>Sign Agreement</span>
      <Loader2 v-if="props.loading==='sign'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.signCompleted" class="w-5 h-5 text-purple-400" />
    </Button>

    <!-- Deposit -->
    <Button
      v-if="props.isImporter"
      :disabled="props.loading==='deposit' || props.stepStatus.deposit || !props.canDeposit"
      class="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded py-3"
      @click="emit('deposit')"
    >
      <DollarSign class="w-5 h-5" />
      <span v-if="props.loading==='deposit'">Waiting for Wallet...</span>
      <span v-else>Deposit</span>
      <Loader2 v-if="props.loading==='deposit'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.deposit" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Shipping Phase 1: Start Shipping -->
    <Button
      v-if="props.isExporter && !props.stepStatus.shipping.initiated"
      :disabled="props.loading==='shipping' || !props.stepStatus.deposit || !props.canStartShipping"
      class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded py-3"
      @click="emit('start-shipping')"
    >
      <Truck class="w-5 h-5" />
      <span v-if="props.loading==='shipping'">Waiting for Wallet...</span>
      <span v-else>Start Shipping</span>
      <Loader2 v-if="props.loading==='shipping'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.shipping.initiated" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Shipping Phase 2: In Transit -->
    <Button
      v-if="props.isLogistics && props.stepStatus.shipping.initiated && !props.stepStatus.shipping.inTransit"
      :disabled="props.loading==='inTransit'"
      class="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded py-3"
      @click="emit('in-transit')"
    >
      <Plane class="w-5 h-5" />
      <span v-if="props.loading==='inTransit'">Updating Status...</span>
      <span v-else>Mark as In Transit</span>
      <Loader2 v-if="props.loading==='inTransit'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.shipping.inTransit" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Shipping Phase 3: Arrived at Port -->
    <Button
      v-if="props.isLogistics && props.stepStatus.shipping.inTransit && !props.stepStatus.shipping.arrivedPort"
      :disabled="props.loading==='arrival'"
      class="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded py-3"
      @click="emit('arrival')"
    >
      <Ship class="w-5 h-5" />
      <span v-if="props.loading==='arrival'">Updating Status...</span>
      <span v-else>Mark as Arrived Port</span>
      <Loader2 v-if="props.loading==='arrival'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.shipping.arrivedPort" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Shipping Phase 4: Customs Cleared -->
    <Button
      v-if="props.isImporter && props.stepStatus.shipping.arrivedPort && !props.stepStatus.shipping.customsCleared"
      :disabled="props.loading==='customs'"
      class="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded py-3"
      @click="emit('customs')"
    >
      <Boxes class="w-5 h-5" />
      <span v-if="props.loading==='customs'">Clearing Customs...</span>
      <span v-else>Mark as Customs Cleared</span>
      <Loader2 v-if="props.loading==='customs'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.shipping.customsCleared" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Shipping Phase 5: Delivery -->
    <Button
      v-if="props.isImporter && props.stepStatus.shipping.customsCleared && !props.stepStatus.shipping.delivered"
      :disabled="props.loading==='delivery'"
      class="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded py-3"
      @click="emit('delivery')"
    >
      <PackageCheck class="w-5 h-5" />
      <span v-if="props.loading==='delivery'">Confirming Delivery...</span>
      <span v-else>Mark as Delivered</span>
      <Loader2 v-if="props.loading==='delivery'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.shipping.delivered" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Complete -->
    <Button
      v-if="props.isImporter"
      :disabled="!props.stepStatus.shipping.delivered || props.loading==='completed' || props.stepStatus.completed || !props.canComplete"
      class="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded py-3"
      @click="emit('complete')"
    >
      <CheckCircle2 class="w-5 h-5" />
      <span v-if="props.loading==='completed'">Waiting for Wallet...</span>
      <span v-else>Complete Contract</span>
      <Loader2 v-if="props.loading==='completed'" class="w-5 h-5 animate-spin" />
      <Check v-if="props.stepStatus.completed" class="w-5 h-5 text-green-400" />
    </Button>

    <!-- Cancel -->
    <Button
      v-if="props.canCancel"
      :disabled="props.loading==='cancel' || props.stepStatus.completed || props.stepStatus.cancelled"
      class="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded py-3"
      @click="emit('cancel')"
    >
      <Ban class="w-5 h-5" />
      <span v-if="props.loading==='cancel'">Waiting for Wallet...</span>
      <span v-else>Cancel Contract</span>
      <Loader2 v-if="props.loading==='cancel'" class="w-5 h-5 animate-spin" />
      <X v-if="props.stepStatus.cancelled" class="w-5 h-5 text-white" />
    </Button>
  </div>
</template>
