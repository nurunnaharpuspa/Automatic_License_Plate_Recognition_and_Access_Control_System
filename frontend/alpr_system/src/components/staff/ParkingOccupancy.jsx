import { useEffect, useState, useCallback } from 'react'
import { getCurrentlyParked, reviewUnregistered, getAllVehicles } from '../../api/endpoints'
import { useWS } from '../../context/WebSocketContext'


function VehicleSlot({ vehicle, onAction }) {
  const [open, setOpen] = useState(false)
  const [linkPlate, setLinkPlate] = useState('')
  const [loading, setLoading] = useState(false)

  const elapsed = () => {
    const ms = Date.now() - new Date(vehicle.entry_time)
    const h  = Math.floor(ms / 3600000)
    const m  = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const handle = async (action, extra = {}) => {
    setLoading(true)
    try {
      await onAction(vehicle.log_id, { action, ...extra })
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const isGuest        = vehicle.is_guest
  const isUnregistered = !vehicle.owner_name && !vehicle.is_guest

  return (
    <div className={`rounded-lg border transition-colors ${
      isGuest        ? 'border-amber/40 bg-amber/5' :
      isUnregistered ? 'border-red/40   bg-red/5'   :
                       'border-border   bg-card'
    }`}>
      {/* main row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* status dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-slow flex-shrink-0" />

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="plate-tag">{vehicle.plate_number}</span>
              {isGuest && (
                <span className="text-xs font-mono text-amber bg-amber/10 border border-amber/30 rounded px-1.5 py-0.5">
                  guest
                </span>
              )}
              {isUnregistered && (
                <span className="text-xs font-mono text-red bg-red/10 border border-red/30 rounded px-1.5 py-0.5">
                  unregistered
                </span>
              )}
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              {vehicle.owner_name
                ? `${vehicle.owner_name} · ${vehicle.owner_user_id}`
                : 'No registered owner'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-mono text-secondary">{elapsed()}</p>
            <p className="text-xs font-mono text-muted">
              {new Date(vehicle.entry_time).toLocaleTimeString()}
            </p>
          </div>

          {(isGuest || isUnregistered) && (
            <button
              onClick={() => setOpen((p) => !p)}
              className="btn-ghost text-xs px-2 py-1"
            >
              {open ? 'Close' : 'Review'}
            </button>
          )}
        </div>
      </div>

      {/* review panel */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3 animate-slide-up">
          {isUnregistered && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
                  Link to registered plate
                </label>
                <input
                  className="input-field font-mono tracking-widest uppercase text-sm"
                  placeholder="ABC-1234"
                  value={linkPlate}
                  onChange={(e) => setLinkPlate(e.target.value.toUpperCase())}
                />
              </div>
              <button
                onClick={() => handle('link', { plate_number: linkPlate })}
                disabled={loading || !linkPlate}
                className="btn-primary text-xs py-2.5 px-3"
              >
                Link
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handle('approve_guest')}
              disabled={loading}
              className="btn-ghost text-xs flex-1"
            >
              Approve as guest
            </button>
            <button
              onClick={() => handle('dismiss')}
              disabled={loading}
              className="btn-danger text-xs flex-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ParkingOccupancy() {
  const { lastEvent }   = useWS()
  const [data, setData] = useState({ count: 0, vehicles: [] })
  const [loading, setLoading] = useState(false)
  const [totalRegistered, setTotalRegistered] = useState(0) // New state

  const fetchOccupancy = useCallback(() => {
    setLoading(true)
    // getCurrentlyParked()
    //   .then((r) => setData(r.data))
    //   .finally(() => setLoading(false))
    Promise.all([
      getCurrentlyParked(),
      getAllVehicles({ limit: 1 }) // Most Django APIs return a 'count' field even with 1 result
    ]).then(([occupancyRes, totalRes]) => {
      setData(occupancyRes.data)
      setTotalRegistered(totalRes.data.count || totalRes.data.length)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOccupancy() }, [fetchOccupancy])

  // refresh whenever a new parking event comes in
  useEffect(() => {
    if (lastEvent) fetchOccupancy()
  }, [lastEvent])

  const handleAction = async (logId, body) => {
    await reviewUnregistered(logId, body)
    fetchOccupancy()
  }

  const guests        = data.vehicles.filter((v) => v.is_guest)
  const unregistered  = data.vehicles.filter((v) => !v.owner_name && !v.is_guest)
  const registered    = data.vehicles.filter((v) => v.owner_name)

  return (
    <div className="space-y-5">
      {/* header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total parked',    value: data.count,            color: 'text-primary'  },
          // { label: 'Registered',      value: registered.length,     color: 'text-green'    },
          { label: 'Registered',   value: totalRegistered,       color: 'text-blue-400' }, // New Stat
          { label: 'Needs review',    value: guests.length + unregistered.length, color: 'text-amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-4 text-center">
            <p className={` text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-muted text-xs font-mono mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* vehicle list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs text-muted uppercase tracking-wider">
            Currently inside
          </h4>
          <button
            onClick={fetchOccupancy}
            disabled={loading}
            className="text-xs font-mono text-muted hover:text-amber transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {data.vehicles.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-muted text-sm font-mono">Parking area is empty.</p>
          </div>
        ) : (
          <>
            {/* unregistered first — needs attention */}
            {unregistered.map((v) => (
              <VehicleSlot key={v.log_id} vehicle={v} onAction={handleAction} />
            ))}
            {/* then guests */}
            {guests.map((v) => (
              <VehicleSlot key={v.log_id} vehicle={v} onAction={handleAction} />
            ))}
            {/* then registered */}
            {registered.map((v) => (
              <VehicleSlot key={v.log_id} vehicle={v} onAction={handleAction} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}