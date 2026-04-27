function calcStats(sets) {
  if (!sets?.length) return null
  const bestWeight = Math.max(...sets.map(s => s.weight_kg))
  const totalVolume = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
  return { bestWeight, totalVolume }
}

export default function ProgressComparison({ exerciseSets, lastSession }) {
  if (!lastSession) return null
  const todayStats = calcStats(exerciseSets)
  const lastStats = calcStats(lastSession.sets)
  if (!lastStats) return null

  function getColor(today, last) {
    if (today == null) return 'var(--muted)'
    if (today > last) return 'var(--neon)'
    if (today < last) return 'var(--red)'
    return '#a855f7'
  }

  const wColor = todayStats ? getColor(todayStats.bestWeight, lastStats.bestWeight) : 'var(--muted)'
  const vColor = todayStats ? getColor(todayStats.totalVolume, lastStats.totalVolume) : 'var(--muted)'

  return (
    <div style={{
      margin: '0 14px 10px', borderRadius: 12, padding: '10px 14px',
      background: 'rgba(0,255,136,.04)', border: '1px solid rgba(0,255,136,.1)',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,255,136,.5)', marginBottom: 8 }}>
        Last Session vs Today
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Best set', last: `${lastStats.bestWeight}kg`, today: todayStats ? `${todayStats.bestWeight}kg` : '—', color: wColor },
          { label: 'Volume', last: `${lastStats.totalVolume.toLocaleString()}kg`, today: todayStats ? `${todayStats.totalVolume.toLocaleString()}kg` : '—', color: vColor },
        ].map(({ label, last, today, color }) => (
          <div key={label}>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, letterSpacing: '.04em' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{last}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>→</span>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{today}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
