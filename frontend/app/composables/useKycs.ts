import { useActivityLogs } from '~/composables/useActivityLogs'
import { useWallet } from '~/composables/useWallets'
import { useApi } from './useApi'
import type { KYC, KYCLogs, UpdateKycArgs } from '~/types/Kyc'

// --- Parse raw KYC from backend ---
function parseKYC(n: any): KYC {
  return {
    tokenId: String(n.tokenId),
    owner: n.owner ?? '',
    fileHash: n.fileHash ?? '',
    metadataUrl: n.metadataUrl ?? '',
    documentUrl: n.documentUrl ?? null,
    name: n.name ?? `KYC-${n.tokenId}`,
    description: n.description ?? '',
    createdAt: n.createdAt ? Number(n.createdAt) : Date.now(),
    updatedAt: n.updatedAt ? Number(n.updatedAt) : Date.now(),
    status: n.status ?? 'Draft',
    history: Array.isArray(n.history)
      ? n.history.map((log: any) => ({
          action: log.action,
          txHash: log.txHash,
          account: log.account,
          timestamp: Number(log.timestamp),
          extra: log.extra ?? {},
        }))
      : [],
  }
}

// --- Composable ---
export function useKYC() {
  const { request } = useApi()
  const { account } = useWallet()
  const { addActivityLog } = useActivityLogs()

  // --- Get all KYCs ---
  const getAllKycs = async (): Promise<KYC[]> => {
    try {
      const data = await request<{ data: KYC[] }>('/kyc')
      return Array.isArray(data.data) ? data.data.map(parseKYC) : []
    } catch (err) {
      console.error('[getAllKycs] Error:', err)
      return []
    }
  }

  // --- Get KYC by tokenId ---
  const getKycById = async (tokenId: string): Promise<KYC | null> => {
    try {
      const data = await request<{ data: KYC }>(`/kyc/${tokenId}`)
      return data?.data ? parseKYC(data.data) : null
    } catch (err) {
      console.error(`[getKycById] Error ${tokenId}:`, err)
      return null
    }
  }

  // --- Get KYCs by owner ---
  const getKycsByOwner = async (owner: string): Promise<KYC[]> => {
    try {
      const data = await request<{ data: KYC[] }>(`/kyc/owner/${owner}`)
      return Array.isArray(data.data) ? data.data.map(parseKYC) : []
    } catch (err) {
      console.error(`[getKycsByOwner] Error ${owner}:`, err)
      return []
    }
  }

  // --- Get KYC Logs ---
  const getKycLogs = async (tokenId: string): Promise<KYCLogs | null> => {
    try {
      const data = await request<{ data: KYCLogs }>(`/kyc/${tokenId}/logs`)
      return data?.data ?? null
    } catch (err) {
      console.error(`[getKycLogs] Error ${tokenId}:`, err)
      return null
    }
  }

  // --- Create KYC ---
  const createKyc = async (payload: Partial<KYC> & { file?: File; action: string; executor: string }) => {
    const form = new FormData()
    if (payload.file) form.append('file', payload.file)
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== 'file' && value != null) form.append(key, String(value))
    })

    const data = await request<{ data: KYC }>('/kyc', {
      method: 'POST',
      body: form,
    })

    const kyc = parseKYC(data.data)

    await addActivityLog(kyc.owner || (account.value as string), {
      type: 'backend',
      action: `Create KYC ${kyc.tokenId}`,
      extra: { tokenId: kyc.tokenId, name: kyc.name, executor: payload.executor },
      tags: ['kyc', 'create'],
    })

    return kyc
  }

  // --- Update KYC ---
  const updateKyc = async ({
    tokenId,
    payload,
    action,
    txHash,
    executor,
    account,
    status,
  }: UpdateKycArgs) => {
    console.log('updateKyc', { tokenId, payload, action, txHash, executor, account, status })
    const data = await request<{ data: KYC }>(`/kyc/${tokenId}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, action, executor, account, txHash, status }),
    })
    const kyc = parseKYC(data.data)

    await addActivityLog(kyc.owner || account, {
      type: 'backend',
      action: `Update KYC ${kyc.tokenId}`,
      extra: { tokenId: kyc.tokenId, name: kyc.name, executor },
      tags: ['kyc', 'update'],
    })

    return kyc
  }

  // --- Delete KYC ---
  const deleteKyc = async (tokenId: string, executor: string) => {
    const kyc = await getKycById(tokenId)
    const owner = kyc?.owner || (account.value as string)

    const data = await request<{ success: boolean }>(`/kyc/${tokenId}`, {
      method: 'DELETE',
      body: JSON.stringify({ action: 'deleteKYC', executor }),
    })

    await addActivityLog(owner, {
      type: 'backend',
      action: `Delete KYC ${tokenId}`,
      extra: { tokenId, executor },
      tags: ['kyc', 'delete'],
    })

    return data?.success ?? true
  }

  return {
    getAllKycs,
    getKycById,
    getKycsByOwner,
    getKycLogs,
    createKyc,
    updateKyc,
    deleteKyc,
  }
}
