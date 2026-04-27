import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, signOut } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

const DAY_PLANS = [
  { label: 'Day A', muscle: 'Chest + Shoulders' },
  { label: 'Day B', muscle: 'Back + Arms' },
  { label: 'Day C', muscle: 'Legs + Core' },
]

function fmtDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const today = new Date()
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6)
    const monthStart = new Date(today); monthStart.setDate(1)

    const [wRes, sRes] = await Promise.all([
      supabase.from('workouts').select('id, date, duration_seconds, notes')
        .eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      supabase.from('sets').select('weight_kg, reps, workout_id')
        .eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
    ])

    const workouts = wRes.data || []
    const sets = sRes.data || []

    // Last 7 days dots + streak
    const workoutDates = new Set(workouts.map(w => w.date))
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i))
      return workoutDates.has(d.toISOString().split('T')[0])
    })
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (workoutDates.has(d.toISOString().split('T')[0])) streak++
      else if (i > 0) break
    }

    const weekWorkouts = workouts.filter(w => w.date >= weekAgo.toISOString().split('T')[0]).length
    const monthVolume = Math.round(sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0))

    // Enrich recent workouts
    const recentRaw = workouts.slice(0, 5)
    const recentWorkouts = await Promise.all(recentRaw.map(async (w, i) => {
      const { data: wSets } = await supabase.from('sets')
        .select('exercise_id, weight_kg, reps').eq('workout_id', w.id)
      const exerciseCount = new Set(wSets?.map(s => s.exercise_id)).size
      const volume = wSets?.reduce((sum, s) => sum + s.weight_kg * s.reps, 0) || 0
      return { ...w, exerciseCount, volume }
    }))

    // Volume badges
    const enriched = recentWorkouts.map((w, i) => {
      const prev = recentWorkouts[i + 1]
      let badge = null
      if (prev && prev.volume > 0 && w.volume > 0) {
        const pct = ((w.volume - prev.volume) / prev.volume * 100)
        badge = Math.abs(pct) < 0.5
          ? { type: 'same' }
          : { type: pct > 0 ? 'up' : 'down', pct: Math.abs(pct).toFixed(1) }
      }
      return { ...w, badge }
    })

    const nextDay = DAY_PLANS[workouts.length % 3]
    setData({ streak, last7, weekWorkouts, monthVolume, recentWorkouts: enriched, nextDay })
  }

  if (!data) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  const name = user?.email?.split('@')[0] || 'there'

  return (
    <div style={{ flex: 1, paddingBottom: 80 }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>GymLog</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>Hey, {name}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowProfile(p => !p)} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="2.5" stroke="#999" strokeWidth="1.4" />
              <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#999" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          {showProfile && (
            <>
              <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
              <div style={{
                position: 'absolute', top: 44, right: 0, zIndex: 99,
                background: '#111', border: '1px solid #1e1e1e', borderRadius: 12,
                padding: 4, minWidth: 140,
              }}>
                <button onClick={async () => { setShowProfile(false); await signOut() }} style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                  fontSize: 13, color: '#ff4444', fontWeight: 500,
                }}>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Streak bar */}
      <div style={{ margin: '0 16px 12px', background: '#111', border: '1px solid #222', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: '#22c55e' }}>{data.streak}</span>
              <span style={{ fontSize: 12, color: '#555' }}>day streak</span>
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>Keep it going</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {data.last7.map((active, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#22c55e' : '#222' }} />
          ))}
        </div>
      </div>

      {/* Start Workout */}
      <div style={{ margin: '0 16px 12px' }}>
        <button onClick={() => navigate('/workout/active')} style={{
          width: '100%', background: '#22c55e', borderRadius: 14, padding: '14px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 56,
        }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#000' }}>Start Workout</span>
          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>
            {data.nextDay.label} · {data.nextDay.muscle}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#1a1a1a', margin: '4px 0 16px' }} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '0 16px 20px' }}>
        {[
          { value: data.weekWorkouts, label: 'Workouts this week' },
          { value: data.monthVolume.toLocaleString(), label: 'kg lifted this month' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#111', borderRadius: 12, border: '1px solid #1e1e1e', padding: '12px 14px' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent workouts */}
      {data.recentWorkouts.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 16px 10px' }}>
            Recent Workouts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 16px' }}>
            {data.recentWorkouts.map(w => (
              <button key={w.id} onClick={() => navigate(`/workout/${w.id}`)} style={{
                background: '#111', borderRadius: 12, border: '1px solid #1e1e1e',
                padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left', width: '100%', minHeight: 56,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>
                    {w.notes || `${w.exerciseCount} exercise${w.exerciseCount !== 1 ? 's' : ''}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                    {fmtDate(w.date)}{w.duration_seconds ? ` · ${fmtDuration(w.duration_seconds)}` : ''}{w.exerciseCount ? ` · ${w.exerciseCount} exercises` : ''}
                  </div>
                </div>
                {w.badge && (
                  <div style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 8, flexShrink: 0, marginLeft: 8,
                    background: w.badge.type === 'same' ? '#1a1a1a' : w.badge.type === 'up' ? '#0f2d18' : 'rgba(255,68,68,.08)',
                    border: `1px solid ${w.badge.type === 'same' ? '#2a2a2a' : w.badge.type === 'up' ? 'rgba(34,197,94,.2)' : 'rgba(255,68,68,.2)'}`,
                    color: w.badge.type === 'same' ? '#555' : w.badge.type === 'up' ? '#22c55e' : '#ff6666',
                    whiteSpace: 'nowrap',
                  }}>
                    {w.badge.type === 'same' ? 'Same' : w.badge.type === 'up' ? `+${w.badge.pct}% vol` : `-${w.badge.pct}% vol`}
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
