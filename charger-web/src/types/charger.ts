export type ChargerState = 'available' | 'occupied' | 'reserved' | 'offline' | 'unknown'

export interface ChargerAvailabilitySummary {
  available: number
  occupied: number
  reserved: number
  unknown: number
  outOfService: number
}

export interface ChargerStatus {
  state: ChargerState
  label: string
  description: string
  connectorType: string | null
  powerKW: number | null
  lastUpdated: string
  summary: ChargerAvailabilitySummary
}

export interface ChargerHistoryEntry {
  state: ChargerState
  startedAt: string
  endedAt: string | null
}

export interface ChargerHistorySnapshot {
  current: ChargerStatus
  history: ChargerHistoryEntry[]
}
