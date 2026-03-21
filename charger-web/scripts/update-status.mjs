import fs from 'node:fs/promises'
import path from 'node:path'

const apiKey = process.env.TOMTOM_API_KEY
const chargingAvailabilityId = 'd3e3113d-9cf4-4732-8d15-7ccb21cbaea1'

if (!apiKey) {
  throw new Error('TOMTOM_API_KEY fehlt')
}

const url = `https://api.tomtom.com/search/2/chargingAvailability.json?key=${apiKey}&chargingAvailability=${chargingAvailabilityId}`
const response = await fetch(url)

if (!response.ok) {
  throw new Error(`TomTom API Fehler: ${response.status}`)
}

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

const output = {
  state,
  label: labels[state][0],
  description: labels[state][1],
  connectorType: connector?.type ?? null,
  powerKW: connector?.availability?.perPowerLevel?.[0]?.powerKW ?? null,
  lastUpdated: new Date().toISOString(),
  summary: current,
}

const target = path.resolve('public/status.json')
await fs.mkdir(path.dirname(target), { recursive: true })
await fs.writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`status.json updated: ${output.label}`)
