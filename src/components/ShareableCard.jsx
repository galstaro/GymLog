import { forwardRef } from 'react'

function fmt(s) {
  if (!s) return '0 min'
  const m = Math.floor(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/**
 * Square shareable card — also used as the export target for html-to-image.
 * Props:
 *   heroStat  { type: 'pr'|'volume'|'session', displayValue, label, subLabel }
 *   stats     { duration, totalSets, musclesWorked: string[] }
 *   displayVolume  number  (the animated counter value passed from parent)
 */
const ShareableCard = forwardRef(function ShareableCard({ heroStat, stats, displayVolume }, ref) {
  const muscles = (stats.musclesWorked || []).slice(0, 3).map(capitalize).join(' · ') || 'Mixed'

  // The displayed hero number — use animated displayVolume for volume type
  const heroNumber = heroStat.type === 'volume'
    ? displayVolume.toLocaleString()
    : heroStat.displayValue

  return (
    <div
      ref={ref}
      style={{
        width: 375, height: 375,
        background: '#0f0f0f',
        borderRadius: 24,
        display: 'flex', flexDirection: 'column',
        padding: '28px 28px 24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* Subtle glow behind hero area */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top bar: GymLog logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        marginBottom: 'auto',
      }}>
        <img src="/icons/icon-192.png" alt="GymLog" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80', letterSpacing: -0.3 }}>
          GymLog
        </span>
      </div>

      {/* Hero stat — vertically centered */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
        {heroStat.subLabel && (
          <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            {heroStat.subLabel}
          </div>
        )}
        <div style={{
          fontSize: 58, fontWeight: 900, color: '#fff',
          letterSpacing: -2, lineHeight: 1,
          textShadow: '0 0 40px rgba(74,222,128,0.15)',
        }}>
          {heroStat.type === 'volume' ? (
            <>{heroNumber} <span style={{ fontSize: 26, fontWeight: 700, color: '#888' }}>kg</span></>
          ) : (
            heroNumber
          )}
        </div>
        <div style={{ fontSize: 13, color: '#555', fontWeight: 600, letterSpacing: '0.02em' }}>
          {heroStat.label}
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
        {[
          fmt(stats.duration),
          `${stats.totalSets} sets`,
          muscles,
        ].map((chip, i) => (
          <div key={i} style={{
            fontSize: 11, color: '#666', fontWeight: 600,
            background: '#1a1a1a', borderRadius: 8, padding: '5px 10px',
            letterSpacing: '0.02em', whiteSpace: 'nowrap',
            maxWidth: i === 2 ? 130 : undefined,
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {chip}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: '#333', fontWeight: 500, letterSpacing: '0.04em' }}>
          gymlog.app
        </span>
      </div>
    </div>
  )
})

export default ShareableCard
