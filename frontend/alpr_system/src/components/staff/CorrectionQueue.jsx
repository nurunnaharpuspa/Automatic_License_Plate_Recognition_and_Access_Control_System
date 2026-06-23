import { useEffect, useState } from 'react'
import { getPendingCorrections, submitCorrection } from '../../api/endpoints'

const MEDIA_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '/media/')
  : 'http://localhost:8000/media/'

export default function CorrectionQueue() {
  const [pending,     setPending]     = useState([])
  const [corrections, setCorrections] = useState({})
  const [notes,       setNotes]       = useState({})
  const [submitting,  setSubmitting]  = useState({})
  const [errors,      setErrors]      = useState({})

  useEffect(() => {
    getPendingCorrections().then((r) => setPending(r.data))
  }, [])

  // New Dismiss Function: Simply removes it from the local list
  const handleDismiss = (id) => {
    setPending((p) => p.filter((x) => x.id !== id))
  }

  const handleCorrect = async (id) => {
    const corrected_plate = corrections[id]?.trim().toUpperCase()

    if (!corrected_plate) {
      setErrors({ ...errors, [id]: 'Please enter the correct plate number.' })
      return
    }

    setSubmitting((p) => ({ ...p, [id]: true }))
    setErrors((p)     => ({ ...p, [id]: null }))

    try {
      await submitCorrection(id, {
        corrected_plate,
        note: notes[id] || '',
      })
      setPending((p) => p.filter((x) => x.id !== id))
    } catch (err) {
      const data = err.response?.data
      let msg = 'Submission failed.'
      if (typeof data === 'string')       msg = data
      else if (data?.error)               msg = data.error
      else if (data?.corrected_plate)     msg = data.corrected_plate[0]
      else if (data?.non_field_errors)    msg = data.non_field_errors[0]
      else if (data)                      msg = JSON.stringify(data)
      setErrors((p) => ({ ...p, [id]: msg }))
    } finally {
      setSubmitting((p) => ({ ...p, [id]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary text-lg">Correction queue</h3>
        {pending.length > 0 && (
          <span className="text-xs font-mono bg-amber/10 border border-amber/30 text-amber px-2.5 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-green text-sm font-mono">All clear — no corrections needed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((log) => (
            <div
              key={log.id}
              className="card border-l-2 border-l-amber space-y-4"
            >
              {/* info row */}
              <div className="flex items-start gap-5">
                {log.image_path ? (
                  <img
                    src={`${MEDIA_BASE}${log.image_path}`}
                    alt="plate capture"
                    className="h-14 w-auto rounded border border-border object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-14 w-32 rounded border border-border bg-surface flex items-center justify-center flex-shrink-0">
                    <span className="text-muted text-xs font-mono">no image</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="plate-tag">{log.raw_ocr_text || log.plate_number}</span>
                    <span className="text-xs font-mono text-amber">
                      {(log.confidence_score * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-muted font-mono">
                    {log.event_type} · {new Date(log.timestamp).toLocaleString()} · {log.camera_id}
                  </p>
                </div>
              </div>

              {/* input row */}
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-[2] min-w-40">
                  <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
                    Correct plate
                  </label>
                  <input
                    className={`input-field font-mono tracking-widest uppercase ${
                      errors[log.id] ? 'border-red focus:border-red' : ''
                    }`}
                    placeholder="e.g. ABC1234"
                    value={corrections[log.id] || ''}
                    onChange={(e) => {
                      setCorrections({ ...corrections, [log.id]: e.target.value })
                      if (errors[log.id]) setErrors({ ...errors, [log.id]: null })
                    }}
                  />
                </div>

                <div className="flex-[2] min-w-40">
                  <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
                    Note (optional)
                  </label>
                  <input
                    className="input-field"
                    placeholder="Reason..."
                    value={notes[log.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [log.id]: e.target.value })}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(log.id)}
                    className="btn-ghost text-xs py-2.5 px-4"
                    title="Remove from queue without saving"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleCorrect(log.id)}
                    disabled={submitting[log.id] || !corrections[log.id]?.trim()}
                    className="btn-primary py-2.5 px-6"
                  >
                    {submitting[log.id] ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>

              {/* error message */}
              {errors[log.id] && (
                <p className="text-red text-xs font-mono bg-red/10 border border-red/20 rounded px-3 py-2">
                  {errors[log.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}