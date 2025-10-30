import type { TradeRecord, TradeParticipant, TradeStatus } from '../types/Trade.js'

export default class TradeDTO {
  id!: string
  contractAddress?: string
  participants: TradeParticipant[] = []
  status!: TradeStatus
  currentStage?: number
  createdAt!: number
  updatedAt?: number

  constructor(data: Partial<TradeRecord> & { id?: string }) {
    Object.assign(this, data)
    if (!this.createdAt) this.createdAt = Date.now()
    if (!this.id) this.id = data.id ?? crypto.randomUUID()
  }

  validate() {
    if (!this.id) throw new Error('TradeRecord id is required')
    if (!this.participants || !Array.isArray(this.participants) || this.participants.length === 0) {
      throw new Error('At least one participant is required')
    }
    if (!this.status) throw new Error('Trade status is required')
  }

  /** Transform DTO menjadi TradeRecord siap simpan */
  toTradeRecord(): TradeRecord {
    return {
      id: this.id,
      contractAddress: this.contractAddress,
      participants: this.participants.map(p => ({
        address: p.address,
        kycVerified: p.kycVerified ?? false,
        walletConnected: p.walletConnected ?? false,
        role: p.role,
      })),
      status: this.status,
      currentStage: this.currentStage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  /** Update timestamp ketika record diubah */
  touch() {
    this.updatedAt = Date.now()
  }
}
