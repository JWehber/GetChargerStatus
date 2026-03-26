import type { ReactNode } from 'react'
import { BatteryCharging, CircleAlert, CircleCheckBig, MapPin, RefreshCw, Zap } from 'lucide-react'
import { useChargerStatus } from './hooks/useChargerStatus'
import type { ChargerHistoryEntry, ChargerState } from './types/charger'
import './index.css'

const station = {
  name: 'EWE Go Ladepunkt',
  operator: 'EWE Go',
}

const stateConfig: Record<ChargerState, { className: string; icon: ReactNode }> = {
  unknown: { className: 'status-card status-unknown', icon: <CircleAlert size={28} /> },
  available: { className: 'status-card status-available', icon: <CircleCheckBig size={28} /> },
  occupied: { className: 'status-card status-occupied', icon: <Zap size={28} /> },
  reserved: { className: 'status-card status-reserved', icon: <BatteryCharging size={28} /> },
  offline: { className: 'status-card status-offline', icon: <CircleAlert size={28} /> },
}

function formatLastUpdated(value?: string) {
  if (!value) return '–'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const berlinTime = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin',
  }).format(date)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.round(diffMs / 60000))
  let relative = 'gerade eben'
  if (diffMin >= 1 && diffMin < 60) relative = `vor ${diffMin} Min.`
  else if (diffMin >= 60) {
    const hours = Math.floor(diffMin / 60)
    const mins = diffMin % 60
    relative = mins === 0 ? `vor ${hours} Std.` : `vor ${hours} Std. ${mins} Min.`
  }
  return `${berlinTime} (${relative})`
}

function formatDateTime(value?: string | null) {
  if (!value) return 'läuft noch'
  const date = new Date(value)
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin',
  }).format(date)
}

function minutesBetween(start: string, end?: string | null) {
  const startDate = new Date(start).getTime()
  const endDate = end ? new Date(end).getTime() : Date.now()
  return Math.max(0, Math.round((endDate - startDate) / 60000))
}

function computeTodayStats(history: ChargerHistoryEntry[]) {
  const today = new Date()
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  let availableMinutes = 0
  let occupiedMinutes = 0

  for (const entry of history) {
    const start = new Date(entry.startedAt).getTime()
    const end = entry.endedAt ? new Date(entry.endedAt).getTime() : Date.now()
    const overlapStart = Math.max(start, dayStart)
    const overlapEnd = Math.max(overlapStart, end)
    const minutes = Math.round((overlapEnd - overlapStart) / 60000)

    if (entry.state === 'available') availableMinutes += minutes
    if (entry.state === 'occupied') occupiedMinutes += minutes
  }

  return { availableMinutes, occupiedMinutes }
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} Min.`
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`
}

function App() {
  const { status, history, loading, refreshing, error, refresh } = useChargerStatus()
  const effectiveState = status?.state ?? 'unknown'
  const cfg = stateConfig[effectiveState]
  const latestChange = history[history.length - 1] ?? null
  const todayStats = computeTodayStats(history)
  const recentTransitions = history.slice(-5).reverse()

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">EV Charger Monitor ⚡</p>
          <h1>Dein Ladepunkt auf einen Blick</h1>
          <p className="hero-text">
            Modernes GitHub-Pages-Frontend für den schnellen Status-Check einer EWE-Go-Ladesäule — mobil,
            klar und sicher über einen TomTom-Snapshot via GitHub Actions.
          </p>
        </div>
        <div className="refresh-control">
          <button
            className={`refresh-button${refreshing ? ' is-refreshing' : ''}`}
            type="button"
            onClick={() => void refresh(false)}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Aktualisiere …' : 'Status aktualisieren'}
          </button>
        </div>
      </section>

      <section className={cfg.className}>
        <div className="status-icon">{cfg.icon}</div>
        <div>
          <p className="status-label">Aktueller Status</p>
          <h2>{loading && !status ? 'Lädt …' : status?.label ?? 'Unbekannt'}</h2>
          <p className="status-description">{error ? `Fehler: ${error}` : status?.description ?? 'Statusdaten werden geladen.'}</p>
        </div>
      </section>

      <section className="grid-layout">
        <article className="info-card">
          <h3>Standort</h3>
          <div className="info-row">
            <MapPin size={18} />
            <div><strong>{station.name}</strong></div>
          </div>
        </article>

        <article className="info-card">
          <h3>Station Details</h3>
          <ul className="meta-list">
            <li><span>Betreiber</span><strong>{station.operator}</strong></li>
            <li><span>Letzte Aktualisierung</span><strong>{formatLastUpdated(status?.lastUpdated)}</strong></li>
            <li><span>Statusquelle</span><strong>TomTom Snapshot via GitHub Actions (ca. alle 5 Min.)</strong></li>
            <li><span>Steckertyp</span><strong>{status?.connectorType ?? '–'}</strong></li>
            <li><span>Leistung</span><strong>{status?.powerKW ? `${status.powerKW} kW` : '–'}</strong></li>
          </ul>
        </article>
      </section>

      <section className="grid-layout compact-grid">
        <article className="info-card">
          <h3>Verfügbarkeit</h3>
          <ul className="meta-list">
            <li><span>Frei</span><strong>{status?.summary.available ?? '–'}</strong></li>
            <li><span>Belegt</span><strong>{status?.summary.occupied ?? '–'}</strong></li>
            <li><span>Reserviert</span><strong>{status?.summary.reserved ?? '–'}</strong></li>
            <li><span>Unbekannt</span><strong>{status?.summary.unknown ?? '–'}</strong></li>
            <li><span>Außer Betrieb</span><strong>{status?.summary.outOfService ?? '–'}</strong></li>
          </ul>
        </article>

        <article className="info-card">
          <h3>Statistik heute</h3>
          <ul className="meta-list">
            <li><span>Frei</span><strong>{formatMinutes(todayStats.availableMinutes)}</strong></li>
            <li><span>Belegt</span><strong>{formatMinutes(todayStats.occupiedMinutes)}</strong></li>
            <li><span>Letzter Wechsel</span><strong>{latestChange ? formatDateTime(latestChange.startedAt) : '–'}</strong></li>
            <li><span>Aktueller Zustand seit</span><strong>{latestChange ? formatDateTime(latestChange.startedAt) : '–'}</strong></li>
          </ul>
        </article>
      </section>

      <section className="grid-layout compact-grid">
        <article className="info-card full-width-card">
          <h3>Letzte Zustandswechsel</h3>
          <ul className="transition-list">
            {recentTransitions.length === 0 ? (
              <li className="transition-item"><span>Noch keine Historie vorhanden.</span></li>
            ) : (
              recentTransitions.map((entry, index) => (
                <li key={`${entry.startedAt}-${index}`} className="transition-item">
                  <strong>{entry.state}</strong>
                  <span>{formatDateTime(entry.startedAt)} → {formatDateTime(entry.endedAt)}</span>
                  <span>{formatMinutes(minutesBetween(entry.startedAt, entry.endedAt))}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
