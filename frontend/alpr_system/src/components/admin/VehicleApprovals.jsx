import { useEffect, useState } from 'react'
import { getPendingVehicles, approveVehicle } from '../../api/endpoints'

export default function VehicleApprovals() {
  const [pending, setPending] = useState([])

  useEffect(() => { getPendingVehicles().then((r) => setPending(r.data)) }, [])

  const handle = async (id, status) => {
    await approveVehicle(id, status)
    setPending((p) => p.filter((v) => v.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary text-lg">Pending vehicle approvals</h3>
        {pending.length > 0 && (
          <span className="text-xs font-mono bg-amber/10 border border-amber/30 text-amber px-2.5 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-green text-sm font-mono">No pending vehicle approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((v) => (
            <div key={v.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="plate-tag">{v.plate_number}</span>
                <div>
                  <p className="text-primary text-sm">{v.make} {v.model}
                    <span className="text-muted"> · {v.color}</span>
                  </p>
                  <p className="text-muted text-xs font-mono mt-0.5">
                    Owner: {v.owner_name} ({v.owner_user_id})
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handle(v.id, 'APPROVED')} className="btn-primary text-xs py-1.5 px-3">
                  Approve
                </button>
                <button onClick={() => handle(v.id, 'REJECTED')} className="btn-danger text-xs py-1.5 px-3">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}