import { useEffect, useState } from 'react'
import { getMyLogs } from '../../api/endpoints'
import StatusBadge from '../common/StatusBadge'

export default function ParkingHistory() {
  const [logs, setLogs] = useState([])

  useEffect(() => { getMyLogs().then((r) => setLogs(r.data)) }, [])

  return (
    <div className="space-y-5">
      <h3 className="font-display font-bold text-primary text-lg">Parking history</h3>

      {logs.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-muted text-sm">No parking events yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="card flex items-center gap-4 py-3.5">
            <StatusBadge status={log.event_type} />
            <span className="plate-tag">{log.plate_number}</span>
            <div className="flex-1">
              <p className="text-secondary text-sm">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={log.status} />
              <p className="text-muted text-xs font-mono mt-1">
                {(log.confidence_score * 100).toFixed(1)}% conf
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}