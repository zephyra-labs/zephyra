<script setup lang="ts">
import { CheckCircle2, XCircle } from 'lucide-vue-next'

interface Props {
  type: 'success' | 'error'
  message: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    v-if="props.message"
    :class="[
      'mt-2 p-3 flex items-center gap-2 border rounded-lg',
      props.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300'
    ]"
  >
    <component :is="props.type === 'success' ? CheckCircle2 : XCircle" class="w-5 h-5" />
    {{ props.message }}
  </div>
</template>
