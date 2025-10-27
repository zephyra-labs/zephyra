export interface ActivityItem {
    id: string
    timestamp: number
    type: string
    action: string
    account: string
    txHash?: string
    contractAddress?: string
    tags: string[]
    extra?: Record<string, any>
    onChainInfo?: Record<string, any>
}

export interface AggregatedFilters {
    account?: string | null
    txHash?: string | null
    contractAddress?: string | null
    tags?: string[]
    limit?: number
}

export interface FetchActivitiesResult {
    data: ActivityItem[]
    nextStartAfterTimestamp: number | null
}