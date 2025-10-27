<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building, MapPin, Mail } from 'lucide-vue-next'
import { useUserCompany } from '~/composables/useUserCompany'
import type { Company, UpdateCompanyPayload } from '~/types/Company'
import { useToast } from '~/composables/useToast'

const { myCompany, fetchMyCompany, updateMyCompany, loading: loadingCompany } = useUserCompany()
const { addToast } = useToast()

const company = ref<Company | null>(null)
const editing = ref(false)
const saving = ref(false)

const form = ref<UpdateCompanyPayload>({
  name: '',
  address: '',
  city: '',
  stateOrProvince: '',
  postalCode: '',
  country: '',
  email: '',
  phone: '',
  taxId: '',
  registrationNumber: '',
  businessType: '',
  website: ''
})

onMounted(async () => {
  await fetchMyCompany()
  if (myCompany.value) {
    company.value = myCompany.value
    form.value = { ...myCompany.value }
  }
})

const updateCompany = async () => {
  if (!company.value) return
  saving.value = true
  const updated = await updateMyCompany(form.value)
  if (updated) {
    company.value = updated
    form.value = { ...updated }
    editing.value = false
    addToast('Company updated successfully', 'success')
  }
  saving.value = false
}

const cancelEdit = () => {
  editing.value = false
  if (company.value) form.value = { ...company.value }
  addToast('Edit cancelled', 'info')
}
</script>

<template>
  <div class="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <h1 class="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Building class="w-5 h-5" />
        My Company
      </h1>
      <button
        v-if="company"
        class="px-4 py-2 rounded-lg font-medium text-white transition-colors shadow"
        :class="editing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'"
        @click="editing = !editing"
      >
        {{ editing ? 'Cancel' : 'Edit' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loadingCompany" class="flex justify-center py-10">
      <svg class="animate-spin h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="!company" class="text-center text-gray-600 dark:text-gray-400 py-10">
      You are not associated with any company yet.
    </div>

    <!-- Company Form / Card -->
    <div v-else class="space-y-6">
      <form v-if="editing" class="space-y-6" @submit.prevent="updateCompany">
        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md space-y-4 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Building class="w-5 h-5" /> Company Info
          </h2>
          <input v-model="form.name" placeholder="Company Name" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
          <input v-model="form.businessType" placeholder="Business Type" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"/>
        </section>

        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md space-y-4 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <MapPin class="w-5 h-5" /> Address
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input v-model="form.address" placeholder="Street Address" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
            <input v-model="form.city" placeholder="City" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
            <input v-model="form.stateOrProvince" placeholder="State/Province" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
            <input v-model="form.postalCode" placeholder="Postal Code" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
            <input v-model="form.country" placeholder="Country" class="sm:col-span-2 w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
          </div>
        </section>

        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md space-y-4 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Mail class="w-5 h-5" /> Contact
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input v-model="form.email" placeholder="Email" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
            <input v-model="form.phone" placeholder="Phone" class="w-full rounded-lg border-gray-500 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white p-2 focus:ring-2 focus:ring-blue-500"/>
          </div>
        </section>

        <div class="flex justify-end gap-3">
          <button type="button" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow" @click="cancelEdit">Cancel</button>
          <button type="submit" :disabled="saving" class="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center gap-2 shadow">
            <svg v-if="saving" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            <span>Save</span>
          </button>
        </div>
      </form>

      <!-- Read-Only Card -->
      <div v-else class="space-y-4">
        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md border border-gray-500 dark:border-gray-700 space-y-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Building class="w-5 h-5" /> Company Info
          </h2>
          <p class="text-gray-900 dark:text-white"><strong>Name:</strong> {{ company.name }}</p>
          <p class="text-gray-900 dark:text-white"><strong>Business Type:</strong> {{ company.businessType || '-' }}</p>
        </section>

        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md border border-gray-500 dark:border-gray-700 space-y-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <MapPin class="w-5 h-5" /> Address
          </h2>
          <p class="text-gray-900 dark:text-white"><strong>Street:</strong> {{ company.address || '-' }}</p>
          <p class="text-gray-900 dark:text-white"><strong>City:</strong> {{ company.city || '-' }}</p>
          <p class="text-gray-900 dark:text-white"><strong>State/Province:</strong> {{ company.stateOrProvince || '-' }}</p>
          <p class="text-gray-900 dark:text-white"><strong>Postal Code:</strong> {{ company.postalCode || '-' }}</p>
          <p class="text-gray-900 dark:text-white"><strong>Country:</strong> {{ company.country || '-' }}</p>
        </section>

        <section class="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-md border border-gray-500 dark:border-gray-700 space-y-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Mail class="w-5 h-5" /> Contact
          </h2>
          <p class="text-gray-900 dark:text-white"><strong>Email:</strong> {{ company.email || '-' }}</p>
          <p class="text-gray-900 dark:text-white"><strong>Phone:</strong> {{ company.phone || '-' }}</p>
        </section>
      </div>
    </div>
  </div>
</template>
