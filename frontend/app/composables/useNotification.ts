import { ref, computed, onBeforeUnmount } from 'vue'
import { useRuntimeConfig } from '#app'
import type { Notification } from '@/types/Notification'
import { useApi } from '~/composables/useApi'

// --- Global state ---
const _notifications = ref<Notification[]>([])
const _loading = ref(false)
const _error = ref<string | null>(null)
const _wsMap = new Map<string, WebSocket>()

export function useNotification(userId?: string) {
  const config = useRuntimeConfig()
  const $wsBase = config.public.wsBase
  const { request } = useApi()

  // --- Computed ---
  const notifications = computed(() => _notifications.value)
  const loading = computed(() => _loading.value)
  const error = computed(() => _error.value)
  const unreadCount = computed(() => _notifications.value.filter(n => !n.read).length)

  // --- Init WS ---
  const initWebSocket = (uid: string) => {
    if (!uid) return
    _wsMap.get(uid)?.close()

    const ws = new WebSocket(`${$wsBase}/ws/notifications?userId=${uid.toLowerCase()}`)
    _wsMap.set(uid, ws)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'notification' && msg.data) {
          _notifications.value.unshift(msg.data)
        }
      } catch (err) {
        console.error('Failed to parse WS message', err)
      }
    }
  }

  // --- Fetch notifications ---
  const fetchNotificationsByUser = async (uid?: string) => {
    const id = uid || userId
    if (!id) return
    _loading.value = true
    _error.value = null

    try {
      const data = await request<{ data: Notification[] }>(`/notification/user/${id.toLowerCase()}`)
      _notifications.value = data.data ?? []
      initWebSocket(id)
    } catch (err: any) {
      _error.value = err.message || 'Unknown'
    } finally {
      _loading.value = false
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await request(`/notification/${id}/read`, { method: 'PATCH' })
      const idx = _notifications.value.findIndex(n => n.id === id)
      if (idx !== -1) _notifications.value[idx]!.read = true
    } catch (err: any) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await request(`/notification/${id}`, { method: 'DELETE' })
      _notifications.value = _notifications.value.filter(n => n.id !== id)
    } catch (err: any) {
      console.error('Failed to delete notification', err)
    }
  }

  const markAllAsRead = async () => {
    await Promise.all(_notifications.value.filter(n => !n.read).map(n => markAsRead(n.id)))
  }

  onBeforeUnmount(() => {
    if (userId) _wsMap.get(userId)?.close()
  })

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotificationsByUser,
    markAsRead,
    deleteNotification,
    markAllAsRead
  }
}
