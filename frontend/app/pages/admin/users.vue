<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useToast } from '~/composables/useToast'
import { Edit, Trash2, Loader2 } from 'lucide-vue-next'
import type { User, KYCStatus } from '~/types/User'

// --- Store & Toast ---
const userStore = useUserStore()
const { addToast } = useToast()

// --- Reactive states ---
const editingUser = ref<User | null>(null)
const editedName = ref('')
const editedEmail = ref('')
const editedKYCStatus = ref<KYCStatus | ''>('')
const showEditModal = ref(false)
const saving = ref(false)
const deleting = ref<string | null>(null)

// --- Destructure readonly store props ---
const users = computed(() => userStore.users)
const loading = computed(() => userStore.loading)

// --- Modal handlers ---
const openEditModal = (user: User) => {
  editingUser.value = { ...user }
  editedName.value = user.metadata?.name ?? ''
  editedEmail.value = user.metadata?.email ?? ''
  editedKYCStatus.value = user.metadata?.kycStatus ?? ''
  showEditModal.value = true
}

const closeEditModal = () => {
  editingUser.value = null
  editedName.value = ''
  editedEmail.value = ''
  editedKYCStatus.value = ''
  saving.value = false
  showEditModal.value = false
}

// --- Delete handler ---
const handleDelete = async (address: string) => {
  if (!confirm('Are you sure you want to delete this user?')) return
  deleting.value = address
  const ok = await userStore.remove(address)
  if (ok) {
    addToast('User deleted successfully', 'success')
    if (editingUser.value?.address === address) closeEditModal()
    await userStore.fetchAll()
  } else {
    addToast('Failed to delete user', 'error')
  }
  deleting.value = null
}

// --- Save handler (Admin update) ---
const handleSave = async () => {
  if (!editingUser.value) return
  saving.value = true

  const payload = { 
    metadata: { 
      ...editingUser.value.metadata, 
      name: editedName.value,
      email: editedEmail.value,
      kycStatus: editedKYCStatus.value || undefined
    } 
  }

  const updated = await userStore.update(editingUser.value.address, payload)
  saving.value = false

  if (updated) {
    addToast('User updated successfully', 'success')
    await userStore.fetchAll()
    closeEditModal()
  } else {
    addToast('Failed to update user', 'error')
  }
}

// --- Fetch all users on mount ---
onMounted(() => {
  userStore.fetchAll()
})
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">

    <h1 class="text-2xl font-bold mb-4">User Management</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center p-6">
      <Loader2 class="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700 text-left text-gray-700 dark:text-gray-200">
            <th class="p-2 border-b">Address</th>
            <th class="p-2 border-b">Name</th>
            <th class="p-2 border-b">Email</th>
            <th class="p-2 border-b">KYC Status</th>
            <th class="p-2 border-b">Role</th>
            <th class="p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.address"
            class="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <td class="p-2 font-mono text-sm break-all">{{ user.address }}</td>
            <td class="p-2 break-all">{{ user.metadata?.name || '-' }}</td>
            <td class="p-2 break-all">{{ user.metadata?.email || '-' }}</td>
            <td class="p-2 capitalize">{{ user.metadata?.kycStatus || '-' }}</td>
            <td class="p-2 capitalize">{{ user.role }}</td>
            <td class="p-2 flex gap-2">

              <!-- Edit Button -->
              <button 
                class="flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                :disabled="deleting === user.address"
                title="Edit User"
                @click="openEditModal(user)"
              >
                <Edit class="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>

              <!-- Delete Button -->
              <button 
                class="flex items-center justify-center p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition disabled:opacity-50"
                :disabled="deleting === user.address"
                title="Delete User"
                @click="handleDelete(user.address)"
              >
                <Loader2 v-if="deleting === user.address" class="w-4 h-4 animate-spin text-red-600" />
                <Trash2 v-else class="w-4 h-4 text-red-600" />
              </button>

            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="users.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-6">
        No users found.
      </div>
    </div>

    <!-- Edit Modal -->
    <transition name="fade">
      <div 
        v-if="showEditModal && editingUser" 
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">
          <h2 class="text-xl font-semibold mb-4">Edit User</h2>
          <p class="mb-4 font-mono text-sm break-all">{{ editingUser.address }}</p>

          <!-- Name Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Name</label>
            <input 
              v-model="editedName" 
              type="text" 
              placeholder="Enter user name"
              class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <!-- Email Input -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Email</label>
            <input 
              v-model="editedEmail" 
              type="email" 
              placeholder="Enter user email"
              class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <!-- KYC Status Select -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">KYC Status</label>
            <select
              v-model="editedKYCStatus"
              class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <!-- Modal Actions -->
          <div class="flex justify-end gap-2">
            <button 
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              :disabled="saving"
              @click="closeEditModal"
            >
              Close
            </button>
            <button 
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50" 
              :disabled="saving"
              @click="handleSave"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <span v-else>Save</span>
            </button>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
