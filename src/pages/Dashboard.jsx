import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signOut } from '../hooks/useAuth.jsx'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MUSCLE_GROUPS = ['chest','back','legs','shoulders','arms','core']

function fmtDate(d) {
  const date = new Date(d + 'T12:00:00')
  return `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`
}
function fmtDuration(mins) {
  if (!mins) return '—'
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
}

export default function Dashboard({ user, onStartWorkout, onViewExercise }) {
  const [tab, setTab] = useState('workouts')
  const [workouts, setWorkouts] = useState([])
  const [exercises, setExercises] = useState([])
  const [stats, setStats] = useState({ week: 0, month: 0, totalVolume: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [deletingWorkout, setDeletingWorkout] = useState(null)

  useEffect(() => { loadData() }, [user.id])

  async function loadData() {
    setLoading(true)
    try {
      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const [wRes, eRes, wkRes, moRes] = await Promise.all([
        supabase.from('workouts').select('*, sets(id, weight_kg, reps, exercise_id, exercises(name))').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
        supabase.from('exercises').select('*, sets(id, created_at)').eq('user_id', user.id).order('name'),
        supabase.from('workouts').select('id', { count: 'exact' }).eq('user_id', user.id).gte('date', weekStart.toISOString().split('T')[0]),
        supabase.from('workouts').select('id', { count: 'exact' }).eq('user_id', user.id).gte('date', monthStart.toISOString().split('T')[0]),
      ])
      setWorkouts(wRes.data || [])
      setExercises(eRes.data || [])
      const vol = (wRes.data || []).reduce((s, w) => s + (w.sets||[]).reduce((ss,x) => ss + x.weight_kg * x.reps, 0), 0)
      setStats({ week: wkRes.count || 0, month: moRes.count || 0, totalVolume: Math.round(vol) })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function deleteWorkout(workoutId) {
    await supabase.from('sets').delete().eq('workout_id', workoutId)
    await supabase.from('workouts').delete().eq('id', workoutId)
    setWorkouts(prev => prev.filter(w => w.id !== workoutId))
    setDeletingWorkout(null)
  }

  async function addExercise(name, muscleGroup) {
    const { data } = await supabase.from('exercises').insert({ user_id: user.id, name, muscle_group: muscleGroup }).select().single()
    if (data) setExercises(prev => [...prev, { ...data, sets: [] }].sort((a,b) => a.name.localeCompare(b.name)))
    setShowAddExercise(false)
  }

  function workoutVolume(w) { return (w.sets||[]).reduce((s,x) => s + x.weight_kg * x.reps, 0) }
  function workoutExNames(w) {
    const seen = new Set(), out = []
    for (const s of (w.sets||[])) {
      if (!seen.has(s.exercise_id)) { seen.add(s.exercise_id); out.push(s.exercises?.name || '?') }
    }
    return out
  }
  function lastUsed(ex) {
    if (!ex.sets?.length) return null
    const latest = ex.sets.reduce((a,b) => new Date(a.created_at) > new Date(b.created_at) ? a : b)
    const days = Math.round((Date.now() - new Date(latest.created_at)) / 86400000)
    return days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`
  }

  const today = new Date()
  const todayStr = `${DAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, background: 'var(--bg)', paddingTop: 52 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
          <div>
            <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '.12em', textTransform: 'uppercase' }}>{todayStr}</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.5, marginTop: 2 }}>
              Good {greeting()} 👋
            </h1>
          </div>
          <button onClick={signOut} style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'var(--bg3)', color: '#9ca3af', border: '1px solid rgba(255,255,255,.1)',
          }}>Sign out</button>
        </div>

        {/* Hero stat — weekly sessions */}
        <div style={{
          margin: '0 20px 14px', borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #0a1f12 0%, #07070f 60%)',
          border: '1px solid rgba(0,255,136,.18)',
          boxShadow: '0 0 40px rgba(0,255,136,.06)',
          padding: '20px 20px 18px',
        }}>
          {/* Decorative glow blob */}
          <div style={{
            position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,136,.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(0,255,136,.6)', marginBottom: 6 }}>
            This Week
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
            <span style={{
              fontSize: 64, fontWeight: 900, lineHeight: .9, letterSpacing: -3,
              color: '#00ff88', textShadow: '0 0 30px rgba(0,255,136,.5)',
            }}>{stats.week}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,255,136,.5)', marginBottom: 8, letterSpacing: '.04em' }}>
              {stats.week === 1 ? 'SESSION' : 'SESSIONS'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{stats.month}</p>
              <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 1 }}>This month</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.06)' }} />
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>
                {stats.totalVolume > 0 ? `${(stats.totalVolume/1000).toFixed(1)}t` : '—'}
              </p>
              <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 1 }}>Total vol.</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <button onClick={onStartWorkout} className="pulse" style={{
            width: '100%', padding: '18px 0', borderRadius: 16, fontWeight: 900,
            fontSize: 17, letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'linear-gradient(120deg, #00ff88 0%, #00e5ff 100%)', color: '#000',
          }}>⚡ Start Workout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex' }}>
          {[['workouts','History'],['exercises','Exercises']].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '12px 0', marginRight: 24, fontSize: 13, fontWeight: 700,
              letterSpacing: '.04em', textTransform: 'uppercase', background: 'none',
              color: tab === key ? 'var(--neon)' : '#6b7280',
              borderBottom: tab === key ? '2px solid var(--neon)' : '2px solid transparent',
            }}>{lbl}</button>
          ))}
        </div>
        {tab === 'exercises' && (
          <button onClick={() => setShowAddExercise(true)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: 'rgba(0,255,136,.1)', color: 'var(--neon)',
            border: '1px solid rgba(0,255,136,.2)',
          }}>+ New</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 32px', WebkitOverflowScrolling: 'touch' }}>
        {loading
          ? <Spinner />
          : tab === 'workouts'
            ? <WorkoutsList workouts={workouts} getVolume={workoutVolume} getExNames={workoutExNames} deletingId={deletingWorkout} onDeleteRequest={setDeletingWorkout} onDeleteConfirm={deleteWorkout} />
            : <ExercisesList exercises={exercises} getLastUsed={lastUsed} onView={onViewExercise} />
        }
      </div>

      {showAddExercise && <AddExerciseModal onSave={addExercise} onClose={() => setShowAddExercise(false)} />}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--neon)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )
}

function WorkoutsList({ workouts, getVolume, getExNames, deletingId, onDeleteRequest, onDeleteConfirm }) {
  if (!workouts.length) return (
    <div style={{ textAlign: 'center', paddingTop: 56, color: '#6b7280' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
      <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>No workouts yet</p>
      <p style={{ fontSize: 13, marginTop: 6 }}>Hit Start Workout to begin</p>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="fade-up">
      {workouts.map(w => {
        const exs = getExNames(w), vol = getVolume(w)
        const isDeleting = deletingId === w.id
        return (
          <div key={w.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', borderLeft: '3px solid rgba(0,255,136,.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{fmtDate(w.date)}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDuration(w.duration_minutes)}</span>
                </div>
                {exs.length > 0 && <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{exs.slice(0,4).join(' · ')}{exs.length > 4 ? ` +${exs.length-4}` : ''}</p>}
                {vol > 0 && <p style={{ fontSize: 12 }}>Vol: <span style={{ color: 'var(--neon)', fontWeight: 700 }}>{vol.toLocaleString()}kg</span></p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                {isDeleting ? (
                  <>
                    <button onClick={() => onDeleteConfirm(w.id)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: 'var(--red)', color: '#fff' }}>Delete</button>
                    <button onClick={() => onDeleteRequest(null)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: 'var(--bg3)', color: '#6b7280', border: '1px solid var(--border)' }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => onDeleteRequest(w.id)} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,45,85,.08)', color: 'var(--red)', fontSize: 15 }}>🗑</button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ExercisesList({ exercises, getLastUsed, onView }) {
  const ORDER = ['chest','back','legs','shoulders','arms','core']
  const grouped = {}
  for (const e of exercises) {
    if (!grouped[e.muscle_group]) grouped[e.muscle_group] = []
    grouped[e.muscle_group].push(e)
  }
  if (!exercises.length) return (
    <div style={{ textAlign: 'center', paddingTop: 56, color: '#6b7280' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>💪</div>
      <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>No exercises yet</p>
      <p style={{ fontSize: 13, marginTop: 6 }}>Tap "+ New" to add your first exercise</p>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-up">
      {ORDER.filter(m => grouped[m]?.length).map(group => (
        <div key={group}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--neon)', marginBottom: 8, opacity: .7 }}>{group}</p>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {grouped[group].map((ex, i) => (
              <button key={ex.id} onClick={() => onView(ex)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '14px 16px', minHeight: 52,
                background: 'var(--bg2)', textAlign: 'left',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{ex.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getLastUsed(ex) && <span style={{ fontSize: 11, color: '#6b7280' }}>{getLastUsed(ex)}</span>}
                  <span style={{ color: '#6b7280', fontSize: 16 }}>›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AddExerciseModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('chest')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), group)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'var(--bg2)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(0,255,136,.15)', borderBottom: 'none', padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 20 }}>New Exercise</h2>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Exercise Name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Cable Fly"
          style={{ width: '100%', padding: '13px 14px', borderRadius: 12, fontSize: 15, background: 'var(--bg)', border: '1px solid rgba(0,255,136,.2)', color: 'var(--text)', outline: 'none', marginBottom: 16 }}
        />

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 10 }}>Muscle Group</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
          {MUSCLE_GROUPS.map(g => (
            <button key={g} onClick={() => setGroup(g)} style={{
              padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
              background: group === g ? 'rgba(0,255,136,.12)' : 'var(--bg)',
              color: group === g ? 'var(--neon)' : '#6b7280',
              border: group === g ? '1.5px solid rgba(0,255,136,.35)' : '1px solid var(--border)',
            }}>{g}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, background: 'var(--bg3)', color: '#6b7280', border: '1px solid var(--border)' }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || saving} className={name.trim() ? 'glow-sm' : ''} style={{
            flex: 2, padding: '14px 0', borderRadius: 14, fontWeight: 800, fontSize: 15,
            background: name.trim() ? 'linear-gradient(120deg,#00ff88,#00e5ff)' : 'var(--bg3)',
            color: name.trim() ? '#000' : '#6b7280', opacity: saving ? .6 : 1,
          }}>{saving ? 'Saving…' : 'Add Exercise'}</button>
        </div>
      </div>
    </div>
  )
}
