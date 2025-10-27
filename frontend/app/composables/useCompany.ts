import { ref } from 'vue'
import { useActivityLogs } from './useActivityLogs'
import { useWallet } from './useWallets'
import { useApi } from './useApi'
import type { Company, CreateCompanyPayload, UpdateCompanyPayload } from '~/types/Company'

export function useCompany() {
  const companies = ref<Company[]>([])
  const company = ref<Company | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { request } = useApi()
  const { addActivityLog } = useActivityLogs()
  const { account } = useWallet()

  const fetchCompanies = async () => {
    if (!account.value) return
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: Company[] }>('/company')
      companies.value = data.data ?? []
    } catch (err: any) {
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const fetchCompanyById = async (id: string) => {
    if (!account.value) return
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: Company }>(`/company/${id}`)
      company.value = data.data ?? null
    } catch (err: any) {
      error.value = err.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createCompany = async (payload: CreateCompanyPayload) => {
    if (!account.value) return null
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: Company }>('/company', { 
        method: 'POST', 
        body: JSON.stringify({ ...payload, executor: account.value }) 
      })

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'createCompany',
        tags: ['company', 'create'],
        extra: { companyId: data.data.id, ...payload },
      })

      return data.data
    } catch (err: any) {
      error.value = err.message || 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateCompany = async (id: string, payload: UpdateCompanyPayload) => {
    if (!account.value) return null
    loading.value = true
    error.value = null
    try {
      const data = await request<{ data: Company }>(`/company/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...payload, executor: account.value }) 
      })

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'updateCompany',
        tags: ['company', 'update'],
        extra: { companyId: id, ...payload },
      })

      return data.data
    } catch (err: any) {
      error.value = err.message || 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteCompany = async (id: string) => {
    if (!account.value) return false
    loading.value = true
    error.value = null
    try {
      const data = await request<{ success: boolean }>(`/company/${id}`, { 
        method: 'DELETE', 
        body: JSON.stringify({ executor: account.value }) 
      })

      await addActivityLog(account.value, {
        type: 'backend',
        action: 'deleteCompany',
        tags: ['company', 'delete'],
        extra: { companyId: id },
      })

      return data.success
    } catch (err: any) {
      error.value = err.message || 'Unknown error'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    companies,
    company,
    loading,
    error,
    fetchCompanies,
    fetchCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}
