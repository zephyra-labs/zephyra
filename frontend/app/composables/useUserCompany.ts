import { ref, computed, watch } from 'vue'
import { useWallet } from './useWallets'
import { useApi } from './useApi'
import { useActivityLogs } from './useActivityLogs'
import type {
  UserCompany,
  CreateUserCompanyDTO,
  UpdateUserCompanyDTO,
} from '~/types/UserCompany'
import type {
  Company,
  UpdateCompanyPayload,
} from '~/types/Company'

interface PaginatedResponse<T> {
  data: T
  total: number
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export function useUserCompany() {
  // --- STATE ---
  const userCompanies = ref<UserCompany[]>([])
  const myCompany = ref<Company | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const limit = ref(10)
  const total = ref(0)

  const searchText = ref('')
  const filterRole = ref('')
  const filterStatus = ref('')
  const filterCompanyId = ref('')

  const { account } = useWallet()
  const { request } = useApi()
  const { addActivityLog } = useActivityLogs()

  // --- Computed Query ---
  const queryParams = computed(() => {
    const params = new URLSearchParams()
    params.append('page', page.value.toString())
    params.append('limit', limit.value.toString())
    if (searchText.value) params.append('search', searchText.value)
    if (filterRole.value) params.append('role', filterRole.value)
    if (filterStatus.value) params.append('status', filterStatus.value)
    if (filterCompanyId.value) params.append('companyId', filterCompanyId.value)
    return params.toString()
  })

  // --- Fetch all user-company relations ---
  const fetchUserCompanies = async (): Promise<void> => {
    if (!account.value) return
    loading.value = true
    error.value = null
    try {
      const res = await request<PaginatedResponse<UserCompany[]>>(
        `/user-company?${queryParams.value}`
      )
      userCompanies.value = res.data ?? []
      total.value = res.total ?? 0
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user companies'
    } finally {
      loading.value = false
    }
  }

  // --- Fetch current user's company ---
  const fetchMyCompany = async (): Promise<void> => {
    if (!account.value) return
    loading.value = true
    error.value = null
    try {
      const res = await request<ApiResponse<Company>>('/user-company/my-company')
      myCompany.value = res.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch my company'
      myCompany.value = null
    } finally {
      loading.value = false
    }
  }

  // --- Update current user's company ---
  const updateMyCompany = async (
    payload: UpdateCompanyPayload
  ): Promise<Company | null> => {
    if (!account.value) return null
    loading.value = true
    error.value = null
    try {
      const res = await request<ApiResponse<Company>>('/user-company/my-company', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      myCompany.value = res.data

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'updateMyCompany',
        tags: ['company', 'update', 'self'],
        extra: payload,
      })

      return res.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update my company'
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Watchers ---
  watch([searchText, filterRole, filterStatus, filterCompanyId], () => {
    page.value = 1
    fetchUserCompanies()
  })

  watch(page, () => fetchUserCompanies())

  // --- Create user-company ---
  const createUserCompany = async (
    payload: CreateUserCompanyDTO
  ): Promise<UserCompany | null> => {
    if (!account.value) return null
    loading.value = true
    try {
      const res = await request<ApiResponse<UserCompany>>('/user-company', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      userCompanies.value.unshift(res.data)

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'createUserCompany',
        tags: ['user-company', 'create'],
        extra: { ...payload, userCompanyId: res.data.id },
      })

      return res.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create user-company'
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Update user-company ---
  const updateUserCompany = async (
    id: string,
    payload: UpdateUserCompanyDTO
  ): Promise<UserCompany | null> => {
    if (!account.value) return null
    loading.value = true
    try {
      const res = await request<ApiResponse<UserCompany>>(`/user-company/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      const idx = userCompanies.value.findIndex((uc) => uc.id === id)
      if (idx !== -1) userCompanies.value[idx] = res.data

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'updateUserCompany',
        tags: ['user-company', 'update'],
        extra: { ...payload, userCompanyId: id },
      })
      return res.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update user-company'
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Delete user-company ---
  const deleteUserCompany = async (id: string): Promise<boolean> => {
    if (!account.value) return false
    loading.value = true
    try {
      await request(`/user-company/${id}`, { method: 'DELETE' })
      userCompanies.value = userCompanies.value.filter((uc) => uc.id !== id)
      await addActivityLog(account.value, {
        type: 'backend',
        action: 'deleteUserCompany',
        tags: ['user-company', 'delete'],
        extra: { userCompanyId: id },
      })
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user-company'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    userCompanies,
    myCompany,
    loading,
    error,
    page,
    limit,
    total,
    searchText,
    filterRole,
    filterStatus,
    filterCompanyId,
    fetchUserCompanies,
    fetchMyCompany,
    updateMyCompany,
    createUserCompany,
    updateUserCompany,
    deleteUserCompany,
  }
}
