<script setup lang="ts">
defineProps<{ variant?: 'default' | 'outline'; type?: 'button' | 'submit' }>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    class="px-4 py-2 rounded-lg font-medium transition
           bg-blue-600 text-white hover:bg-blue-700
           disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <slot />
  </button>
</template>
