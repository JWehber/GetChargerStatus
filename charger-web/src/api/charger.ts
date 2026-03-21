import type { ChargerStatus } from '../types/charger'

export async function fetchChargerStatus(): Promise<ChargerStatus> {
  const response = await fetch(`${import.meta.env.BASE_URL}status.json`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Statusdatei konnte nicht geladen werden: ${response.status}`)
  }

  return (await response.json()) as ChargerStatus
}
