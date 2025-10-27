<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { X, ZoomIn, ZoomOut, RotateCw, Download, Copy } from "lucide-vue-next"
import { useToast } from "~/composables/useToast"

// --- Props & Emits ---
interface Props {
  modelValue: boolean
  src: string
  name?: string
  tokenId?: number | string
  hash?: string
  status?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const { addToast } = useToast()

// --- State ---
const zoom = ref(1)
const rotation = ref(0)

// --- File type detection ---
const fileType = computed<"pdf" | "image" | "other">(() => {
  if (!props.src) return "other"
  const lower = props.src.toLowerCase()
  if (lower.endsWith(".pdf") || lower.includes("application/pdf")) return "pdf"
  if (/\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(lower)) return "image"
  return "other"
})

// --- Reset zoom & rotation when opened ---
watch(() => props.modelValue, (open) => {
  if (open) {
    zoom.value = 1
    rotation.value = 0
  }
})

// --- Actions ---
const close = () => emit("update:modelValue", false)
const zoomIn = () => { zoom.value = Math.min(zoom.value + 0.2, 3) }
const zoomOut = () => { zoom.value = Math.max(zoom.value - 0.2, 0.5) }
const rotate = () => { rotation.value = (rotation.value + 90) % 360 }

const download = () => {
  const link = document.createElement("a")
  link.href = props.src
  link.download = props.name || "document"
  link.click()
  addToast("File downloaded", "success")
}

const copyToClipboard = (text: string | number | undefined, label?: string) => {
  if (!text) return
  navigator.clipboard.writeText(String(text))
  addToast(`${label || "Value"} copied to clipboard`, "success")
}
</script>

<template>
  <div
    v-if="props.modelValue"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 p-4 dark:bg-black/80"
  >
    <!-- Header -->
    <div class="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-md text-gray-900 dark:text-gray-100 gap-2">
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
        <!-- Document Name -->
        <span class="font-semibold text-lg truncate" :title="props.name">{{ props.name || "Document" }}</span>

        <!-- Badges Row -->
        <div class="flex flex-wrap gap-2 mt-1 sm:mt-0">
          <span
            class="bg-indigo-600 dark:bg-indigo-700 px-2 py-1 rounded-lg font-mono text-xs hover:brightness-110 transition"
            :title="props.tokenId ? String(props.tokenId) : ''"
          >
            TokenID: {{ props.tokenId }}
          </span>

          <span
            class="bg-purple-600 dark:bg-purple-700 px-2 py-1 rounded-lg font-mono text-xs hover:brightness-110 transition truncate max-w-[150px]"
            :title="props.hash"
          >
            Hash: {{ props.hash }}
          </span>

          <span
            class="px-2 py-1 rounded-lg font-semibold text-xs transition"
            :class="{
              'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100': props.status==='Draft',
              'bg-blue-500 dark:bg-blue-600 text-white': props.status==='Reviewed',
              'bg-green-500 dark:bg-green-600 text-white': props.status==='Signed',
              'bg-red-500 dark:bg-red-600 text-white': props.status==='Revoked',
              'bg-gray-400 dark:bg-gray-600 text-white': !props.status
            }"
          >
            {{ props.status?.toUpperCase() || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Close Button -->
      <button class="p-2 bg-red-600 dark:bg-red-700 rounded-full hover:brightness-110 ml-auto transition" @click="close">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap gap-2 mb-2">
      <button title="Zoom In" class="p-2 bg-blue-500 dark:bg-blue-600 rounded-full hover:brightness-110 text-white transition" @click="zoomIn">
        <ZoomIn class="w-5 h-5" />
      </button>
      <button title="Zoom Out" class="p-2 bg-blue-500 dark:bg-blue-600 rounded-full hover:brightness-110 text-white transition" @click="zoomOut">
        <ZoomOut class="w-5 h-5" />
      </button>
      <button title="Rotate 90°" class="p-2 bg-yellow-500 dark:bg-yellow-600 rounded-full hover:brightness-110 text-white transition" @click="rotate">
        <RotateCw class="w-5 h-5" />
      </button>
      <button title="Download File" class="p-2 bg-green-500 dark:bg-green-600 rounded-full hover:brightness-110 text-white transition" @click="download">
        <Download class="w-5 h-5" />
      </button>
      <button title="Copy TokenID" class="p-2 bg-indigo-400 dark:bg-indigo-500 rounded-full hover:brightness-110 text-white transition" @click="copyToClipboard(props.tokenId, 'TokenID')">
        <Copy class="w-5 h-5" />
      </button>
      <button title="Copy File Hash" class="p-2 bg-purple-400 dark:bg-purple-500 rounded-full hover:brightness-110 text-white transition" @click="copyToClipboard(props.hash, 'File Hash')">
        <Copy class="w-5 h-5" />
      </button>
      <button title="Copy File Name" class="p-2 bg-gray-500 dark:bg-gray-600 rounded-full hover:brightness-110 text-white transition" @click="copyToClipboard(props.name, 'File Name')">
        <Copy class="w-5 h-5" />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 w-full max-w-4xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-auto rounded-md">
      <div class="transform transition-transform duration-200" :style="{ transform: `scale(${zoom}) rotate(${rotation}deg)` }">
        <img v-if="fileType === 'image'" :src="props.src" alt="Document" class="max-w-full max-h-[80vh] object-contain" />
        <iframe v-else-if="fileType === 'pdf'" :src="props.src" class="w-full h-[80vh] border-none"></iframe>
        <div v-else class="text-black dark:text-white p-4">Unsupported file type</div>
      </div>
    </div>
  </div>
</template>
