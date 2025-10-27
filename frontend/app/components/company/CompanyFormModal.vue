<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
  modelValue: any
  editing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: any): void
}>()

const showModal = ref(false)
const form = ref({ ...props.modelValue })

watch(() => props.modelValue, (val) => {
  form.value = { ...val }
})

watch(() => props.show, async (val) => {
  if (val) {
    showModal.value = true
    await nextTick()
    document.body.style.overflow = 'hidden'
  } else {
    showModal.value = false
    document.body.style.overflow = ''
  }
})

const close = () => emit('update:show', false)
const submit = () => emit('submit', { ...form.value })
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="showModal" class="modal-backdrop" @click.self="close">
      <div class="modal bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <h2 class="text-2xl font-bold mb-4">{{ props.editing ? 'Edit Company' : 'Create Company' }}</h2>

        <div class="modal-content grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" placeholder="Company Name" class="input" />
          </div>
          <div class="form-group">
            <label>Address</label>
            <input v-model="form.address" placeholder="Street Address" class="input" />
          </div>
          <div class="form-group">
            <label>City</label>
            <input v-model="form.city" placeholder="City" class="input" />
          </div>
          <div class="form-group">
            <label>State / Province</label>
            <input v-model="form.stateOrProvince" placeholder="State / Province" class="input" />
          </div>
          <div class="form-group">
            <label>Postal Code</label>
            <input v-model="form.postalCode" placeholder="Postal Code" class="input" />
          </div>
          <div class="form-group">
            <label>Country</label>
            <input v-model="form.country" placeholder="Country" class="input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" placeholder="Email" class="input" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" placeholder="Phone" class="input" />
          </div>
          <div class="form-group">
            <label>Tax ID</label>
            <input v-model="form.taxId" placeholder="Tax ID" class="input" />
          </div>
          <div class="form-group">
            <label>Registration Number</label>
            <input v-model="form.registrationNumber" placeholder="Registration Number" class="input" />
          </div>
          <div class="form-group">
            <label>Business Type</label>
            <input v-model="form.businessType" placeholder="Business Type" class="input" />
          </div>
          <div class="form-group">
            <label>Website</label>
            <input v-model="form.website" placeholder="https://example.com" class="input" :title="form.website" />
          </div>
          <div class="form-group">
            <label>Wallet Address</label>
            <input v-model="form.walletAddress" placeholder="Wallet Address" class="input" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="close">Cancel</button>
          <button class="btn-primary" @click="submit">{{ props.editing ? 'Update' : 'Create' }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 9999 !important;
  background-color: rgba(0,0,0,0.5) !important;
  overflow: hidden !important;
}

/* Modal card */
.modal {
  padding: 1.5rem;
  border-radius: 0.75rem;
  width: 95%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.25);
  transform-origin: center;
}

/* Modal grid */
.modal-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .modal-content {
    grid-template-columns: 1fr 1fr;
  }
}

/* Form group */
.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.input {
  border: 1px solid #ccc;
  padding: 0.45rem 0.5rem;
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
  ::placeholder { color: #9ca3af; }
}

/* Footer buttons */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-primary {
  background-color: #2563eb;
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}
.btn-primary:hover { background-color: #1e40af; transform: scale(1.03); }

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}
.btn-secondary:hover { background-color: #9ca3af; transform: scale(1.03); }

/* Truncate long text for mobile */
.input-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
