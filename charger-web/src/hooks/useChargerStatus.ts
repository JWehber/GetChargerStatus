import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchChargerStatus } from '../api/charger'
import type { ChargerStatus } from '../types/charger'

export function useChargerStatus() {
  const [data, setData] = useState<ChargerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (initial = false) => {
    try {
      setError(null)
      if (initial) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const next = await fetchChargerStatus()
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh(true)
    const id = window.setInterval(() => {
      void refresh(false)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const status = useMemo(() => data, [data])

  return { status, loading, refreshing, error, refresh }
}
