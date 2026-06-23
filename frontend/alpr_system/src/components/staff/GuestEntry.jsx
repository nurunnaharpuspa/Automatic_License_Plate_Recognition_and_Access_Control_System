import { useState } from 'react'
import { logGuest } from '../../api/endpoints'

export default function GuestEntry({ onLogged }) {
  const [form, setForm] = useState({
    plate_number: '', event_type: 'ENTRY', guest_note: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setResult(null)
    try {
      const res = await logGuest({
        ...form,
        plate_number: form.plate_number.trim().toUpperCase()
      })
      setResult({ ok: true, plate: res.data.plate_number })
      setForm({ plate_number: '', event_type: 'ENTRY', guest_note: '' })
      if (onLogged) onLogged(res.data)
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.plate_number?.[0] || 'Failed to log guest.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="font-display font-bold text-primary text-lg">Guest entry / exit</h3>
        <p className="text-secondary text-sm mt-1">
          Manually log a vehicle that is not registered in the system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
              Plate number
            </label>
            <input
              className="input-field font-mono tracking-widest uppercase"
              placeholder="ABC-1234"
              value={form.plate_number}
              onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
              Event type
            </label>
            <div className="flex gap-3 mt-1">
              {['ENTRY', 'EXIT'].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => setForm({ ...form, event_type: t })}
                  className={`flex-1 py-2.5 rounded text-sm font-mono border transition-colors ${
                    form.event_type === t
                      ? t === 'ENTRY'
                        ? 'bg-teal/10 border-teal text-teal'
                        : 'bg-amber/10 border-amber text-amber'
                      : 'border-border text-muted hover:border-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
            Note (optional)
          </label>
          <input
            className="input-field"
            placeholder="e.g. visitor for room 204, delivery van..."
            value={form.guest_note}
            onChange={(e) => setForm({ ...form, guest_note: e.target.value })}
          />
        </div>

        {result && (
          <div className={`text-sm font-mono px-3 py-2 rounded border ${
            result.ok
              ? 'text-green bg-green/10 border-green/20'
              : 'text-red bg-red/10 border-red/20'
          }`}>
            {result.ok
              ? `Guest ${form.event_type === 'ENTRY' ? 'entry' : 'exit'} logged for ${result.plate}`
              : result.msg}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Logging...' : 'Log guest'}
        </button>
      </form>
    </div>
  )
}