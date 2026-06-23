import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function PendingPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center space-y-5 animate-slide-up">
        <div className="w-12 h-12 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mx-auto">
          <span className="text-amber text-xl">⏳</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-primary">Pending approval</h2>
          <p className="text-secondary text-sm mt-2">
            Hi {user?.full_name}, your account is under review. An admin will activate it shortly.
          </p>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost w-full">
          Sign out
        </button>
      </div>
    </div>
  )
}