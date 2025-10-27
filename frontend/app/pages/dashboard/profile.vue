<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, User as UserIcon, Building } from 'lucide-vue-next'
import { useUserStore } from '~/stores/userStore'
import { useToast } from '~/composables/useToast'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const { addToast } = useToast()
const router = useRouter()

const editingName = ref(userStore.currentUser?.metadata?.name || '')
const saving = ref(false)

const handleSave = async () => {
  if (!userStore.currentUser) return
  if (!editingName.value.trim()) {
    addToast('Name cannot be empty', 'error')
    return
  }
  saving.value = true
  const ok = await userStore.updateMe({
    metadata: {
      ...userStore.currentUser.metadata,
      name: editingName.value.trim(),
    },
  })
  saving.value = false

  if (ok) addToast('Profile updated successfully', 'success')
  else addToast('Failed to update profile', 'error')
}

const goToCompany = () => {
  router.push('/dashboard/company')
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 class="text-3xl font-bold flex items-center gap-3 text-gray-800 dark:text-gray-100">
        <UserIcon class="w-7 h-7" />
        Profile
      </h1>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow transition"
        @click="goToCompany"
      >
        <Building class="w-4 h-4" />
        My Company
      </button>
    </div>

    <!-- Loading -->
    <div v-if="userStore.loading" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-indigo-600" />
    </div>

    <!-- Profile Form -->
    <div v-else-if="userStore.currentUser" class="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 space-y-5 border border-gray-200 dark:border-gray-700">
      <!-- Address (Read-only) -->
      <div>
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Address
          <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">(read-only)</span>
        </label>
        <input
          type="text"
          :value="userStore.currentUser.address"
          disabled
          class="w-full p-2 rounded border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-sm"
        />
      </div>

      <!-- Name (Editable) -->
      <div>
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Name</label>
        <input
          v-model="editingName"
          type="text"
          placeholder="Your name"
          class="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      <!-- Role (Read-only) -->
      <div>
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Role
          <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">(read-only)</span>
        </label>
        <input
          type="text"
          :value="userStore.currentUser.role"
          disabled
          class="w-full p-2 rounded border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize"
        />
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          :disabled="saving"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-2 shadow disabled:opacity-50 transition"
          @click="handleSave"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <span v-else>Save</span>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center text-gray-500 py-12">
      Failed to load profile.
    </div>
  </div>
</template>
