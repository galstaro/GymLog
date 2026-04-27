import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  {
    id: 'home', label: 'Home', path: '/',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 11.5L12 3l9 8.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V11.5z" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.6" strokeLinejoin="round" fill={active ? 'rgba(34,197,94,.12)' : 'none'} />
        <path d="M9 22v-7h6v7" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'workout', label: 'Workout', path: '/workout/active',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13H12L11 22l8.5-11H13L13 2z" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" fill={active ? 'rgba(34,197,94,.12)' : 'none'} />
      </svg>
    ),
  },
  {
    id: 'progress', label: 'Progress', path: '/exercises',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 7,11 11,14 15,7 19,10" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="20" x2="21" y2="20" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'settings', label: 'Settings', path: '/settings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.6" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#0a0a0a', borderTop: '1px solid #1a1a1a',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>
      {TABS.map(tab => {
        const active = pathname === tab.path ||
          (tab.path !== '/' && pathname.startsWith(tab.path.split('/active')[0]) && tab.path !== '/settings')
        return (
          <button key={tab.id} onClick={() => navigate(tab.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 0 8px', gap: 3, minHeight: 58, background: 'transparent',
          }}>
            {tab.icon(active)}
            <span style={{ fontSize: 10, letterSpacing: '0.03em', color: active ? '#22c55e' : '#444', fontWeight: 500 }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
