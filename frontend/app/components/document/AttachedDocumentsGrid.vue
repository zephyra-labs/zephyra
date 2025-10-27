<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { Document as DocType } from '~/types/Document'

defineProps({
  documents: {
    type: Array as PropType<DocType[]>,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  userRole: {
    type: String as PropType<'admin' | 'importer' | 'exporter' | 'logistics' | null>,
    default: 'viewer'
  }
})

defineEmits<{
  (e: 'view', doc: DocType): void
  (e: 'review', doc: DocType): void
  (e: 'sign', doc: DocType): void
  (e: 'revoke', doc: DocType): void
}>()

const showViewer = ref(false)
const selectedDoc = ref<DocType | null>(null)

const openViewer = (doc: DocType) => {
  selectedDoc.value = doc
  showViewer.value = true
}
</script>

<template>
  <div class="space-y-4">
    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Attached Documents</h3>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 3" :key="n" class="border rounded-lg p-3 animate-pulse bg-gray-100 dark:bg-gray-700">
        <div class="h-28 w-full bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-500 rounded mb-1"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-500 rounded mb-1 w-3/4"></div>
        <div class="h-4 bg-gray-300 dark:bg-gray-500 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Documents Grid -->
    <div v-else-if="documents.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="doc in documents"
        :key="doc.tokenId"
        class="border rounded-lg p-3 flex flex-col justify-between hover:shadow-lg transition bg-white dark:bg-gray-800"
      >
        <!-- Thumbnail / Icon -->
        <div
          class="h-32 w-full mb-2 flex items-center justify-center border rounded bg-gray-50 dark:bg-gray-700 overflow-hidden cursor-pointer"
          @click="openViewer(doc); $emit('view', doc)"
        >
          <img v-if="doc.uri.match(/\.(png|jpg|jpeg|webp)$/i)" :src="doc.uri" class="object-cover w-full h-full" />
          <span v-else class="text-gray-400 text-4xl">📄</span>
        </div>

        <!-- Info -->
        <div class="flex-1 flex flex-col gap-1">
          <p class="font-medium text-gray-800 dark:text-gray-100 truncate" :title="doc.name">{{ doc.name }}</p>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">{{ doc.docType }}</span>
            <span class="truncate" :title="doc.fileHash">Hash: {{ doc.fileHash }}</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">TokenID: {{ doc.tokenId }}</p>
          <p class="text-xs font-semibold">
            Status:
            <span
              :class="{
                'px-2 py-1 rounded-full text-white text-xs': true,
                'bg-gray-400': doc.status==='Draft',
                'bg-blue-600': doc.status==='Reviewed',
                'bg-green-600': doc.status==='Signed',
                'bg-red-600': doc.status==='Revoked'
              }"
            >
              {{ doc.status }}
            </span>
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-2 flex flex-col gap-1">
          <div class="flex gap-2">
            <button
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded-lg"
              @click="$emit('view', doc)"
            >
              View
            </button>
            <a
              :href="doc.uri"
              target="_blank"
              class="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1 rounded-lg text-center"
            >
              Download
            </a>
          </div>

          <div class="flex gap-2 mt-1">
            <!-- Review button hanya untuk admin & importer -->
            <button
              v-if="doc.status==='Draft' && (userRole==='admin' || userRole==='importer')"
              class="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 rounded-lg"
              @click="$emit('review', doc)"
            >
              Review
            </button>

            <!-- Sign button hanya untuk admin & exporter -->
            <button
              v-if="doc.status==='Reviewed' && (userRole==='admin' || userRole==='exporter')"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded-lg"
              @click="$emit('sign', doc)"
            >
              Sign
            </button>

            <!-- Revoke hanya untuk admin -->
            <button
              v-if="doc.status!=='Revoked' && doc.status!=='Draft' && doc.status!=='Signed' && userRole==='admin'"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded-lg"
              @click="$emit('revoke', doc)"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-gray-500 dark:text-gray-400 text-sm text-center py-6">
      No documents attached yet.
    </div>
  </div>
</template>
