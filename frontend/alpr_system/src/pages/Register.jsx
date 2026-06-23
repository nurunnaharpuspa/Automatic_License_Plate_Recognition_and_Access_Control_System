import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/endpoints'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    user_id: '', full_name: '', email: '', password: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await register(form)
      navigate('/login', { state: { message: 'Registration submitted. Await admin approval.' } })
    } catch (err) {
      setError(err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'user_id',   label: 'Institutional ID', placeholder: 'e.g. STU-2024-001', type: 'text' },
    { key: 'full_name', label: 'Full name',         placeholder: 'Your full name',    type: 'text' },
    { key: 'email',     label: 'Email',             placeholder: 'you@example.com',   type: 'email' },
    { key: 'password',  label: 'Password',          placeholder: 'Min 8 characters',  type: 'password' },
  ]

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <p className="font-display text-amber text-3xl font-bold tracking-widest">ALPR</p>
          <p className="text-muted text-sm font-mono mt-1">license plate recognition system</p>
        </div>

        <div className="card space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-primary">Create account</h2>
            <p className="text-secondary text-sm mt-0.5">
              Your account will be reviewed before activation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  className="input-field"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                  minLength={key === 'password' ? 8 : undefined}
                />
              </div>
            ))}

            {error && (
              <div className="text-red text-xs bg-red/10 border border-red/20 rounded px-3 py-2 font-mono whitespace-pre-wrap">
                {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? 'Submitting...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-secondary text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-amber hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}