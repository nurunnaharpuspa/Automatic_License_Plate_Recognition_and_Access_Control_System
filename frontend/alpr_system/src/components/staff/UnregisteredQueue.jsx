import { useEffect, useState } from 'react'
import { getAllLogs, reviewUnregistered } from '../../api/endpoints'
import { useWS } from '../../context/WebSocketContext'

export default function UnregisteredQueue() {
  const { lastEvent }    = useWS()
  const [items, setItems] = useState([])
  const [forms, setForms] = useState({})   // logId → { action, plate_number }
  const [loading, setLoading] = useState({})
  const [errors, setErrors]   = useState({})

  const fetchQueue = () => {
    // fetch both UNREGISTERED and GUEST status logs
    Promise.all([
      getAllLogs({ status: 'UNREGISTERED' }),
      getAllLogs({ status: 'GUEST' }),
    ]).then(([unreg, guest]) => {
      const combined = [...unreg.data, ...guest.data]
      // sort by timestamp desc, deduplicate by id
      const unique = combined.filter(
        (v, i, a) => a.findIndex((x) => x.id === v.id) === i
      )
      unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setItems(unique)
    })
  }

  useEffect(() => { fetchQueue() }, [])

  // refresh when a new event comes in that might be unregistered
  useEffect(() => {
    if (lastEvent && ['UNREGISTERED', 'GUEST'].includes(lastEvent.status)) {
      fetchQueue()
    }
  }, [lastEvent])

  const setForm = (id, patch) =>
    setForms((p) => ({ ...p, [id]: { ...p[id], ...patch } }))

  const handle = async (logId, action) => {
    const plate = forms[logId]?.plate_number?.trim().toUpperCase()

    if (action === 'link' && !plate) {
      setErrors((p) => ({ ...p, [logId]: 'Enter the registered plate to link.' }))
      return
    }

    setLoading((p) => ({ ...p, [logId]: true }))
    setErrors((p)  => ({ ...p, [logId]: null }))

    try {
      await reviewUnregistered(logId, {
        action,
        ...(action === 'link' ? { plate_number: plate } : {}),
      })
      setItems((p) => p.filter((x) => x.id !== logId))
    } catch (err) {
      const data = err.response?.data
      setErrors((p) => ({
        ...p,
        [logId]: data?.error || data?.plate_number?.[0] || 'Action failed.',
      }))
    } finally {
      setLoading((p) => ({ ...p, [logId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-primary text-lg">
            Guest &amp; unregistered review
          </h3>
          <p className="text-secondary text-sm mt-0.5">
            Vehicles detected but not registered in the system.
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-mono bg-red/10 border border-red/30 text-red px-2.5 py-0.5 rounded-full">
            {items.length} need review
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-green text-sm font-mono">
            No unregistered or guest entries pending review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((log) => (
            <div
              key={log.id}
              className={`card border-l-2 space-y-4 ${
                log.status === 'UNREGISTERED'
                  ? 'border-l-red'
                  : 'border-l-amber'
              }`}
            >
              {/* log info */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="plate-tag">{log.plate_number}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    log.status === 'UNREGISTERED'
                      ? 'text-red   border-red/30   bg-red/10'
                      : 'text-amber border-amber/30 bg-amber/10'
                  }`}>
                    {log.status === 'UNREGISTERED' ? 'Unregistered' : 'Guest'}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    log.event_type === 'ENTRY'
                      ? 'text-teal border-teal/30 bg-teal/10'
                      : 'text-amber border-amber/30 bg-amber/10'
                  }`}>
                    {log.event_type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs font-mono text-muted">{log.camera_id}</p>
                </div>
              </div>

              {log.guest_note && (
                <p className="text-xs text-secondary bg-surface rounded px-3 py-2 font-mono">
                  Note: {log.guest_note}
                </p>
              )}

              {/* actions */}
              <div className="space-y-3">
                {/* link to registered vehicle */}
                <div>
                  <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
                    Link to registered plate
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 font-mono tracking-widest uppercase"
                      placeholder="Registered plate number"
                      value={forms[log.id]?.plate_number || ''}
                      onChange={(e) =>
                        setForm(log.id, { plate_number: e.target.value })
                      }
                    />
                    <button
                      onClick={() => handle(log.id, 'link')}
                      disabled={loading[log.id]}
                      className="btn-primary px-4"
                    >
                      Link
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted font-mono">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* approve as guest / dismiss */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handle(log.id, 'approve_guest')}
                    disabled={loading[log.id]}
                    className="btn-ghost flex-1 text-sm"
                  >
                    Approve as guest
                  </button>
                  <button
                    onClick={() => handle(log.id, 'dismiss')}
                    disabled={loading[log.id]}
                    className="btn-danger flex-1 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* error */}
              {errors[log.id] && (
                <p className="text-red text-xs font-mono bg-red/10 border border-red/20 rounded px-3 py-2">
                  {errors[log.id]}
                </p>
              )}

              {loading[log.id] && (
                <p className="text-muted text-xs font-mono animate-pulse">
                  Processing...
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}