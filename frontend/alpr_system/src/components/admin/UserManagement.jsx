import { useEffect, useState } from 'react'
import {
  getPendingUsers, approveUser, getAllUsers,
  createStaff, deleteUser
} from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../common/StatusBadge'

function CreateStaffForm({ onCreated }) {
  const [form,    setForm]    = useState({ user_id: '', full_name: '', email: '', password: '' })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await createStaff(form)
      setSuccess(true)
      setForm({ user_id: '', full_name: '', email: '', password: '' })
      if (onCreated) onCreated(res.data)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card border-l-2 border-l-teal space-y-4">
      <h4 className="font-mono text-sm text-teal uppercase tracking-wider">
        Create staff account
      </h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {[
          { key: 'user_id',   label: 'Staff ID',  placeholder: 'STF-001',          type: 'text'     },
          { key: 'full_name', label: 'Full name',  placeholder: 'Jane Smith',        type: 'text'     },
          { key: 'email',     label: 'Email',      placeholder: 'jane@example.com',  type: 'email'    },
          { key: 'password',  label: 'Password',   placeholder: 'Min 8 characters',  type: 'password' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="text-xs text-muted font-mono uppercase tracking-wider block mb-1">
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
          <div className="col-span-2 text-red text-xs bg-red/10 border border-red/20 rounded px-3 py-2 font-mono">
            {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
          </div>
        )}
        {success && (
          <p className="col-span-2 text-green text-sm bg-green/10 border border-green/20 rounded px-3 py-2 font-mono">
            Staff account created successfully.
          </p>
        )}

        <div className="col-span-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create staff account'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'

  const [pending,    setPending]    = useState([])
  const [allUsers,   setAllUsers]   = useState([])
  const [tab,        setTab]        = useState('pending')
  const [loadingAll, setLoadingAll] = useState(false)

  useEffect(() => {
    getPendingUsers().then((r) => setPending(r.data))
  }, [])

  useEffect(() => {
    if (tab === 'all' && isAdmin) {
      setLoadingAll(true)
      getAllUsers()
        .then((r) => setAllUsers(r.data))
        .finally(() => setLoadingAll(false))
    }
  }, [tab, isAdmin])

  const handleApproval = async (id, status) => {
    await approveUser(id, status)
    setPending((p) => p.filter((u) => u.id !== id))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await deleteUser(id)
      setAllUsers((p) => p.filter((u) => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed.')
    }
  }

  // tabs: staff-only sees only pending; admin sees all tabs
  const tabs = [
    { key: 'pending', label: `Pending (${pending.length})` },
    ...(isAdmin ? [
      { key: 'all',    label: 'All users'    },
      { key: 'create', label: 'Create staff' },
    ] : []),
  ]

  return (
    <div className="space-y-5">
      <h3 className="font-display font-bold text-primary text-lg">User management</h3>

      {/* tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-amber text-amber'
                : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* pending approvals */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-green text-sm font-mono">No pending approvals.</p>
            </div>
          ) : (
            pending.map((u) => (
              <div key={u.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-amber font-bold text-sm">
                      {u.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-primary text-sm font-medium">{u.full_name}</p>
                    <p className="text-muted text-xs font-mono">{u.user_id} · {u.email}</p>
                    <p className="text-muted text-xs mt-0.5">
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApproval(u.id, 'ACTIVE')}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(u.id, 'SUSPENDED')}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* all users — admin only */}
      {tab === 'all' && isAdmin && (
        <div className="card p-0 overflow-hidden">
          {loadingAll ? (
            <p className="text-muted text-sm font-mono animate-pulse p-5">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name / ID', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-mono text-muted uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-primary text-sm">{u.full_name}</p>
                      <p className="text-muted text-xs font-mono">{u.user_id}</p>
                    </td>
                    <td className="px-4 py-3 text-secondary text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        u.role === 'ADMIN' ? 'text-amber border-amber/30 bg-amber/10' :
                        u.role === 'STAFF' ? 'text-teal  border-teal/30  bg-teal/10'  :
                        'text-secondary border-border bg-surface'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-muted text-xs font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {/* never show delete on ADMIN accounts */}
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-xs text-red hover:underline font-mono"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* create staff — admin only */}
      {tab === 'create' && isAdmin && (
        <CreateStaffForm
          onCreated={(newUser) => setAllUsers((p) => [newUser, ...p])}
        />
      )}
    </div>
  )
}