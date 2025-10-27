<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useAggregatedActivity } from '~/composables/useAggregatedActivity'
import { useToast } from '~/composables/useToast'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { CheckCircle, ArrowRight, PlusCircle, Trash2, AlertCircle } from 'lucide-vue-next'

const { activities, loading, lastTimestamp, fetchActivities, addTag, removeTag } = useAggregatedActivity()
const { addToast } = useToast()

// --- Filters ---
const accountFilter = ref('')
const txHashFilter = ref('')
const contractFilter = ref('')
const tagsFilter = ref('')
const newTags = reactive<Record<string, string>>({})

// --- State ---
const expanded = reactive<Record<string, boolean>>({})
const hasMore = ref(true)
const scroller = ref<any>(null)
const fetching = ref(false)

// --- Icons map ---
const actionIconMap: Record<string, any> = {
  transfer: ArrowRight,
  mint: PlusCircle,
  burn: Trash2,
  approve: CheckCircle,
  error: AlertCircle,
}

// --- Helpers ---
const isRecent = (ts: number) => Date.now() - ts < 24 * 60 * 60 * 1000

// --- Load next page ---
const loadNextPage = async (isFilterReset = false) => {
  if (loading.value || fetching.value || !hasMore.value) return
  fetching.value = true
  loading.value = true

  try {
    const res = await fetchActivities(
      {
        account: accountFilter.value || null,
        txHash: txHashFilter.value || null,
        contractAddress: contractFilter.value || null,
        tags: tagsFilter.value ? tagsFilter.value.split(',').map(t => t.trim()) : [],
      },
      isFilterReset ? null : lastTimestamp.value
    )

    const el = scroller.value?.$el as HTMLElement
    const prevScroll = el?.scrollTop || 0

    // --- Filter duplikat sebelum push ---
    const newItems = res.data.filter(item => !activities.value.find(a => a.id === item.id))

    if (isFilterReset) activities.value = newItems
    else activities.value.push(...newItems)

    lastTimestamp.value = res.nextStartAfterTimestamp
    if (!res.nextStartAfterTimestamp) hasMore.value = false

    await nextTick()
    if (!isFilterReset && el) el.scrollTop = prevScroll
  } catch (err: any) {
    addToast('error', err.message || 'Unknown error')
    hasMore.value = false
  } finally {
    loading.value = false
    fetching.value = false
  }
}

// --- Apply filters ---
const applyFilters = async () => {
  hasMore.value = true
  lastTimestamp.value = null
  activities.value = []
  await fetchActivities({
    account: accountFilter.value || null,
    txHash: txHashFilter.value || null,
    contractAddress: contractFilter.value || null,
    tags: tagsFilter.value ? tagsFilter.value.split(',').map(t => t.trim()) : [],
  }, null)
}

// --- Scroll handler ---
let scrollScheduled = false
const onScroll = () => {
  if (!scroller.value || scrollScheduled) return
  scrollScheduled = true
  requestAnimationFrame(() => {
    const el = scroller.value.$el as HTMLElement
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) loadNextPage()
    scrollScheduled = false
  })
}

// --- Expand JSON ---
const toggleExpand = (id: string) => { expanded[id] = !expanded[id] }

// --- Tag management ---
const handleAddTag = async (id: string, tag: string) => {
  if (!tag) return
  try {
    await addTag(id, tag)
    newTags[id] = ''
    addToast(`Tag "${tag}" added!`, 'success')
  } catch (err: any) {
    addToast(err.message || 'Failed to add tag', 'error')
  }
}

const handleRemoveTag = async (id: string, tag: string) => {
  try {
    await removeTag(id, tag)
    addToast(`Tag "${tag}" removed!`, 'success')
  } catch (err: any) {
    addToast(err.message || 'Failed to remove tag', 'error')
  }
}

// --- Initial fetch ---
onMounted(() => loadNextPage())
</script>

<template>
  <div class="p-6 max-w-[95vw] mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Aggregated Activity Logs</h1>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-3 items-end">
      <input
        v-model="accountFilter"
        placeholder="Account"
        class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded w-full md:w-auto focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <input
        v-model="txHashFilter"
        placeholder="TxHash"
        class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded w-full md:w-auto focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <input
        v-model="contractFilter"
        placeholder="Contract Address"
        class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded w-full md:w-auto focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <input
        v-model="tagsFilter"
        placeholder="Tags (comma separated)"
        class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded w-full md:w-auto focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      <button class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded transition" @click="applyFilters">Apply</button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading && !activities.length" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-36 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    </div>

    <!-- Timeline -->
    <client-only>
      <DynamicScroller
        ref="scroller"
        :items="activities"
        class="timeline-list"
        :min-item-size="140"
        key-field="id"
        @scroll="onScroll"
      >
        <template #default="{ item, index }">
          <DynamicScrollerItem :key="item.id" :item="item" :active="true">
            <div class="mb-4">

              <!-- Date header -->
              <div
                v-if="index === 0 || new Date(item.timestamp).toDateString() !== new Date(activities[index-1]?.timestamp ?? 0).toDateString()"
                class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold px-3 py-1 rounded mb-2 sticky top-0 z-10"
              >
                {{ new Date(item.timestamp).toLocaleDateString() }}
              </div>

              <!-- Activity card -->
              <div
                :class="[
                  'grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg shadow p-4 mb-3 transition hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-900 break-words',
                  isRecent(item.timestamp) ? 'border-l-4 border-indigo-500' : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <!-- Left: Icon + Action -->
                <div class="flex items-center gap-3">
                  <component :is="actionIconMap[item.action] || CheckCircle" class="w-5 h-5 text-blue-500" />
                  <div class="flex flex-col">
                    <div class="font-medium text-gray-800 dark:text-gray-100 truncate">{{ item.action }}</div>
                    <div class="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1 truncate">{{ new Date(item.timestamp).toLocaleString() }}</div>
                  </div>
                </div>

                <!-- Center: Details -->
                <div class="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300 break-words">
                  <div><span class="font-semibold">Account:</span> {{ item.account || '-' }}</div>
                  <div><span class="font-semibold">TxHash:</span> {{ item.txHash || '-' }}</div>
                  <div><span class="font-semibold">Contract:</span> {{ item.contractAddress || '-' }}</div>
                </div>

                <!-- Right: Tags + JSON -->
                <div class="flex flex-col gap-2 min-w-[140px]">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in item.tags"
                      :key="tag"
                      class="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {{ tag }}
                      <button class="ml-1 text-red-500 hover:text-red-700 transition" @click="handleRemoveTag(item.id, tag)">&times;</button>
                    </span>
                  </div>
                  <div class="flex gap-2 mt-1">
                    <input v-model="newTags[item.id]" placeholder="Tag" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded text-xs flex-1 focus:ring-1 focus:ring-green-400 focus:outline-none" />
                    <button
                      class="bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition"
                      @click="handleAddTag(item.id, newTags[item.id] as string)"
                    >
                      Add
                    </button>
                  </div>
                  <button class="text-blue-500 dark:text-blue-400 text-xs mt-1 hover:underline" @click="toggleExpand(item.id)">
                    {{ expanded[item.id] ? 'Hide JSON' : 'Show JSON' }}
                  </button>
                  <transition name="fade">
                    <pre v-if="expanded[item.id]" class="bg-gray-50 dark:bg-gray-800 p-2 mt-1 overflow-x-auto text-xs rounded shadow-inner text-gray-900 dark:text-gray-100">
{{ JSON.stringify(item, null, 2) }}
                    </pre>
                  </transition>
                </div>

              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>

      <div v-if="loading && activities.length" class="text-center text-gray-500 dark:text-gray-400 mt-2">Loading more...</div>
      <div v-if="!hasMore && activities.length" class="text-center text-gray-400 dark:text-gray-500 mt-2">No more activities</div>
      <div v-if="!activities.length && !loading" class="text-center text-gray-400 dark:text-gray-500 mt-2">No activities found</div>
    </client-only>
  </div>
</template>

<style scoped>
.timeline-list {
  max-height: 80vh;
  overflow-y: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-to, .fade-leave-from { opacity: 1; }
</style>
