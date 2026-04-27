import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  {
    id: 'home', label: 'Home', path: '/',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 18v-5h6v5" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'workout', label: 'Workout', path: '/workout/active',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v14M4 7l6-4 6 4" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="10" r="7" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'progress', label: 'Progress', path: '/exercises',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polyline points="2,14 6,9 10,12 14,6 18,8" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'settings', label: 'Settings', path: '/settings',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.5" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={active ? '#22c55e' : '#444'} strokeWidth="1.5" strokeLinecap="round"/>
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
        const active = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path.replace('/active', '')))
        return (
          <button key={tab.id} onClick={() => navigate(tab.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 0 8px', gap: 3, minHeight: 56,
          }}>
            {tab.icon(active)}
            <span style={{ fontSize: 10, letterSpacing: '0.04em', color: active ? '#22c55e' : '#444', fontWeight: 500 }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
