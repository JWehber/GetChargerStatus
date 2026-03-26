import fs from 'node:fs/promises'
import path from 'node:path'

const apiKey = process.env.TOMTOM_API_KEY
const chargingAvailabilityId = 'd3e3113d-9cf4-4732-8d15-7ccb21cbaea1'

if (!apiKey) throw new Error('TOMTOM_API_KEY fehlt')

const url = `https://api.tomtom.com/search/2/chargingAvailability.json?key=${apiKey}&chargingAvailability=${chargingAvailabilityId}`
const response = await fetch(url)
if (!response.ok) throw new Error(`TomTom API Fehler: ${response.status}`)

const data = await response.json()
const connector = data.connectors?.[0]
const current = connector?.availability?.current ?? {
  available: 0,
  occupied: 0,
  reserved: 0,
  unknown: 1,
  outOfService: 0,
}

const state = current.available > 0
  ? 'available'
  : current.occupied > 0
    ? 'occupied'
    : current.reserved > 0
      ? 'reserved'
      : current.outOfService > 0
        ? 'offline'
        : 'unknown'

const labels = {
  available: ['Frei', 'Mindestens ein Ladepunkt ist verfügbar.'],
  occupied: ['Belegt', 'Aktuell ist kein Ladepunkt frei.'],
  reserved: ['Reserviert', 'Ladepunkte sind aktuell reserviert.'],
  offline: ['Offline', 'Die Säule ist aktuell außer Betrieb oder nicht erreichbar.'],
  unknown: ['Unbekannt', 'Der Status konnte gerade nicht eindeutig bestimmt werden.'],
}

const now = new Date().toISOString()
const output = {
  state,
  label: labels[state][0],
  description: labels[state][1],
  connectorType: connector?.type ?? null,
  powerKW: connector?.availability?.perPowerLevel?.[0]?.powerKW ?? null,
  lastUpdated: now,
  summary: current,
}

const publicDir = path.resolve('public')
const statusTarget = path.join(publicDir, 'status.json')
const historyTarget = path.join(publicDir, 'history.json')
await fs.mkdir(publicDir, { recursive: true })
await fs.writeFile(statusTarget, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

let history = []
try {
  const prev = JSON.parse(await fs.readFile(historyTarget, 'utf8'))
  history = Array.isArray(prev.history) ? prev.history : []
} catch {
  history = []
}

const last = history[history.length - 1]
if (!last) {
  history.push({ state, startedAt: now, endedAt: null })
} else if (last.state !== state) {
  last.endedAt = now
  history.push({ state, startedAt: now, endedAt: null })
}

const historyOutput = {
  current: output,
  history: history.slice(-500),
}

await fs.writeFile(historyTarget, `${JSON.stringify(historyOutput, null, 2)}\n`, 'utf8')
console.log(`status/history updated: ${output.label}`)
