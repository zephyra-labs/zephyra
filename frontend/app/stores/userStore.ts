import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { useApi } from '~/composables/useApi'
import { useActivityLogs } from '~/composables/useActivityLogs'
import { useCookie } from '#app'
import type { User, UpdateUserDTO } from '~/types/User'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const currentUser = ref<User | null>(null)
  const _fetchingCurrentUser = ref(false)

  const { request } = useApi()
  const { addActivityLog } = useActivityLogs()
  const tokenCookie = useCookie('token')

  // --- Fetch current user ---
  async function fetchCurrentUser(): Promise<User | null> {
    if (_fetchingCurrentUser.value) return currentUser.value
    _fetchingCurrentUser.value = true

    try {
      if (!tokenCookie.value) {
        currentUser.value = null
        return null
      }

      const data = await request<{ data: User }>('/user/me', {
        headers: { Authorization: `Bearer ${tokenCookie.value}` },
      })

      currentUser.value = data.data
      return currentUser.value
    } catch (err: any) {
      console.warn('Failed fetch current user:', err.message)
      currentUser.value = null
      return null
    } finally {
      _fetchingCurrentUser.value = false
    }
  }

  // --- Wallet connect ---
  async function walletConnect(address: string): Promise<User | null> {
    try {
      const res = await request<{ data: User; token: string }>('/user/wallet-connect', {
        method: 'POST',
        body: JSON.stringify({ address }),
      })

      currentUser.value = res.data
      if (res.token) {
        tokenCookie.value = res.token
        if (typeof window !== 'undefined') localStorage.setItem('token', res.token)
      }

      return currentUser.value
    } catch (err: any) {
      console.warn('Failed walletConnect:', err.message)
      return null
    }
  }

  // --- Reset current user ---
  function resetCurrentUser() {
    currentUser.value = null
    _fetchingCurrentUser.value = false
    tokenCookie.value = null
    if (typeof window !== 'undefined') localStorage.removeItem('token')
  }

  // --- Admin: fetch all users ---
  async function fetchAll(): Promise<User[]> {
    loading.value = true
    try {
      const data = await request<{ data: User[] }>('/user', {
        headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
      })
      users.value = data.data
      return users.value
    } catch (err: any) {
      console.warn('Failed fetchAll users:', err.message)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchByAddress(address: string): Promise<User | null> {
    try {
      const data = await request<{ data: User }>(`/user/${address}`, {
        headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
      })
      return data.data
    } catch (err: any) {
      console.warn(`Failed fetch user ${address}:`, err.message)
      return null
    }
  }

  // --- Admin: update any user ---
  async function update(address: string, payload: UpdateUserDTO): Promise<User | null> {
    try {
      const data = await request<{ data: User }>(`/user/${address}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
      })

      await addActivityLog(address, {
        type: 'backend',
        action: `Update user ${address}`,
        extra: { ...payload },
        tags: ['user', 'update'],
      })

      users.value = users.value.map(u => (u.address === address ? data.data : u))
      return data.data
    } catch (err: any) {
      console.warn(`Failed update user ${address}:`, err.message)
      return null
    }
  }

  // --- User: update own profile ---
  async function updateMe(payload: Partial<UpdateUserDTO>): Promise<User | null> {
    if (!currentUser.value) {
      console.warn('No current user for updateMe')
      return null
    }

    try {
      const data = await request<{ data: User }>('/user/update/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
      })

      currentUser.value = data.data

      await addActivityLog(currentUser.value.address, {
        type: 'backend',
        action: `Update own profile`,
        extra: { ...payload },
        tags: ['user', 'update-me'],
      })

      return currentUser.value
    } catch (err: any) {
      console.warn('Failed updateMe:', err.message)
      return null
    }
  }

  async function remove(address: string): Promise<boolean> {
    try {
      await request(`/user/${address}`, {
        method: 'DELETE',
        headers: tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {},
      })

      users.value = users.value.filter(u => u.address !== address)

      await addActivityLog(address, {
        type: 'backend',
        action: `Delete user ${address}`,
        tags: ['user', 'delete'],
      })

      return true
    } catch (err: any) {
      console.warn(`Failed delete user ${address}:`, err.message)
      return false
    }
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    currentUser: readonly(currentUser),
    fetchCurrentUser,
    walletConnect,
    resetCurrentUser,
    fetchAll,
    fetchByAddress,
    update,
    updateMe,
    remove,
  }
})
