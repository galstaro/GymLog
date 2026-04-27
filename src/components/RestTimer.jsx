export default function RestTimer({ remaining, total, onDismiss }) {
  const progress = remaining / total
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isWarning = remaining <= 30 && remaining > 10
  const isUrgent = remaining <= 10

  const color = isUrgent ? '#ff2d55' : isWarning ? '#f59e0b' : '#00ff88'
  const glow  = isUrgent ? 'rgba(255,45,85,.6)' : isWarning ? 'rgba(245,158,11,.5)' : 'rgba(0,255,136,.5)'

  // SVG ring
  const R = 88, stroke = 8
  const circ = 2 * Math.PI * R
  const dash = circ * progress
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}`
  const unit    = mins > 0 ? '' : 's'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      background: 'rgba(7,7,15,.88)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 32px',
    }}>
      {/* Label */}
      <p style={{
        fontSize: 11, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase',
        color: color, opacity: .8, marginBottom: 32,
      }}>Rest Timer</p>

      {/* Ring */}
      <div style={{ position: 'relative', width: (R + stroke) * 2, height: (R + stroke) * 2, marginBottom: 32 }}>
        <svg width={(R + stroke) * 2} height={(R + stroke) * 2} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={R + stroke} cy={R + stroke} r={R} fill="none"
            stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
          {/* Progress */}
          <circle cx={R + stroke} cy={R + stroke} r={R} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{
              filter: `drop-shadow(0 0 8px ${glow})`,
              transition: 'stroke-dasharray 1s linear, stroke .5s',
            }}
          />
        </svg>
        {/* Center number */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: isUrgent ? 'neonPulse 0.6s ease-in-out infinite' : 'none',
        }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 54, fontWeight: 900, lineHeight: 1, letterSpacing: -2,
            color, textShadow: `0 0 24px ${glow}, 0 0 48px ${glow}`,
          }}>
            {timeStr}<span style={{ fontSize: 28 }}>{unit}</span>
          </span>
          {isUrgent && <span style={{ fontSize: 11, color, opacity: .7, letterSpacing: '.1em', marginTop: 4 }}>ALMOST DONE</span>}
          {isWarning && <span style={{ fontSize: 11, color, opacity: .7, letterSpacing: '.1em', marginTop: 4 }}>GET READY</span>}
        </div>
      </div>

      {/* Linear progress bar */}
      <div style={{ width: '100%', maxWidth: 320, height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 99, marginBottom: 40, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${color}, ${isUrgent ? '#ff6b6b' : isWarning ? '#fcd34d' : '#00e5ff'})`,
          boxShadow: `0 0 10px ${glow}`,
          transition: 'width 1s linear, background .5s',
        }} />
      </div>

      {/* Skip button */}
      <button onClick={onDismiss} style={{
        width: '100%', maxWidth: 320, padding: '16px 0', borderRadius: 16,
        fontWeight: 800, fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase',
        background: 'var(--bg2)', color: 'var(--muted)',
        border: '1px solid rgba(255,255,255,.1)',
      }}>
        Skip Rest
      </button>
    </div>
  )
}
