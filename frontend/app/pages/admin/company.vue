<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Edit, Trash2, Eye } from 'lucide-vue-next'
import { useCompany } from '~/composables/useCompany'
import { useWallet } from '~/composables/useWallets'
import { useToast } from '~/composables/useToast'

import CompanyFormModal from '~/components/company/CompanyFormModal.vue'
import CompanyDetailModal from '~/components/company/CompanyDetailModal.vue'

// composables
const { account } = useWallet()
const { companies, fetchCompanies, createCompany, updateCompany, deleteCompany, loading } = useCompany()
const { addToast } = useToast()

// states
const showFormModal = ref(false)
const showDetailModal = ref(false)
const editingCompany = ref<any | null>(null)
const detailCompany = ref<any | null>(null)

// watch wallet connection
watch(account, (newAcc) => {
  if (newAcc) fetchCompanies()
  else companies.value = []
}, { immediate: true })

// helpers
const truncateText = (text: string, max: number) => {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

// handlers
const openCreateModal = () => {
  editingCompany.value = null
  showFormModal.value = true
}

const openEditModal = (company: any) => {
  editingCompany.value = company
  showFormModal.value = true
}

const openDetailModal = (company: any) => {
  detailCompany.value = company
  showDetailModal.value = true
}

const submitForm = async (data: any) => {
  try {
    if (!account.value) throw new Error('Wallet not connected')

    if (editingCompany.value) {
      await updateCompany(editingCompany.value.id, data)
      addToast('Company updated successfully', 'success')
    } else {
      await createCompany(data)
      addToast('Company created successfully', 'success')
    }

    showFormModal.value = false
    fetchCompanies()
  } catch (err: any) {
    addToast(err.message || 'Operation failed', 'error')
  }
}

const removeCompany = async (id: string) => {
  if (!confirm('Are you sure to delete this company?')) return
  try {
    const success = await deleteCompany(id)
    if (success) {
      addToast('Company deleted successfully', 'success')
      fetchCompanies()
    }
  } catch (err: any) {
    addToast(err.message || 'Delete failed', 'error')
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
        Company Management
      </h1>
      <button class="btn-primary" @click="openCreateModal">
        <Plus :size="16" /> <span>Create Company</span>
      </button>
    </div>

    <!-- Conditional Rendering -->
    <template v-if="loading">
      <!-- Loading Skeleton -->
      <div class="space-y-3">
        <div
          v-for="n in 5"
          :key="n"
          class="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        ></div>
      </div>
    </template>

    <template v-else-if="companies.length === 0">
      <!-- Empty State -->
      <div class="text-center py-10 text-gray-500 dark:text-gray-400">
        No companies found.
      </div>
    </template>

    <template v-else>
      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table class="w-full border-collapse">
          <thead class="bg-gray-100 dark:bg-gray-900">
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Business Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(c, idx) in companies"
              :key="c.id"
              :class="idx % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'"
              class="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="max-w-[150px] truncate">{{ truncateText(c.name, 25) }}</td>
              <td>{{ c.country }}</td>
              <td class="max-w-[180px] truncate">{{ truncateText(c.email, 30) }}</td>
              <td>{{ c.phone || '-' }}</td>
              <td>{{ c.businessType || '-' }}</td>
              <td class="flex gap-2 flex-wrap">
                <button class="btn-info" @click="openDetailModal(c)">
                  <Eye :size="14" /> View
                </button>
                <button class="btn-warning" @click="openEditModal(c)">
                  <Edit :size="14" /> Edit
                </button>
                <button class="btn-danger" @click="removeCompany(c.id)">
                  <Trash2 :size="14" /> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        <div
          v-for="c in companies"
          :key="c.id"
          class="p-4 bg-white dark:bg-gray-950 rounded-lg shadow flex flex-col gap-2"
        >
          <div class="flex justify-between items-start">
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                {{ truncateText(c.name, 22) }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ c.country }} • {{ c.businessType || 'No Type' }}
              </p>
            </div>
            <div class="flex gap-1">
              <button class="btn-icon btn-info" @click="openDetailModal(c)">
                <Eye :size="14" />
              </button>
              <button class="btn-icon btn-warning" @click="openEditModal(c)">
                <Edit :size="14" />
              </button>
              <button class="btn-icon btn-danger" @click="removeCompany(c.id)">
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ truncateText(c.email, 35) }} — {{ c.phone || '-' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <CompanyFormModal
      :show="showFormModal"
      :model-value="editingCompany || {}"
      :editing="!!editingCompany"
      @update:show="val => showFormModal = val"
      @submit="submitForm"
    />
    <CompanyDetailModal
      :show="showDetailModal"
      :company="detailCompany"
      @update:show="val => showDetailModal = val"
    />
  </div>
</template>

<style scoped>
th, td {
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  min-width: 120px;
}
th {
  font-weight: 600;
  color: #374151;
}
.dark th { color: #d1d5db; }

/* Buttons */
.btn-primary, .btn-warning, .btn-danger, .btn-info {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  cursor: pointer;
  border: none;
  color: white;
}
.btn-primary { background: #2563eb; }
.btn-primary:hover { background: #1d4ed8; }

.btn-warning { background: #f59e0b; }
.btn-warning:hover { background: #d97706; }

.btn-danger { background: #ef4444; }
.btn-danger:hover { background: #dc2626; }

.btn-info { background: #3b82f6; }
.btn-info:hover { background: #1d4ed8; }

.btn-icon {
  padding: 0.35rem;
  border-radius: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
