import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchChargerStatus } from '../api/charger'
import type { ChargerStatus } from '../types/charger'

export function useChargerStatus() {
  const [data, setData] = useState<ChargerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const next = await fetchChargerStatus()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => {
      void refresh()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const status = useMemo(() => data, [data])

  return { status, loading, error, refresh }
}
