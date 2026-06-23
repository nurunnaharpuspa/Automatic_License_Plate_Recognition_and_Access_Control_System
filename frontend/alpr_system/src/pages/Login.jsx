import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'STAFF') navigate('/staff')
      else if (user.status === 'PENDING') navigate('/pending')
      else navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
   <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 relative">
  {/* background grid */}
  <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

  {/* Wrapper for Title - set to a larger width */}
  <div className="relative w-full max-w-4xl mb-12 animate-slide-up">
    <p className="font-display text-amber text-3xl md:text-4xl font-bold tracking-widest text-center leading-tight">
      Automatic Vehicle License Plate Recognition and Access Control System
    </p>
  </div>

  {/* Wrapper for Login Card - remains narrow */}
  <div className="relative w-full max-w-sm animate-slide-up delay-100">
    <div className="text-center mb-10">
      <p className="text-muted text-sm font-mono mt-1 uppercase tracking-tighter">
        Bangladeshi license plate recognition system
      </p>
    </div>

    <div className="card space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-primary">Sign in</h2>
        <p className="text-secondary text-sm mt-0.5">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
            Email
          </label>
          <input
            type="email"
            className="input-field w-full"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1.5">
            Password
          </label>
          <input
            type="password"
            className="input-field w-full"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && (
          <p className="text-red text-sm bg-red/10 border border-red/20 rounded px-3 py-2 font-mono">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-secondary text-sm">
        No account?{" "}
        <Link to="/register" className="text-amber hover:underline">
          Register
        </Link>
      </p>
    </div>
  </div>
</div>
  )
}