import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function Chart({ sessions }) {
  if (sessions.length < 2) return null
  const W = 308, H = 120
  const padL = 30, padR = 10, padT = 14, padB = 22
  const cW = W - padL - padR, cH = H - padT - padB

  const weights = sessions.map(s => s.maxWeight)
  const rawMin = Math.min(...weights), rawMax = Math.max(...weights)
  const spread = rawMax - rawMin || 10
  const minW = rawMin - spread * 0.2, maxW = rawMax + spread * 0.2

  const timestamps = sessions.map(s => new Date(s.date).getTime())
  const minT = Math.min(...timestamps), maxT = Math.max(...timestamps)
  const rangeT = maxT - minT || 1

  const px = s => padL + ((new Date(s.date).getTime() - minT) / rangeT) * cW
  const py = s => padT + (1 - (s.maxWeight - minW) / (maxW - minW)) * cH

  const pointsStr = sessions.map(s => `${px(s)},${py(s)}`).join(' ')
  const last = sessions[sessions.length - 1]
  const areaD = `M ${sessions.map(s => `${px(s)},${py(s)}`).join(' L ')} L ${px(last)},${padT + cH} L ${px(sessions[0])},${padT + cH} Z`

  const prSession = sessions.reduce((a, b) => a.maxWeight >= b.maxWeight ? a : b)

  // Y grid: 3 levels
  const gridLevels = [0, 0.5, 1].map(t => ({ y: padT + (1 - t) * cH, w: Math.round(minW + t * (maxW - minW)) }))

  // X labels: up to 4 months
  const xLabels = []
  const seen = new Set()
  for (const s of sessions) {
    const d = new Date(s.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!seen.has(key)) {
      seen.add(key)
      xLabels.push({ x: px(s), label: MONTHS[d.getMonth()] })
    }
  }
  // Add "Today" for last point
  if (xLabels.length > 0) xLabels[xLabels.length - 1].label = 'Today'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {gridLevels.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#1a1a1a" strokeWidth="0.5" />
          <text x={padL - 4} y={g.y + 3} fill="#333" fontSize="9" textAnchor="end">{g.w}</text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.slice(0, 5).map((l, i) => (
        <text key={i} x={Math.min(l.x, W - padR - 10)} y={H - 4} fill="#333" fontSize="8" textAnchor="middle">{l.label}</text>
      ))}

      {/* Area */}
      <path d={areaD} fill="url(#ag)" />

      {/* Line */}
      <polyline points={pointsStr} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Dots */}
      {sessions.map((s, i) => {
        const isPR = s.date === prSession.date && s.maxWeight === prSession.maxWeight
        return (
          <circle key={i} cx={px(s)} cy={py(s)} r={isPR ? 5 : 3.5} fill="#22c55e"
            stroke={isPR ? '#0f2d18' : 'none'} strokeWidth={isPR ? 2 : 0}
            filter={isPR ? 'url(#glow)' : undefined}
          />
        )
      })}
    </svg>
  )
}

export default function ExerciseProgress() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user, id])

  async function load() {
    const [exRes, setsRes] = await Promise.all([
      supabase.from('exercises').select('*').eq('id', id).single(),
      supabase.from('sets').select('weight_kg, reps, workout_id, created_at, workouts(date)')
        .eq('user_id', user.id).eq('exercise_id', id)
        .order('created_at', { ascending: true }),
    ])
    setExercise(exRes.data)

    // Group by workout date, compute max weight + volume per session
    const byWorkout = {}
    for (const s of (setsRes.data || [])) {
      const date = s.workouts?.date || s.created_at?.split('T')[0]
      if (!byWorkout[date]) byWorkout[date] = { date, sets: [], maxWeight: 0, volume: 0 }
      byWorkout[date].sets.push(s)
      byWorkout[date].maxWeight = Math.max(byWorkout[date].maxWeight, s.weight_kg)
      byWorkout[date].volume += s.weight_kg * s.reps
    }
    setSessions(Object.values(byWorkout).sort((a, b) => a.date.localeCompare(b.date)))
    setLoading(false)
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  const pr = sessions.length ? Math.max(...sessions.map(s => s.maxWeight)) : null

  return (
    <div style={{ flex: 1, paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#fff' }}>{exercise?.name}</div>
          <div style={{ fontSize: 12, color: '#555', textTransform: 'capitalize', marginTop: 1 }}>{exercise?.muscle_group}</div>
        </div>
      </div>

      {pr !== null && (
        <div style={{ margin: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#0f2d18', border: '1px solid rgba(34,197,94,.18)', color: '#22c55e' }}>
            Personal Record: {pr} kg
          </span>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#555', margin: '0 16px 12px' }}>Max weight over time</div>

      {/* Chart */}
      <div style={{ margin: '0 16px 20px', background: '#111', borderRadius: 14, border: '1px solid #1e1e1e', padding: '12px 8px 8px' }}>
        {sessions.length >= 2 ? (
          <Chart sessions={sessions} />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#444', fontSize: 13 }}>
            Not enough data yet
          </div>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 16px 10px' }}>
            History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 16px' }}>
            {[...sessions].reverse().map((s, i) => (
              <div key={i} style={{ background: '#111', borderRadius: 10, border: '1px solid #1e1e1e', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden' }}>
                {[
                  { label: 'Date', value: new Date(s.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }), color: '#aaa' },
                  { label: 'Max', value: `${s.maxWeight} kg`, color: '#fff', bold: true },
                  { label: 'Volume', value: `${Math.round(s.volume)} kg`, color: '#22c55e' },
                ].map((col, ci) => (
                  <div key={ci} style={{ padding: '10px 12px', borderRight: ci < 2 ? '1px solid #1e1e1e' : 'none' }}>
                    <div style={{ fontSize: 10, color: '#333', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 3 }}>{col.label}</div>
                    <div style={{ fontSize: 12, color: col.color, fontWeight: col.bold ? 500 : 400 }}>{col.value}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
