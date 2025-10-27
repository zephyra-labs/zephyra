import { ref, reactive } from 'vue'
import { useApi } from './useApi'
import type { ActivityItem, AggregatedFilters, FetchActivitiesResult } from '~/types/AggregatedActivity'

export function useAggregatedActivity() {
  // --- State ---
  const activities = ref<ActivityItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const lastTimestamp = ref<number | null>(null)

  const filters = reactive<AggregatedFilters>({
    account: null,
    txHash: null,
    contractAddress: null,
    tags: [],
    limit: 20,
  })

  const { request } = useApi()

  const normalizeActivity = (item: any): ActivityItem => {
    return {
      id: item.id || item.txHash || String(item.timestamp),
      timestamp: item.timestamp,
      type: item.type,
      action: item.action,
      account: item.account || "-",
      txHash: item.txHash || item.extra?.txHash || "-",
      contractAddress: item.contractAddress || item.extra?.contract || "-",
      tags: item.tags || [],
      extra: item.extra || {},
      onChainInfo: item.onChainInfo || {},
    }
  }

  // --- Fetch activities with filters & pagination ---
  const fetchActivities = async (
    customFilters?: Partial<AggregatedFilters>,
    startAfterTimestamp?: number | null
  ): Promise<FetchActivitiesResult> => {
    loading.value = true
    error.value = null
    if (!startAfterTimestamp) activities.value = []

    try {
      const combinedFilters = { ...filters, ...customFilters }
      const queryParams: Record<string, string> = {}

      Object.entries(combinedFilters).forEach(([key, value]) => {
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return
        queryParams[key] = Array.isArray(value) ? value.join(',') : String(value)
      })

      if (startAfterTimestamp) queryParams['startAfterTimestamp'] = String(startAfterTimestamp)
      const query = new URLSearchParams(queryParams).toString()

      const res = await request<FetchActivitiesResult>(`/aggregated?${query}`)
      const { data, nextStartAfterTimestamp } = res

      const normalizedData = data.map(normalizeActivity)

      if (startAfterTimestamp) {
        activities.value.push(...normalizedData)
      } else {
        activities.value = normalizedData
      }

      lastTimestamp.value = nextStartAfterTimestamp
      totalCount.value = activities.value.length

      return { data, nextStartAfterTimestamp }
    } catch (err: any) {
      error.value = err.message ?? String(err)
      console.error('Error fetching aggregated activities:', err)
      return { data: [], nextStartAfterTimestamp: null }
    } finally {
      loading.value = false
    }
  }

  // --- Fetch single activity by ID ---
  const fetchActivityById = async (id: string): Promise<ActivityItem | null> => {
    loading.value = true
    error.value = null
    try {
      const data = await request<ActivityItem>(`/aggregated/${id}`)
      return { ...data, tags: data.tags || [] }
    } catch (err: any) {
      error.value = err.message ?? String(err)
      console.error('Error fetching activity by ID:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Add tag to activity ---
  const addTag = async (id: string, tag: string) => {
    if (!tag) return
    try {
      await request(`/aggregated/${id}/tag`, {
        method: 'POST',
        body: JSON.stringify({ tag }),
      })

      const activity = activities.value.find(a => a.id === id)
      if (activity) {
        activity.tags = activity.tags || []
        if (!activity.tags.includes(tag)) activity.tags.push(tag)
      }
    } catch (err: any) {
      console.error('Failed to add tag:', err)
      throw err
    }
  }

  // --- Remove tag from activity ---
  const removeTag = async (id: string, tag: string) => {
    if (!tag) return
    try {
      await request(`/aggregated/${id}/tag?tag=${encodeURIComponent(tag)}`, { method: 'DELETE' })

      const activity = activities.value.find(a => a.id === id)
      if (activity && activity.tags) {
        activity.tags = activity.tags.filter(t => t !== tag)
      }
    } catch (err: any) {
      console.error('Failed to remove tag:', err)
      throw err
    }
  }

  // --- Reset all filters ---
  const resetFilters = () => {
    filters.account = null
    filters.txHash = null
    filters.contractAddress = null
    filters.tags = []
    filters.limit = 20
    lastTimestamp.value = null
  }

  return {
    activities,
    totalCount,
    lastTimestamp,
    loading,
    error,
    filters,
    fetchActivities,
    fetchActivityById,
    addTag,
    removeTag,
    resetFilters,
  }
}
