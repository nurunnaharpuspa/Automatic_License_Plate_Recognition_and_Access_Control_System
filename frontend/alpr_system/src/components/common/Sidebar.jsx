import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { getAllLogs } from '../../api/endpoints'
import { useWS } from '../../context/WebSocketContext'

const adminLinks = [
  { to: '/admin',          label: 'Overview'   },
  { to: '/admin/users',    label: 'Users'      },
  { to: '/admin/vehicles', label: 'Vehicles'   },
  { to: '/admin/logs',     label: 'Logs'       },
  { to: '/admin/settings', label: 'Settings'   },
]

const staffLinks = [
  { to: '/staff',          label: 'Live feed'   },
  { to: '/staff/queue',    label: 'Corrections' },
  { to: '/staff/guest',    label: 'Guest entry' },
  { to: '/staff/unregistered', label: 'Guest review', showBadge: true }, // Added flag
  { to: '/staff/users',    label: 'Approvals'   },
  { to: '/staff/logs',     label: 'History'     },
]

const userLinks = [
  { to: '/dashboard',          label: 'Dashboard' },
  { to: '/dashboard/vehicles', label: 'Vehicles'  },
  { to: '/dashboard/history',  label: 'History'   },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reviewCount, setReviewCount] = useState(0)
  const { lastEvent } = useWS()

  // 1. Fetch count when WebSocket events happen
  useEffect(() => {
    Promise.all([
      getAllLogs({ status: 'UNREGISTERED' }),
      getAllLogs({ status: 'GUEST' }),
    ]).then(([u, g]) => {
      // Ensure you are accessing the correct data structure from your API response
      const total = (u.data?.length || 0) + (g.data?.length || 0)
      setReviewCount(total)
    }).catch(err => console.error("Sidebar fetch error:", err))
  }, [lastEvent])

  const handleLogout = () => { logout(); navigate('/login') }

  // 2. Select the correct link set
  const rawLinks = 
    user?.role === 'ADMIN' ? adminLinks :
    user?.role === 'STAFF' ? staffLinks :
    userLinks

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-surface border-r border-border flex flex-col z-10">
      <div className="px-6 py-6 border-b border-border">
        <p className="font-display text-amber text-lg font-bold tracking-wider">AVLPR</p>
        <p className="text-muted text-xs mt-0.5 font-mono">Access Control system</p>
      </div>

      <div className="px-6 py-4 border-b border-border">
        <p className="text-xs text-muted mb-1">signed in as</p>
        <p className="text-sm text-primary font-medium truncate">{user?.full_name}</p>
        <p className="font-mono text-xs text-amber mt-0.5">{user?.role}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {rawLinks.map((link) => ( // Use 'link' here
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-amber/10 text-amber border-l-2 border-amber pl-[10px]'
                  : 'text-secondary hover:text-primary hover:bg-card'
              }`
            }
          >
            <span>{link.label}</span>
            
            {/* 3. Render badge only if flag is true and count > 0 */}
            {link.showBadge && reviewCount > 0 && (
              <span className="text-[10px] font-mono bg-red/20 text-red border border-red/30 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {reviewCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <button onClick={handleLogout} className="btn-ghost w-full text-center">
          Sign out
        </button>
      </div>
    </aside>
  )
}