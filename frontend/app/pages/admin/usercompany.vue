<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useUserCompany } from '~/composables/useUserCompany'
import type { UserCompany } from '~/types/UserCompany'
import UserCompanyModal from '~/components/usercompany/UserCompanyModal.vue'
import { useToast } from '~/composables/useToast'

// Lucide icons
import { Plus, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next'

const {
  userCompanies,
  loading,
  page,
  limit,
  total,
  searchText,
  filterRole,
  filterStatus,
  filterCompanyId,
  fetchUserCompanies,
  createUserCompany,
  updateUserCompany,
  deleteUserCompany,
} = useUserCompany()

const { addToast } = useToast()
const showModal = ref(false)
const editing = ref(false)
const selectedUC = ref<UserCompany | null>(null)

const openModal = (uc: UserCompany | null = null) => {
  selectedUC.value = uc
  editing.value = !!uc
  showModal.value = true
}

const handleSubmit = async (formData: Partial<UserCompany>) => {
  if (editing.value && formData.id) {
    await updateUserCompany(formData.id, {
      role: formData.role!,
      status: formData.status!,
    })
    addToast('User-Company relation updated successfully', 'success')
  } else {
    await createUserCompany({
      userAddress: formData.userAddress!,
      companyId: formData.companyId!,
      role: formData.role!,
      status: formData.status!,
      joinedAt: Date.now(),
    })
    addToast('User-Company relation created successfully', 'success')
  }
  showModal.value = false
  fetchUserCompanies()
}

const confirmDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this relation?')) {
    await deleteUserCompany(id)
    fetchUserCompanies()
  }
  addToast('User-Company relation deleted successfully', 'success')
}

const prevPage = () => { if (page.value > 1) page.value-- }
const nextPage = () => { page.value++ }
const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleString() : '-'

watch([searchText, filterRole, filterStatus, filterCompanyId, page], () => {
  fetchUserCompanies()
})
onMounted(() => fetchUserCompanies())
const isEmpty = computed(() => !loading.value && userCompanies.value.length === 0)
</script>

<template>
  <div class="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

    <!-- Header + Add Button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 class="text-3xl font-bold">User-Company Management</h1>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full 
               bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700
               text-white font-semibold shadow-md hover:brightness-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        @click="openModal()"
      >
        <Plus class="w-5 h-5" /> Add Relation
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">

      <!-- Search Input -->
      <div class="relative w-full sm:w-56">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          v-model="searchText"
          type="text"
          placeholder="Search by user address..."
          class="pl-10 pr-3 py-2 w-full rounded-lg 
                border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                placeholder-gray-400 dark:placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
        />
      </div>

      <!-- Role Filter -->
      <select
        v-model="filterRole"
        class="w-full sm:w-40 rounded-lg border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      >
        <option value="">All Roles</option>
        <option value="owner">Owner</option>
        <option value="staff">Staff</option>
      </select>

      <!-- Status Filter -->
      <select
        v-model="filterStatus"
        class="w-full sm:w-40 rounded-lg border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
      </select>

      <!-- Company ID Filter -->
      <input
        v-model="filterCompanyId"
        type="text"
        placeholder="Filter by company ID..."
        class="w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
              placeholder-gray-400 dark:placeholder-gray-400 
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />

      <!-- Reset Filter Button -->
      <button
        class="flex items-center gap-1 px-4 py-2 rounded-full 
              bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500
              text-gray-900 dark:text-gray-100 font-semibold shadow transition"
        @click="() => { filterRole=''; filterStatus=''; filterCompanyId=''; searchText=''; fetchUserCompanies(); }"
      >
        Reset Filters
      </button>

    </div>

    <!-- Table / Mobile Cards -->
    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">

      <!-- Desktop Table -->
      <table class="hidden md:table w-full text-left">
        <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th class="px-4 py-2">User Address</th>
            <th class="px-4 py-2">Company ID</th>
            <th class="px-4 py-2">Role</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2">Joined At</th>
            <th class="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="uc in userCompanies" :key="uc.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-4 py-2 break-all">{{ uc.userAddress }}</td>
            <td class="px-4 py-2 break-all">{{ uc.companyId }}</td>
            <td class="px-4 py-2 capitalize">{{ uc.role }}</td>
            <td class="px-4 py-2 capitalize">{{ uc.status }}</td>
            <td class="px-4 py-2">{{ formatDate(uc.joinedAt) }}</td>
            <td class="px-4 py-2 text-right flex justify-end gap-2">
              <button
                class="flex items-center gap-1 px-3 py-1 rounded-full 
                       bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-500
                       text-gray-900 font-semibold shadow transition"
                @click="openModal(uc)"
              >
                <Edit2 class="w-4 h-4" /> Edit
              </button>
              <button
                class="flex items-center gap-1 px-3 py-1 rounded-full 
                       bg-red-400 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-600
                     text-gray-900 font-semibold shadow transition"
                @click="confirmDelete(uc.id)"
              >
                <Trash2 class="w-4 h-4" /> Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Cards -->
      <div class="md:hidden p-2 space-y-3">
        <div v-for="uc in userCompanies" :key="uc.id" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow hover:shadow-md transition">
          <div class="flex justify-between items-start mb-2">
            <div class="space-y-1 text-sm">
              <div><span class="font-semibold">User:</span> {{ uc.userAddress }}</div>
              <div><span class="font-semibold">Company:</span> {{ uc.companyId }}</div>
              <div><span class="font-semibold">Role:</span> {{ uc.role }}</div>
              <div><span class="font-semibold">Status:</span> {{ uc.status }}</div>
              <div><span class="font-semibold">Joined:</span> {{ formatDate(uc.joinedAt) }}</div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-2">
            <button
              class="flex items-center gap-1 px-3 py-1 rounded-full 
                     bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600
                       text-gray-900 font-semibold shadow transition"
              @click="openModal(uc)"
            >
              <Edit2 class="w-4 h-4" /> Edit
            </button>
            <button
              class="flex items-center gap-1 px-3 py-1 rounded-full 
                     bg-red-400 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-600
                     text-gray-900 font-semibold shadow transition"
              @click="confirmDelete(uc.id)"
            >
              <Trash2 class="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Loading / Empty -->
      <div v-if="loading" class="p-4 flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400">
        <Loader2 class="animate-spin w-5 h-5" /> Loading...
      </div>
      <div v-if="isEmpty" class="p-6 text-center text-gray-500 dark:text-gray-400">
        No relations found.
      </div>

    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
      <span class="text-gray-600 dark:text-gray-400">Total: {{ total }}</span>
      <div class="flex gap-2 items-center">
        <button
          :disabled="page===1"
          class="flex items-center gap-1 px-3 py-1 rounded-full 
                 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          @click="prevPage"
        >
          <ChevronLeft class="w-4 h-4" /> Prev
        </button>
        <span>Page {{ page }}</span>
        <button
          :disabled="userCompanies.length<limit"
          class="flex items-center gap-1 px-3 py-1 rounded-full 
                 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          @click="nextPage"
        >
          Next <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Modal -->
    <UserCompanyModal v-model:show="showModal" :model-value="selectedUC" :editing="editing" @submit="handleSubmit" />

  </div>
</template>
