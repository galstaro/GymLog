import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(str) {
  const d = new Date(str)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export default function ExerciseProgress({ user, exercise, onBack }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [exercise.id])

  async function loadHistory() {
    setLoading(true)
    const { data } = await supabase.from('sets')
      .select('weight_kg, reps, set_number, workout_id, workouts(date)')
      .eq('user_id', user.id).eq('exercise_id', exercise.id)
      .order('created_at', { ascending: true })
    if (!data?.length) { setLoading(false); return }
    const byDate = {}
    for (const s of data) {
      const date = s.workouts?.date
      if (!date) continue
      if (!byDate[date]) byDate[date] = []
      byDate[date].push(s)
    }
    const result = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, sets]) => ({
      date, sets,
      bestWeight: Math.max(...sets.map(s => s.weight_kg)),
      totalVolume: sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0),
    }))
    setSessions(result)
    setLoading(false)
  }

  const last10 = [...sessions].reverse().slice(0, 10)
  const maxWeight = sessions.length ? Math.max(...sessions.map(s => s.bestWeight)) : 0
  const recentWeights = sessions.slice(-3).map(s => s.bestWeight)
  const isPlateaued = recentWeights.length >= 3 && recentWeights.every(w => w === recentWeights[0])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14,
        padding: '52px 20px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12, background: 'var(--bg2)', color: 'var(--text)', fontSize: 18,
          border: '1px solid var(--border)',
        }}>←</button>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', letterSpacing: -0.3 }}>{exercise.name}</h1>
          <p style={{ fontSize: 11, color: 'var(--neon)', opacity: .6, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 1 }}>
            {exercise.muscle_group}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 32px', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--neon)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="fade-up" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>📊</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>No data yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Log this exercise to see your progress</p>
          </div>
        ) : (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Plateau warning */}
            {isPlateaued && (
              <div style={{
                padding: '12px 16px', borderRadius: 14,
                background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.25)',
                display: 'flex', gap: 10,
              }}>
                <span>⚠️</span>
                <p style={{ fontSize: 13, color: '#c084fc' }}>
                  Stuck at <strong>{recentWeights[0]}kg</strong> — try adding 2.5kg next session
                </p>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Sessions', value: sessions.length },
                { label: 'Max Weight', value: `${maxWeight}kg` },
                { label: 'Best Vol', value: `${Math.max(...sessions.map(s => s.totalVolume)).toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '14px 10px', textAlign: 'center',
                  borderTop: '2px solid rgba(0,255,136,.2)',
                }}>
                  <p className="grad" style={{ fontSize: 20, fontWeight: 900 }}>{value}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '.04em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                Max Weight Over Time
              </p>
              <WeightChart sessions={sessions} />
            </div>

            {/* History table */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 16px',
                background: 'var(--bg3)', borderBottom: '1px solid var(--border)',
              }}>
                {['Date','Best Set','Volume'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: h !== 'Date' ? 'right' : 'left' }}>{h}</p>
                ))}
              </div>
              {last10.map((s, i) => (
                <div key={s.date} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '12px 16px', background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{fmtDate(s.date)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{s.bestWeight}kg</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{s.totalVolume.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WeightChart({ sessions }) {
  const W = 320, H = 140
  const pL = 36, pR = 12, pT = 10, pB = 24
  const cW = W - pL - pR, cH = H - pT - pB
  const weights = sessions.map(s => s.bestWeight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const x = i => pL + (i / Math.max(sessions.length - 1, 1)) * cW
  const y = w => pT + cH - ((w - minW) / range) * cH
  const points = sessions.map((s, i) => ({ x: x(i), y: y(s.bestWeight) }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const yLabels = [minW, minW + range / 2, maxW].map(w => Math.round(w))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {yLabels.map((lbl, i) => (
        <g key={i}>
          <line x1={pL} x2={W - pR} y1={y(lbl)} y2={y(lbl)} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
          <text x={pL - 4} y={y(lbl) + 4} textAnchor="end" fontSize="9" fill="#44445a">{lbl}</text>
        </g>
      ))}

      {points.length > 1 && (
        <path d={`${pathD} L${points[points.length-1].x} ${pT+cH} L${points[0].x} ${pT+cH} Z`}
          fill="url(#chartFill)" />
      )}
      {points.length > 1 && (
        <path d={pathD} fill="none" stroke="#00ff88" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
      )}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00ff88" stroke="var(--bg2)" strokeWidth="2" filter="url(#glow)" />
      ))}

      {[0, Math.floor(sessions.length/2), sessions.length-1]
        .filter((v,i,a) => a.indexOf(v) === i && sessions[v])
        .map(i => (
          <text key={i} x={x(i)} y={H - 2} textAnchor="middle" fontSize="9" fill="#44445a">
            {fmtDate(sessions[i].date)}
          </text>
        ))
      }
    </svg>
  )
}
