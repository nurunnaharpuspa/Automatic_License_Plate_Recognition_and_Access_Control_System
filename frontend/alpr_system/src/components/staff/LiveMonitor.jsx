import { useLiveEvents } from '../../hooks/useWebSocket'
import { useWS } from '../../context/WebSocketContext'
import StatusBadge from '../common/StatusBadge'

export default function LiveMonitor() {
  const events = useLiveEvents()
  const { connected } = useWS()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary text-lg">Live feed</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green animate-pulse-slow' : 'bg-red'}`} />
          <span className="text-xs font-mono text-muted">
            {connected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Time', 'Plate', 'Event', 'Confidence', 'Status', 'Owner', 'Camera'].map((h) => (
                <th key={h} className="text-left text-xs font-mono text-muted uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted text-sm py-10 font-mono">
                  Waiting for events...
                </td>
              </tr>
            ) : (
              events.map((ev, i) => (
                <tr
                  key={ev.id}
                  className={`border-b border-border/50 hover:bg-surface/60 transition-colors ${
                    i === 0 ? 'animate-fade-in' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-muted font-mono text-xs">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="plate-tag">{ev.plate_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ev.event_type} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-secondary">
                    {(ev.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="px-4 py-3 text-secondary text-xs">{ev.owner_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{ev.camera_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}