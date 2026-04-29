import { useMemo } from 'react'

const COLORS = ['#4ade80', '#ffffff', '#facc15', '#4ade80', '#facc15', '#ffffff']

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.4,
      duration: 1.8 + Math.random() * 1.6,
      size: 5 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      isRect: Math.random() > 0.45,
    }))
  , [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 202, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`,
          top: -16,
          width: p.isRect ? p.size * 1.6 : p.size,
          height: p.isRect ? p.size * 0.5 : p.size,
          borderRadius: p.isRect ? 2 : '50%',
          background: p.color,
          opacity: 0,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          transform: `rotate(${p.rotation}deg)`,
        }} />
      ))}
    </div>
  )
}

export default function MilestoneCelebration({ milestone, totalCount, onDismiss }) {
  return (
    <>
      <Confetti />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
        animation: 'fadeUp .3s ease',
      }}>
        {/* Glow orb behind icon */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,.22) 0%, transparent 65%)',
          pointerEvents: 'none', animation: 'glowPulse 2s ease-in-out infinite',
        }} />

        {/* Badge icon */}
        <div style={{
          fontSize: 100, lineHeight: 1, marginBottom: 28,
          animation: 'popIn .65s cubic-bezier(.34,1.56,.64,1) forwards',
          position: 'relative', zIndex: 1,
        }}>
          {milestone.icon}
        </div>

        {/* Label */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#4ade80',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          Milestone Unlocked
        </div>

        {/* Title */}
        <div style={{
          fontSize: 38, fontWeight: 900, color: '#fff',
          letterSpacing: -1.4, textAlign: 'center', lineHeight: 1.1, marginBottom: 14,
        }}>
          {milestone.title}
        </div>

        {/* Stat */}
        <div style={{
          fontSize: 15, color: 'var(--muted)', textAlign: 'center', marginBottom: 52,
        }}>
          {milestone.statLabel}
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%', maxWidth: 320, padding: '17px 0', borderRadius: 16,
            fontSize: 17, fontWeight: 900, color: '#000',
            background: 'linear-gradient(135deg, #22c55e, #4ade80)',
            boxShadow: '0 0 36px rgba(74,222,128,.45)',
            letterSpacing: -0.3,
          }}
        >
          Awesome!
        </button>

        {totalCount > 1 && (
          <div style={{ fontSize: 12, color: 'var(--hint)', marginTop: 16 }}>
            + {totalCount - 1} more milestone{totalCount - 1 !== 1 ? 's' : ''} unlocked
          </div>
        )}
      </div>
    </>
  )
}
