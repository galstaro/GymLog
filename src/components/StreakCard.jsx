import { useNavigate } from 'react-router-dom'

export default function StreakCard({ streakStatus, longestStreak, onRequestNotif }) {
  const navigate = useNavigate()
  const { state, remaining, currentStreak } = streakStatus

  const isActive = state === 'active'
  const isAtRisk = state === 'at_risk'
  const hasStreak = currentStreak > 0

  const borderColor = isActive
    ? 'rgba(74,222,128,0.3)'
    : isAtRisk
    ? 'rgba(250,204,21,0.3)'
    : 'var(--border)'

  const glowShadow = isActive
    ? '0 0 20px rgba(74,222,128,.1)'
    : isAtRisk
    ? '0 0 20px rgba(250,204,21,.08)'
    : 'none'

  return (
    <div style={{ margin: '0 16px 14px' }}>
      <button
        onClick={() => navigate('/milestones')}
        style={{
          width: '100%', textAlign: 'left',
          background: 'var(--surface)',
          borderRadius: 18, border: `1px solid ${borderColor}`,
          padding: '16px 16px',
          boxShadow: glowShadow,
          display: 'flex', alignItems: 'center', gap: 14,
          transition: 'border-color .2s',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>
          {isAtRisk ? '⚠️' : '🔥'}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasStreak ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>
                  {currentStreak}
                </span>
                <span style={{ fontSize: 14, color: 'var(--hint)', fontWeight: 600 }}>
                  week streak
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3,
                color: isActive ? '#4ade80' : isAtRisk ? '#facc15' : 'var(--hint)' }}>
                {isActive && '✓ Goal met — streak safe'}
                {isAtRisk && `At risk — ${remaining} workout${remaining !== 1 ? 's' : ''} to go`}
                {!isActive && !isAtRisk && `${remaining} workout${remaining !== 1 ? 's' : ''} to secure this week`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Start your streak</div>
              <div style={{ fontSize: 12, color: 'var(--hint)', marginTop: 3 }}>Hit your weekly goal to begin</div>
            </>
          )}
          {longestStreak > 0 && (
            <div style={{ fontSize: 11, color: 'var(--disabled)', marginTop: 4 }}>
              Best: {longestStreak} week{longestStreak !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Right side: notif bell + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onRequestNotif?.() }}
            title="Enable streak reminders"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--hint)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5v2.5L2 10h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z"
                stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M6.5 10.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="var(--hint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    </div>
  )
}
