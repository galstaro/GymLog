import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function Chart({ sessions }) {
  if (sessions.length < 2) return null
  const W = 308, H = 130
  const padL = 34, padR = 12, padT = 14, padB = 22
  const cW = W - padL - padR, cH = H - padT - padB

  const weights = sessions.map(s => s.maxWeight)
  const rawMin = Math.min(...weights), rawMax = Math.max(...weights)
  const spread = rawMax - rawMin || 10
  const minW = Math.floor((rawMin - spread * 0.3) / 5) * 5
  const maxW = Math.ceil((rawMax + spread * 0.2) / 5) * 5

  const timestamps = sessions.map(s => new Date(s.date).getTime())
  const minT = Math.min(...timestamps), maxT = Math.max(...timestamps)
  const rangeT = maxT - minT || 1

  const px = s => padL + ((new Date(s.date).getTime() - minT) / rangeT) * cW
  const py = s => padT + (1 - (s.maxWeight - minW) / (maxW - minW)) * cH

  const pts = sessions.map(s => `${px(s)},${py(s)}`)
  const last = sessions[sessions.length - 1]
  const areaD = `M ${pts.join(' L ')} L ${px(last)},${padT + cH} L ${px(sessions[0])},${padT + cH} Z`

  const prSession = sessions.reduce((a, b) => a.maxWeight >= b.maxWeight ? a : b)

  // Y grid: 3 levels
  const gridLevels = [0, 0.5, 1].map(t => ({
    y: padT + (1 - t) * cH,
    w: Math.round(minW + t * (maxW - minW))
  }))

  // X labels: first unique month per occurrence + "Today" for last
  const xLabels = []
  const seenMonths = new Set()
  sessions.forEach((s, i) => {
    const d = new Date(s.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!seenMonths.has(key)) {
      seenMonths.add(key)
      xLabels.push({ x: px(s), label: MONTHS[d.getMonth()] })
    }
  })
  // Replace last label with "Today"
  if (xLabels.length > 0) {
    xLabels[xLabels.length - 1] = { x: px(last), label: 'Today' }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {gridLevels.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#1e1e1e" strokeWidth="0.5" />
          <text x={padL - 5} y={g.y + 3.5} fill="#333" fontSize="9" textAnchor="end" fontFamily="monospace">{g.w}</text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={Math.max(padL + 4, Math.min(l.x, W - padR - 12))} y={H - 5} fill="#333" fontSize="8" textAnchor="middle">{l.label}</text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#ag2)" />

      {/* Line */}
      <polyline points={pts.join(' ')} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Dots */}
      {sessions.map((s, i) => {
        const isPR = s.date === prSession.date && s.maxWeight === prSession.maxWeight
        return (
          <circle key={i} cx={px(s)} cy={py(s)}
            r={isPR ? 5.5 : 3.5} fill="#22c55e"
            stroke={isPR ? '#0f2d18' : 'none'} strokeWidth={isPR ? 2.5 : 0}
            filter={isPR ? 'url(#glow2)' : undefined}
          />
        )
      })}
    </svg>
  )
}

function fmtSessionDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Today'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
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
    <div style={{ flex: 1, paddingBottom: 80, background: '#0a0a0a' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>{exercise?.name}</div>
          <div style={{ fontSize: 12, color: '#555', textTransform: 'capitalize', marginTop: 2 }}>{exercise?.muscle_group}</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* PR badge */}
      {pr !== null && (
        <div style={{ margin: '0 20px 6px' }}>
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: '#22c55e', fontWeight: 500 }}>
            Personal Record: {pr} kg
          </span>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#555', margin: '0 20px 16px' }}>Max weight over time</div>

      {/* Chart */}
      <div style={{ margin: '0 16px 24px', background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: '14px 10px 10px' }}>
        {sessions.length >= 2 ? (
          <Chart sessions={sessions} />
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#333', fontSize: 13 }}>
            Log at least 2 sessions to see the chart
          </div>
        )}
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...sessions].reverse().map((s, i) => (
            <div key={i} style={{ background: '#111', borderRadius: 12, border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '12px 14px', borderRight: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: 12, color: '#aaa' }}>{fmtSessionDate(s.date)}</div>
              </div>
              <div style={{ flex: 1, padding: '12px 14px', borderRight: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{s.maxWeight} kg</div>
              </div>
              <div style={{ flex: 1, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>{Math.round(s.volume).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
