import { useEffect, useState } from 'react'
import { getMyVehicles, addVehicle } from '../../api/endpoints'
import StatusBadge from '../common/StatusBadge'

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', color: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { getMyVehicles().then((r) => setVehicles(r.data)) }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await addVehicle({ ...form, plate_number: form.plate_number.toUpperCase() })
      setVehicles((p) => [...p, res.data])
      setForm({ plate_number: '', make: '', model: '', color: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary text-lg">My vehicles</h3>
        <button onClick={() => setShowForm((p) => !p)} className="btn-ghost text-sm">
          {showForm ? 'Cancel' : '+ Add vehicle'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-slide-up">
          <h4 className="font-mono text-sm text-amber mb-4 uppercase tracking-wider">
            Register new vehicle
          </h4>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            {[
              { key: 'plate_number', label: 'Plate number', placeholder: 'ABC-1234' },
              { key: 'make',         label: 'Make',         placeholder: 'Toyota' },
              { key: 'model',        label: 'Model',        placeholder: 'Corolla' },
              { key: 'color',        label: 'Color',        placeholder: 'White' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
                  {label}
                </label>
                <input
                  className="input-field"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </div>
            ))}
            {error && (
              <div className="col-span-2 text-red text-xs bg-red/10 border border-red/20 rounded px-3 py-2 font-mono">
                {JSON.stringify(error, null, 2)}
              </div>
            )}
            <div className="col-span-2 flex gap-3 mt-1">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Registering...' : 'Register vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 && !showForm && (
        <div className="card text-center py-10">
          <p className="text-muted text-sm">No vehicles registered yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="plate-tag">{v.plate_number}</span>
              <div>
                <p className="text-primary text-sm">{v.make} {v.model}</p>
                <p className="text-muted text-xs font-mono">{v.color}</p>
              </div>
            </div>
            <StatusBadge status={v.status} />
          </div>
        ))}
      </div>
    </div>
  )
}