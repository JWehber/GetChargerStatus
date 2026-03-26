import type { ChargerHistoryEntry } from '../types/charger'

interface Props {
  history: ChargerHistoryEntry[]
}

interface ChartPoint {
  x: number
  y: number
  label: string
}

const WIDTH = 760
const HEIGHT = 240
const PADDING = { top: 20, right: 24, bottom: 36, left: 64 }
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom

function stateValue(state: string) {
  return state === 'occupied' ? 1 : 0
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  }).format(date)
}

function buildPoints(history: ChargerHistoryEntry[]): ChartPoint[] {
  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setHours(23, 59, 59, 999)

  const points: ChartPoint[] = []

  for (const entry of history) {
    if (entry.state !== 'available' && entry.state !== 'occupied') continue

    const start = new Date(entry.startedAt)
    const end = entry.endedAt ? new Date(entry.endedAt) : now

    if (end < dayStart || start > dayEnd) continue

    const effectiveStart = start < dayStart ? dayStart : start
    const effectiveEnd = end > dayEnd ? dayEnd : end
    const startMinutes = (effectiveStart.getTime() - dayStart.getTime()) / 60000
    const endMinutes = (effectiveEnd.getTime() - dayStart.getTime()) / 60000
    const y = stateValue(entry.state)

    points.push({ x: startMinutes, y, label: formatTime(effectiveStart) })
    points.push({ x: endMinutes, y, label: formatTime(effectiveEnd) })
  }

  if (points.length === 0) {
    points.push({ x: 0, y: 0, label: '00:00' })
    points.push({ x: 1440, y: 0, label: '24:00' })
  }

  return points.sort((a, b) => a.x - b.x)
}

function toSvgX(minutes: number) {
  return PADDING.left + (minutes / 1440) * INNER_WIDTH
}

function toSvgY(state: number) {
  return PADDING.top + (1 - state) * INNER_HEIGHT
}

function buildPath(points: ChartPoint[]) {
  if (points.length === 0) return ''

  let path = `M ${toSvgX(points[0].x)} ${toSvgY(points[0].y)}`
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]
    const point = points[i]
    path += ` H ${toSvgX(point.x)}`
    if (point.y !== prev.y) {
      path += ` V ${toSvgY(point.y)}`
    }
  }
  return path
}

export function StatusTimelineChart({ history }: Props) {
  const points = buildPoints(history)
  const path = buildPath(points)
  const xTicks = [0, 360, 720, 1080, 1440]

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="status-chart" role="img" aria-label="Zeitverlauf Frei und Belegt">
        <line x1={PADDING.left} y1={toSvgY(1)} x2={WIDTH - PADDING.right} y2={toSvgY(1)} className="chart-grid" />
        <line x1={PADDING.left} y1={toSvgY(0)} x2={WIDTH - PADDING.right} y2={toSvgY(0)} className="chart-grid" />
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={HEIGHT - PADDING.bottom} className="chart-axis" />
        <line x1={PADDING.left} y1={HEIGHT - PADDING.bottom} x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom} className="chart-axis" />

        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={toSvgX(tick)} y1={HEIGHT - PADDING.bottom} x2={toSvgX(tick)} y2={HEIGHT - PADDING.bottom + 6} className="chart-axis" />
            <text x={toSvgX(tick)} y={HEIGHT - 10} textAnchor="middle" className="chart-label">
              {tick === 1440 ? '24:00' : `${String(Math.floor(tick / 60)).padStart(2, '0')}:00`}
            </text>
          </g>
        ))}

        <text x={18} y={toSvgY(1) + 4} className="chart-label">Belegt</text>
        <text x={32} y={toSvgY(0) + 4} className="chart-label">Frei</text>

        <path d={path} className="chart-line" />
      </svg>
    </div>
  )
}
