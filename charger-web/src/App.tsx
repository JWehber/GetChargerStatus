import type { ReactNode } from 'react'
import { BatteryCharging, CircleAlert, CircleCheckBig, MapPin, RefreshCw, Zap } from 'lucide-react'
import { useChargerStatus } from './hooks/useChargerStatus'
import type { ChargerState } from './types/charger'
import './index.css'

const station = {
  name: 'EWE Go Ladepunkt',
  address: 'Standort bewusst ausgeblendet',
  operator: 'EWE Go',
}

const stateConfig: Record<ChargerState, { className: string; icon: ReactNode }> = {
  unknown: {
    className: 'status-card status-unknown',
    icon: <CircleAlert size={28} />,
  },
  available: {
    className: 'status-card status-available',
    icon: <CircleCheckBig size={28} />,
  },
  occupied: {
    className: 'status-card status-occupied',
    icon: <Zap size={28} />,
  },
  reserved: {
    className: 'status-card status-reserved',
    icon: <BatteryCharging size={28} />,
  },
  offline: {
    className: 'status-card status-offline',
    icon: <CircleAlert size={28} />,
  },
}

function formatLastUpdated(value?: string) {
  if (!value) return '–'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const berlinTime = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(date)

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.round(diffMs / 60000))

  let relative = 'gerade eben'
  if (diffMin >= 1 && diffMin < 60) {
    relative = `vor ${diffMin} Min.`
  } else if (diffMin >= 60) {
    const hours = Math.floor(diffMin / 60)
    const mins = diffMin % 60
    relative = mins === 0 ? `vor ${hours} Std.` : `vor ${hours} Std. ${mins} Min.`
  }

  return `${berlinTime} (${relative})`
}

function App() {
  const { status, loading, refreshing, error, refresh } = useChargerStatus()
  const effectiveState = status?.state ?? 'unknown'
  const cfg = stateConfig[effectiveState]

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
          <p className="refresh-hint">{refreshing ? 'TomTom-Snapshot wird neu geladen …' : 'Manuell neu laden möglich'}</p>
        </div>
      </section>

      <section className={cfg.className}>
        <div className="status-icon">{cfg.icon}</div>
        <div>
          <p className="status-label">Aktueller Status</p>
          <h2>{loading && !status ? 'Lädt …' : status?.label ?? 'Unbekannt'}</h2>
          <p className="status-description">
            {error ? `Fehler: ${error}` : status?.description ?? 'Statusdaten werden geladen.'}
          </p>
        </div>
      </section>

      <section className="grid-layout">
        <article className="info-card">
          <h3>Standort</h3>
          <div className="info-row">
            <MapPin size={18} />
            <div>
              <strong>{station.name}</strong>
            </div>
          </div>
        </article>

        <article className="info-card">
          <h3>Station Details</h3>
          <ul className="meta-list">
            <li>
              <span>Betreiber</span>
              <strong>{station.operator}</strong>
            </li>
            <li>
              <span>Letzte Aktualisierung</span>
              <strong>{formatLastUpdated(status?.lastUpdated)}</strong>
            </li>
            <li>
              <span>Statusquelle</span>
              <strong>TomTom Snapshot via GitHub Actions (ca. alle 5 Min.)</strong>
            </li>
            <li>
              <span>Steckertyp</span>
              <strong>{status?.connectorType ?? '–'}</strong>
            </li>
            <li>
              <span>Leistung</span>
              <strong>{status?.powerKW ? `${status.powerKW} kW` : '–'}</strong>
            </li>
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
      </section>
    </main>
  )
}

export default App
