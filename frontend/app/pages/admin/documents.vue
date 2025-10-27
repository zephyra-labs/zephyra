<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentDashboard } from '~/composables/useDocumentDashboard'

// Components
import ContractSelectorDocument from '~/components/document/ContractSelectorDocument.vue'
import DocumentTypeSelector from '~/components/document/DocumentTypeSelector.vue'
import FileUploadList from '~/components/document/FileUploadList.vue'
import AttachedDocumentsGrid from '~/components/document/AttachedDocumentsGrid.vue'
import DocumentViewer from '~/components/document/DocumentViewer.vue'
import MinterManagement from '~/components/MinterManagement.vue'

// Icons
import { FileUp } from 'lucide-vue-next'

// Route
const route = useRoute()
const contractAddress = route.params.contract as string

// --- Use Composable ---
const {
  currentContract,
  documents,
  selectedFiles,
  fileProgresses,
  docType,
  userRole,
  isAdmin,
  userIsMinter,
  approvedMintersDoc,
  loadingDocs,
  loadingMintersDoc,
  minting,
  minterAddress,
  addingMinter,
  removingMinter,
  deployedContracts,
  selectedDoc,
  selectedDocSrc,
  showViewer,
  canAttachAndMint,
  fetchDocuments,
  fetchApprovedMinters,
  handleAttachAndMint,
  handleAddMinter,
  handleRemoveMinter,
  handleReview,
  handleSign,
  handleRevoke,
  openViewer
} = useDocumentDashboard(contractAddress)

// --- Fetch on mount ---
onMounted(async () => {
  await fetchApprovedMinters()
  await fetchDocuments()
  console.log('Approved Minters:', approvedMintersDoc.value)
})

// --- Watch current contract and account ---
watch(currentContract, async (contract) => {
  if (!contract) return
  await fetchApprovedMinters()
  await fetchDocuments()
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6 bg-white rounded-xl shadow-lg dark:bg-gray-900">
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
      <FileUp class="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Attach & Mint Document
    </h2>

    <!-- Contract Selector -->
    <ContractSelectorDocument
      v-model="currentContract"
      :user-role="userRole"
      :user-is-minter="userIsMinter"
      :deployed-contracts="deployedContracts"
    />

    <!-- Document Type Selector -->
    <DocumentTypeSelector v-model="docType" />

    <!-- File Upload Section -->
    <div v-if="canAttachAndMint">
      <FileUploadList
        :files="selectedFiles"
        :file-progresses="fileProgresses"
        @remove="(index: number) => {
          selectedFiles.splice(index, 1)
          fileProgresses.splice(index, 1)
        }"
        @change="(e: Event) => {
          const files = (e.target as HTMLInputElement).files
          if (!files) return
          Array.from(files).forEach(f => {
            if (!selectedFiles.some(sf => sf.name === f.name && sf.size === f.size)) {
              selectedFiles.push(f)
              fileProgresses.push({ file: f, progress: 0, status: 'pending' })
            }
          })
          ;(e.target as HTMLInputElement).value = ''
        }"
      />

      <div v-if="selectedFiles.length" class="my-4 flex justify-center">
        <button 
          :disabled="!selectedFiles.length || minting || !canAttachAndMint" 
          class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50" 
          @click="handleAttachAndMint"
        >
          {{ minting ? 'Minting...' : 'Attach & Mint Documents' }}
        </button>
      </div>
    </div>

    <!-- Attached Documents Grid -->
    <AttachedDocumentsGrid
      :documents="documents"
      :loading="loadingDocs"
      :user-role="userRole"
      @view="openViewer"
      @review="handleReview"
      @sign="handleSign"
      @revoke="handleRevoke"
    />

    <!-- Document Viewer -->
    <DocumentViewer
      v-if="selectedDocSrc"
      v-model="showViewer"
      :src="selectedDocSrc"
      :name="selectedDoc?.name"
      :token-id="selectedDoc?.tokenId"
      :hash="selectedDoc?.fileHash"
      :status="selectedDoc?.status"
    />

    <!-- Minter Management -->
    <MinterManagement
      v-model:minter-address="minterAddress"
      :adding-minter="addingMinter"
      :removing-minter="removingMinter"
      :approved-minters-k-y-c="approvedMintersDoc"
      :loading-minters-k-y-c="loadingMintersDoc"
      :is-admin="isAdmin"
      @add-minter="async () => { await handleAddMinter(); await fetchApprovedMinters(); }"
      @remove-minter="async () => { await handleRemoveMinter(); await fetchApprovedMinters(); }"
    />
  </div>
</template>
