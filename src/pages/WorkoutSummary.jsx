function fmt(mins) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function WorkoutSummary({ result, onDone }) {
  const { exercises, durationMins } = result
  const totalSets = exercises.reduce((s, ex) => s + ex.sets.length, 0)
  const totalVolume = exercises.reduce((s, ex) => s + ex.sets.reduce((ss, set) => ss + set.weight_kg * set.reps, 0), 0)

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* BG decoration */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,255,136,.08) 0%, transparent 70%)',
      }} />

      <div className="fade-up" style={{ padding: '60px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {/* Trophy */}
        <div style={{
          width: 88, height: 88, borderRadius: 28, marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(0,255,136,.15), rgba(0,229,255,.1))',
          border: '1.5px solid rgba(0,255,136,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
          boxShadow: '0 0 40px rgba(0,255,136,.2)',
        }}>🏆</div>

        <h1 className="grad" style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>Workout Done!</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>You crushed it 🔥</p>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28, width: '100%', maxWidth: 360 }}>
          {[
            { label: 'Duration', value: fmt(durationMins), icon: '⏱' },
            { label: 'Exercises', value: exercises.length, icon: '💪' },
            { label: 'Total Sets', value: totalSets, icon: '🎯' },
            { label: 'Volume', value: totalVolume > 0 ? `${totalVolume.toLocaleString()}kg` : '—', icon: '📊' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
              padding: '16px 14px', textAlign: 'center',
              borderTop: '2px solid rgba(0,255,136,.2)',
            }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>{icon}</p>
              <p className="grad" style={{ fontSize: 22, fontWeight: 900 }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, letterSpacing: '.04em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ width: '100%', maxWidth: 360, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exercises.map(ex => (
            <div key={ex.exercise.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '13px 16px',
              borderLeft: '3px solid rgba(0,255,136,.35)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ex.exercise.name}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: 'var(--neon)', opacity: .7,
                background: 'rgba(0,255,136,.08)', padding: '3px 10px', borderRadius: 8,
              }}>{ex.sets.length} sets</span>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="glow"
          style={{
            marginTop: 28, width: '100%', maxWidth: 360, padding: '17px 0', borderRadius: 16,
            fontWeight: 900, fontSize: 16, letterSpacing: '.08em', textTransform: 'uppercase',
            background: 'linear-gradient(120deg, #00ff88, #00e5ff)', color: '#000',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
