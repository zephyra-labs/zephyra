<script setup lang="ts">
import { reactive, watch, ref, onMounted, onBeforeUnmount } from 'vue'
import type { UserCompany } from '~/types/UserCompany'

const props = defineProps({
  show: { type: Boolean, required: true },
  modelValue: { type: Object as () => UserCompany | null, default: null },
  editing: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: Partial<UserCompany>): void
}>()

const form = reactive<Partial<UserCompany>>({
  id: '',
  userAddress: '',
  companyId: '',
  role: 'staff',
  status: 'pending',
})

const loading = ref(false)

// Sync props.modelValue to form
watch(
  () => props.modelValue,
  (val) => {
    if (val) Object.assign(form, val)
    else {
      form.id = ''
      form.userAddress = ''
      form.companyId = ''
      form.role = 'staff'
      form.status = 'pending'
    }
  },
  { immediate: true }
)

const close = () => emit('update:show', false)

const submit = async () => {
  loading.value = true
  try {
    await emit('submit', { ...form })
    close()
  } finally {
    loading.value = false
  }
}

// Close modal on ESC key
const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', handleEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEsc))
</script>

<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-xl w-full max-w-lg shadow-xl transform scale-95 motion-safe:animate-fadeIn"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">{{ props.editing ? 'Edit Relation' : 'Add Relation' }}</h2>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold" @click="close">&times;</button>
        </div>

        <form class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto" @submit.prevent="submit">
          <!-- User Address -->
          <div>
            <label class="block text-sm font-medium mb-1">User Address</label>
            <input
              v-model="form.userAddress"
              class="input w-full dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
              :disabled="props.editing"
              required
            />
          </div>

          <!-- Company ID -->
          <div>
            <label class="block text-sm font-medium mb-1">Company ID</label>
            <input
              v-model="form.companyId"
              class="input w-full dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
              :disabled="props.editing"
              required
            />
          </div>

          <!-- Role -->
          <div>
            <label class="block text-sm font-medium mb-1">Role</label>
            <select
              v-model="form.role"
              class="select w-full dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <select
              v-model="form.status"
              class="select w-full dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <!-- Submit & Cancel Buttons -->
          <div class="col-span-2 flex justify-end gap-2 mt-4">
            <button type="button" class="btn btn-outline" @click="close">Cancel</button>
            <button type="submit" class="btn btn-primary flex items-center justify-center" :disabled="loading">
              <span v-if="loading" class="loader mr-2"></span>
              {{ props.editing ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.input {
  border: 1px solid #ccc;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  background-color: white;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.dark .input {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}

.select {
  border: 1px solid #ccc;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}
.select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.dark .select { background-color: #1f2937; border-color: #374151; color: #f3f4f6; }

.btn-primary {
  background-color: #2563eb;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}
.btn-primary:hover { background-color: #1e40af }

.btn-outline {
  background-color: #e5e7eb;
  color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}
.btn-outline:hover { background-color: #9ca3af }

.loader {
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.motion-safe\:animate-fadeIn {
  animation: fadeInScale 0.2s ease forwards;
}
@keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
</style>
