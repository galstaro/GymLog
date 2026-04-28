import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, signOut } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

function getLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayStr() {
  const today = new Date()
  const day = today.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return getLocalDateStr(monday)
}

function fmtDur(secs) {
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
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

// ─── Goal Picker sheet ───────────────────────────────────────────────────────
function GoalPicker({ current, isFirstTime, onSave, onClose }) {
  const [selected, setSelected] = useState(current || 3)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  async function save() {
    setSaving(true)
    await supabase.from('user_settings').upsert({ user_id: user.id, weekly_workout_goal: selected })
    onSave(selected)
    setSaving(false)
  }

  return (
    <div
      onClick={!isFirstTime ? onClose : undefined}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: '#111', borderRadius: '20px 20px 0 0',
        border: '0.5px solid #2a2a2a', padding: '20px 20px 40px',
        animation: 'fadeUp .25s ease',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {isFirstTime ? 'Set your weekly goal' : 'Weekly workout goal'}
        </div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
          How many times do you want to train this week?
        </div>
        {/* 1–6 buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => setSelected(n)} style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: selected === n ? '#0f2d18' : '#1a1a1a',
              color: selected === n ? '#22c55e' : '#555',
              border: selected === n ? '1.5px solid #22c55e' : '0.5px solid #2a2a2a',
            }}>{n}</button>
          ))}
        </div>
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700,
          background: '#22c55e', color: '#000', minHeight: 50, opacity: saving ? .7 : 1,
        }}>
          {saving ? 'Saving…' : 'Save goal'}
        </button>
      </div>
    </div>
  )
}

// ─── Weekly Goal Card ─────────────────────────────────────────────────────────
function WeeklyGoalCard({ done, goal, weekDays, onEdit }) {
  const pct = Math.min(Math.round((done / goal) * 100), 100)
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ margin: '0 16px 14px', background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 16px 14px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>
            This Week's Goal
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 500, color: '#22c55e', lineHeight: 1 }}>{done}</span>
            <span style={{ fontSize: 18, color: '#444', fontWeight: 400 }}> / {goal}</span>
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>workouts done</div>
        </div>
        <div style={{ background: '#0f2d18', border: '0.5px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '4px 10px', fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
          {pct}%
        </div>
      </div>

      {/* 7-day dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        {weekDays.map((day, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {DAY_LABELS[i]}
            </span>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: day.trained ? '#22c55e' : day.isToday ? '#0f2d18' : day.isFuture ? '#141414' : '#1a1a1a',
              border: day.trained ? 'none' : day.isToday ? '1.5px solid #22c55e' : `0.5px solid ${day.isFuture ? '#1e1e1e' : '#222'}`,
            }}>
              {day.trained ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : day.isToday ? (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#22c55e', borderRadius: 4, transition: 'width .6s ease' }} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: '#555', flex: 1, paddingRight: 8 }}>
          {done < goal ? (
            <><span style={{ color: '#22c55e', fontWeight: 600 }}>{goal - done} more workout{goal - done !== 1 ? 's' : ''}</span> to hit your goal!</>
          ) : done === goal ? (
            <><span style={{ color: '#22c55e', fontWeight: 600 }}>Goal crushed!</span> Great week 💪</>
          ) : (
            <><span style={{ color: '#22c55e', fontWeight: 600 }}>{done - goal} above</span> your goal — beast mode 🔥</>
          )}
        </div>
        <button onClick={onEdit} style={{ border: '0.5px solid #222', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#333', background: 'transparent', flexShrink: 0 }}>
          Edit goal
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [isFirstTimeGoal, setIsFirstTimeGoal] = useState(false)

  useEffect(() => { if (user) load() }, [user, location.key])

  async function load() {
    const today = new Date()
    const monthStart = new Date(today); monthStart.setDate(1)
    const weekStart = getMondayStr()

    const [wRes, sRes] = await Promise.all([
      supabase.from('workouts').select('*')
        .eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      supabase.from('sets').select('weight_kg, reps, workout_id')
        .eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
    ])

    const settingsRes = await supabase.from('user_settings')
      .select('weekly_workout_goal').eq('user_id', user.id).maybeSingle()

    const workouts = wRes.data || []
    const sets = sRes.data || []
    const goal = settingsRes.data?.weekly_workout_goal ?? null

    const workoutDates = new Set(workouts.map(w => w.date))
    const todayStr = getLocalDateStr()

    // This week's workouts
    const workoutsThisWeek = workouts.filter(w => w.date >= weekStart).length

    // Monthly volume
    const monthVolume = Math.round(sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0))

    // 7-day dots (Mon–Sun)
    const monday = new Date(today)
    const day = today.getDay()
    monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day))
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      const dateStr = getLocalDateStr(d)
      return { trained: workoutDates.has(dateStr), isToday: dateStr === todayStr, isFuture: dateStr > todayStr }
    })

    // Recent workouts enriched
    const recentWorkouts = await Promise.all(workouts.slice(0, 5).map(async (w) => {
      const { data: wSets } = await supabase.from('sets')
        .select('exercise_id, weight_kg, reps').eq('workout_id', w.id)
      const exerciseIds = [...new Set(wSets?.map(s => s.exercise_id) || [])]
      const exerciseCount = exerciseIds.length
      const volume = wSets?.reduce((sum, s) => sum + s.weight_kg * s.reps, 0) || 0
      let title = w.notes
      if (!title && exerciseIds.length > 0) {
        const { data: exData } = await supabase.from('exercises').select('name').in('id', exerciseIds.slice(0, 2))
        title = exData?.map(e => e.name).join(' + ') || `${exerciseCount} exercises`
      } else if (!title) {
        title = 'Workout'
      }
      return { ...w, exerciseCount, volume, title }
    }))

    const enriched = recentWorkouts.map((w, i) => {
      const prev = recentWorkouts[i + 1]
      let badge = null
      if (prev && prev.volume > 0 && w.volume > 0) {
        const pct = ((w.volume - prev.volume) / prev.volume * 100)
        badge = Math.abs(pct) < 0.5 ? { type: 'same' } : { type: pct > 0 ? 'up' : 'down', pct: Math.abs(pct).toFixed(1) }
      }
      return { ...w, badge }
    })

    setData({ goal: goal ?? 3, workoutsThisWeek, weekDays, monthVolume, recentWorkouts: enriched })

    if (goal === null) {
      setIsFirstTimeGoal(true)
      setShowGoalPicker(true)
    }
  }

  function handleGoalSave(newGoal) {
    setShowGoalPicker(false)
    setIsFirstTimeGoal(false)
    setData(d => d ? { ...d, goal: newGoal } : d)
  }

  if (!data) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ width: 26, height: 26, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div style={{ flex: 1, paddingBottom: 'var(--page-pb)', background: 'var(--bg)' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px' }}>
        <div>
          <div style={{
            fontSize: 30, fontWeight: 900, letterSpacing: -1.2,
            background: 'linear-gradient(90deg, #fff 0%, #4ade80 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>GymLog</div>
          <div style={{ fontSize: 13, color: 'var(--hint)', marginTop: 1, fontWeight: 500 }}>
            Hey, <span style={{ color: 'var(--muted)' }}>{name}</span> 👋
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowProfile(p => !p)} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border-d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="2.5" stroke="#666" strokeWidth="1.5" />
              <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {showProfile && (
            <>
              <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
              <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 99, background: 'var(--surface2)', border: '1px solid var(--border-d)', borderRadius: 14, padding: 5, minWidth: 155 }}>
                <button onClick={() => { setShowProfile(false); navigate('/settings') }} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, textAlign: 'left', fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Settings</button>
                <button onClick={async () => { setShowProfile(false); await signOut() }} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, textAlign: 'left', fontSize: 14, color: '#ff4444', fontWeight: 500 }}>Sign Out</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Goal Card */}
      <WeeklyGoalCard
        done={data.workoutsThisWeek}
        goal={data.goal}
        weekDays={data.weekDays}
        onEdit={() => { setIsFirstTimeGoal(false); setShowGoalPicker(true) }}
      />

      {/* Start Workout */}
      <div style={{ margin: '0 16px 18px' }}>
        <button onClick={() => navigate('/workout/active')} style={{
          width: '100%', borderRadius: 18, padding: '0 0', minHeight: 60,
          fontSize: 18, fontWeight: 900, color: '#000', letterSpacing: -0.3,
          background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
          boxShadow: '0 0 30px rgba(34,197,94,.45), 0 0 60px rgba(34,197,94,.2), 0 8px 24px rgba(0,0,0,.5)',
          animation: 'neonPulse 2.8s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13H12L11 22l8.5-11H13L13 2z" fill="#000" />
          </svg>
          Start Workout
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 20px' }}>
        {[
          { value: data.workoutsThisWeek, label: 'This week', icon: '⚡' },
          { value: data.monthVolume.toLocaleString(), label: 'kg this month', icon: '🔥' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)',
            borderRadius: 18, border: '1px solid var(--border)',
            padding: '16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: -1.5, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--hint)', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent workouts */}
      {data.recentWorkouts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--hint)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Recent Workouts</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-s)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 16px' }}>
            {data.recentWorkouts.map(w => (
              <button key={w.id} onClick={() => navigate(`/workout/${w.id}`)} style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: `1px solid ${w.badge?.type === 'up' ? 'rgba(34,197,94,.25)' : 'var(--border)'}`,
                borderLeft: w.badge?.type === 'up' ? '3px solid #22c55e' : '1px solid var(--border)',
                padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left', width: '100%', minHeight: 66,
                boxShadow: w.badge?.type === 'up' ? '0 0 16px rgba(34,197,94,.08)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{w.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--hint)', fontWeight: 500 }}>
                    {fmtDate(w.date)}{w.duration_seconds ? ` · ${fmtDur(w.duration_seconds)}` : ''}{w.exerciseCount ? ` · ${w.exerciseCount} ex` : ''}
                  </div>
                </div>
                {w.badge && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 10,
                    background: w.badge.type === 'same' ? 'var(--surface2)' : w.badge.type === 'up' ? 'rgba(34,197,94,.12)' : 'rgba(255,68,68,.08)',
                    border: `1px solid ${w.badge.type === 'same' ? 'var(--border-d)' : w.badge.type === 'up' ? 'rgba(34,197,94,.3)' : 'rgba(255,68,68,.25)'}`,
                    color: w.badge.type === 'same' ? 'var(--hint)' : w.badge.type === 'up' ? '#22c55e' : '#ff6666',
                  }}>
                    {w.badge.type === 'same' ? 'Same' : w.badge.type === 'up' ? `+${w.badge.pct}%` : `-${w.badge.pct}%`}
                  </div>
                )}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8, flexShrink: 0 }}>
                  <path d="M6 3l5 5-5 5" stroke="var(--hint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </>
      )}

      {data.recentWorkouts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>💪</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 6 }}>No workouts yet</div>
          <div style={{ fontSize: 13, color: 'var(--hint)' }}>Hit Start Workout to begin</div>
        </div>
      )}

      <BottomNav />

      {/* Goal picker sheet */}
      {showGoalPicker && (
        <GoalPicker
          current={data.goal}
          isFirstTime={isFirstTimeGoal}
          onSave={handleGoalSave}
          onClose={() => !isFirstTimeGoal && setShowGoalPicker(false)}
        />
      )}
    </div>
  )
}
