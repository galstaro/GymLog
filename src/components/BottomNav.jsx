import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  {
    id: 'home', label: 'Home', path: '/',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 11.5L12 3l9 8.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V11.5z"
          stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="1.8" strokeLinejoin="round"
          fill={active ? 'rgba(34,197,94,.18)' : 'none'} />
        <path d="M9 22v-7h6v7" stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'workout', label: 'Workout', path: '/workout/active',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13H12L11 22l8.5-11H13L13 2z"
          stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round"
          fill={active ? 'rgba(34,197,94,.18)' : 'none'} />
      </svg>
    ),
  },
  {
    id: 'progress', label: 'Progress', path: '/exercises',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 7,11 11,14 15,7 19,10"
          stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="20" x2="21" y2="20"
          stroke={active ? 'rgba(34,197,94,.4)' : '#222230'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'settings', label: 'Settings', path: '/settings',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="1.8" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
          stroke={active ? '#22c55e' : '#3a3a50'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 50,
    }}>
      {/* Blur background panel — sits flush at the very bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(6,6,8,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '0.5px solid rgba(34,197,94,0.12)',
      }} />

      {/* Tab buttons — sit above safe area */}
      <div style={{
        position: 'relative',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'flex', maxWidth: 430, margin: '0 auto',
      }}>
      {TABS.map(tab => {
        const active = pathname === tab.path ||
          (tab.path !== '/' && tab.path !== '/settings' && pathname.startsWith(tab.path.split('/active')[0]))
        return (
          <button key={tab.id} onClick={() => navigate(tab.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 0 8px', gap: 4, minHeight: 'var(--nav-h)', background: 'transparent',
            position: 'relative',
          }}>
            {/* active indicator dot */}
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 2.5, borderRadius: 2,
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                boxShadow: '0 0 10px rgba(34,197,94,.8)',
              }} />
            )}
            <div style={{
              filter: active ? 'drop-shadow(0 0 6px rgba(34,197,94,.5))' : 'none',
              transition: 'filter .2s',
            }}>
              {tab.icon(active)}
            </div>
            <span style={{
              fontSize: 10, letterSpacing: '0.04em', fontWeight: active ? 700 : 500,
              color: active ? '#22c55e' : '#3a3a50',
              transition: 'color .2s',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
      </div>
    </nav>
  )
}
