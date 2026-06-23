import { useEffect, useState } from 'react'
import { getMyStatus } from '../../api/endpoints'
import { useWS } from '../../context/WebSocketContext'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { lastEvent } = useWS()
  const [status, setStatus] = useState([])

  const fetchStatus = () => getMyStatus().then((r) => setStatus(r.data))

  useEffect(() => { fetchStatus() }, [])

  useEffect(() => {
    if (!lastEvent) return
    if (status.some((s) => s.plate === lastEvent.plate_number)) fetchStatus()
  }, [lastEvent])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted text-sm font-mono">ID: {user?.user_id}</p>
        <h2 className="font-display text-xl font-bold text-primary mt-1">
          Welcome back, {user?.full_name}
        </h2>
      </div>

      {status.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-muted text-sm">No approved vehicles yet.</p>
          <p className="text-muted text-xs mt-1">Register a vehicle and wait for approval.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {status.map((v) => (
            <div key={v.plate} className="card relative overflow-hidden group">
              {/* parked indicator strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                v.is_parked ? 'bg-green' : 'bg-border'
              }`} />
              <div className="pl-4">
                <div className="flex items-start justify-between">
                  <span className="plate-tag">{v.plate}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                    v.is_parked
                      ? 'text-green border-green/30 bg-green/10'
                      : 'text-muted border-border bg-surface'
                  }`}>
                    {v.is_parked ? 'Parked' : 'Away'}
                  </span>
                </div>
                <p className="text-secondary text-sm mt-2">
                  {v.make} {v.model}
                  <span className="text-muted"> · {v.color}</span>
                </p>
                {v.is_parked && (
                  <p className="text-xs text-muted font-mono mt-2">
                    Since {new Date(v.since).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}