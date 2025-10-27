<script setup lang="ts">
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'info': return Info
    case 'warning': return AlertTriangle
    default: return Info
  }
}

const getBgClass = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-600 dark:bg-green-700'
    case 'error': return 'bg-red-600 dark:bg-red-700'
    case 'info': return 'bg-blue-600 dark:bg-blue-700'
    case 'warning': return 'bg-yellow-500 dark:bg-yellow-600'
    default: return 'bg-gray-700 dark:bg-gray-800'
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 flex flex-col gap-3 z-50 max-w-xs sm:max-w-sm">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-3"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="relative flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm text-white overflow-hidden"
        :class="getBgClass(toast.type)"
      >
        <!-- Icon -->
        <component
          :is="getIcon(toast.type)"
          class="w-5 h-5 flex-shrink-0"
        />

        <!-- Message -->
        <span class="flex-1">{{ toast.message }}</span>

        <!-- Close button -->
        <button
          class="ml-2 text-white/70 hover:text-white transition-opacity"
          aria-label="Close toast"
          @click="removeToast(toast.id)"
        >
          ✕
        </button>

        <!-- Progress bar -->
        <div
          class="absolute bottom-0 left-0 h-1 bg-white/50 rounded-b-xl"
          :style="{ width: toast.progress + '%' }"
        ></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
