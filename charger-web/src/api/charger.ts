import type { ChargerHistorySnapshot } from '../types/charger'

export async function fetchChargerSnapshot(): Promise<ChargerHistorySnapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}history.json`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Historien-Datei konnte nicht geladen werden: ${response.status}`)
  }

  return (await response.json()) as ChargerHistorySnapshot
}
