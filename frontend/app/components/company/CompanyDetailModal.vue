<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
  company: any
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
}>()

const showModal = ref(false)

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
        <h2 class="text-xl sm:text-2xl font-bold mb-4">Company Details</h2>

        <div class="modal-content grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          <div><strong>Name:</strong> <span class="break-words">{{ company?.name || '-' }}</span></div>
          <div><strong>Address:</strong> <span class="break-words">{{ company?.address || '-' }}</span></div>
          <div><strong>City:</strong> {{ company?.city || '-' }}</div>
          <div><strong>State / Province:</strong> {{ company?.stateOrProvince || '-' }}</div>
          <div><strong>Postal Code:</strong> {{ company?.postalCode || '-' }}</div>
          <div><strong>Country:</strong> {{ company?.country || '-' }}</div>
          <div><strong>Email:</strong> <span class="truncate block max-w-full">{{ company?.email || '-' }}</span></div>
          <div><strong>Phone:</strong> {{ company?.phone || '-' }}</div>
          <div><strong>Tax ID:</strong> {{ company?.taxId || '-' }}</div>
          <div><strong>Registration Number:</strong> {{ company?.registrationNumber || '-' }}</div>
          <div><strong>Business Type:</strong> {{ company?.businessType || '-' }}</div>
          <div>
            <strong>Website:</strong>
            <span v-if="company?.website">
              <a
                :href="company.website"
                target="_blank"
                class="text-blue-600 dark:text-blue-400 hover:underline break-all max-w-full inline-block truncate"
              >
                {{ company.website }}
              </a>
            </span>
            <span v-else>-</span>
          </div>
          <div><strong>Wallet Address:</strong> <span class="truncate block max-w-full">{{ company?.walletAddress || '-' }}</span></div>
        </div>

        <div class="modal-footer">
          <button class="btn-primary" @click="close">Close</button>
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

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Button */
.btn-primary {
  background-color: #2563eb;
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #1e40af;
}
</style>
