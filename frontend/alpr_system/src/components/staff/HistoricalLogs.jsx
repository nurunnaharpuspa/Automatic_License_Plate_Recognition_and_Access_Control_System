import { useEffect, useState } from 'react'
import { getGroupedLogs } from '../../api/endpoints'
import StatusBadge from '../common/StatusBadge'

function duration(entry, exit) {
  if (!entry || !exit) return '—'
  const ms = new Date(exit) - new Date(entry)
  if (ms < 0) return '—'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function VehicleEventTable({ events }) {
  // pair up entries and exits in order
  const entries = events.filter((e) => e.event_type === 'ENTRY')
  const exits   = events.filter((e) => e.event_type === 'EXIT')
  const rows    = Math.max(entries.length, exits.length)

  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="border-b border-border">
          {['Entry time', 'Exit time', 'Duration', 'Confidence', 'Status', 'Camera'].map((h) => (
            <th key={h} className="text-left text-xs font-mono text-muted uppercase tracking-wider px-3 py-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => {
          const entry = entries[i]
          const exit  = exits[i]
          const ref   = entry || exit
          return (
            <tr key={i} className="border-b border-border/40 hover:bg-surface/50">
              <td className="px-3 py-2.5 font-mono text-xs text-teal">
                {entry ? new Date(entry.timestamp).toLocaleTimeString() : '—'}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-amber">
                {exit ? new Date(exit.timestamp).toLocaleTimeString() : '—'}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-secondary">
                {duration(entry?.timestamp, exit?.timestamp)}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-secondary">
                {ref ? `${(ref.confidence_score * 100).toFixed(1)}%` : '—'}
              </td>
              <td className="px-3 py-2.5">
                {ref ? <StatusBadge status={ref.status} /> : '—'}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted">
                {ref?.camera_id || '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function VehicleGroup({ vehicle }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      {/* vehicle header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-card transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <span className="plate-tag">{vehicle.plate_number}</span>
          {vehicle.is_guest ? (
            <span className="text-xs font-mono text-amber bg-amber/10 border border-amber/30 rounded px-2 py-0.5">
              guest
            </span>
          ) : (
            <span className="text-secondary text-sm">
              {vehicle.owner_name ?? '—'}
              {vehicle.owner_user_id && (
                <span className="text-muted font-mono text-xs ml-2">
                  ({vehicle.owner_user_id})
                </span>
              )}
            </span>
          )}
          <span className="text-muted text-xs font-mono">
            {vehicle.events.length} event{vehicle.events.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="bg-card px-2 pb-2">
          <VehicleEventTable events={vehicle.events} />
        </div>
      )}
    </div>
  )
}

function DateGroup({ group }) {
  const [open, setOpen] = useState(true)
  const totalEvents = group.vehicles.reduce((s, v) => s + v.events.length, 0)

  const formatted = new Date(group.date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-4 mb-3 text-left group"
      >
        <span className="font-display font-bold text-primary text-base">{formatted}</span>
        <span className="text-xs font-mono text-muted bg-surface border border-border rounded px-2 py-0.5">
          {group.vehicles.length} vehicle{group.vehicles.length !== 1 ? 's' : ''} · {totalEvents} events
        </span>
        <span className="flex-1 h-px bg-border" />
        <span className="text-muted text-xs group-hover:text-secondary transition-colors">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="animate-slide-up">
          {group.vehicles.map((v) => (
            <VehicleGroup key={v.plate_number} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistoricalLogs() {
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ plate: '', date: '' })

  const fetchLogs = () => {
    setLoading(true)
    const params = {}
    if (filters.plate) params.plate = filters.plate
    if (filters.date)  params.date  = filters.date
    getGroupedLogs(params)
      .then((r) => setGroups(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-5">
      <h3 className="font-display font-bold text-primary text-lg">Parking history</h3>

      {/* filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
            Plate
          </label>
          <input
            className="input-field w-44 font-mono"
            placeholder="Filter by plate..."
            value={filters.plate}
            onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
            Date
          </label>
          <input
            type="date"
            className="input-field w-44"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
        <button onClick={fetchLogs} className="btn-ghost">
          Apply
        </button>
        <button
          onClick={() => { setFilters({ plate: '', date: '' }); setTimeout(fetchLogs, 0) }}
          className="btn-ghost"
        >
          Clear
        </button>
      </div>

      {loading && (
        <p className="text-muted text-sm font-mono animate-pulse">Loading...</p>
      )}

      {!loading && groups.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-muted text-sm font-mono">No records found.</p>
        </div>
      )}

      {groups.map((g) => (
        <DateGroup key={g.date} group={g} />
      ))}
    </div>
  )
}