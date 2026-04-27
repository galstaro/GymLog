import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

function fmtDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function WorkoutDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { if (user) load() }, [user, id])

  async function load() {
    const [wRes, sRes] = await Promise.all([
      supabase.from('workouts').select('*').eq('id', id).single(),
      supabase.from('sets').select('*, exercises(name, muscle_group)')
        .eq('workout_id', id).order('created_at'),
    ])
    setWorkout(wRes.data)

    // Group sets by exercise
    const map = {}
    for (const s of (sRes.data || [])) {
      const eid = s.exercise_id
      if (!map[eid]) map[eid] = { exercise: s.exercises, sets: [] }
      map[eid].sets.push(s)
    }
    setBlocks(Object.values(map))
    setLoading(false)
  }

  async function deleteWorkout() {
    setDeleting(true)
    await supabase.from('sets').delete().eq('workout_id', id)
    await supabase.from('workouts').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  const dateStr = workout?.date
    ? new Date(workout.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  const totalVolume = blocks.flatMap(b => b.sets).reduce((sum, s) => sum + s.weight_kg * s.reps, 0)

  return (
    <div style={{ flex: 1, paddingBottom: 90 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#fff' }}>Workout</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{dateStr}</div>
          </div>
        </div>
        <button onClick={() => setDeleteConfirm(true)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#ff4444', border: '1px solid rgba(255,68,68,.2)', background: 'rgba(255,68,68,.08)', minHeight: 36 }}>
          Delete
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '0 16px 20px' }}>
        {[
          { label: 'Exercises', value: blocks.length },
          { label: 'Duration', value: workout?.duration_seconds ? fmtDuration(workout.duration_seconds) : '—' },
          { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()} kg` },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', borderRadius: 12, border: '1px solid #1e1e1e', padding: '10px 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Exercise blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0 16px' }}>
        {blocks.map((block, bi) => (
          <div key={bi} style={{ background: '#111', borderRadius: 14, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <button onClick={() => navigate(`/exercise/${block.sets[0].exercise_id}`)} style={{ fontSize: 14, fontWeight: 500, color: '#fff', textAlign: 'left' }}>
                  {block.exercise?.name}
                </button>
              </div>
              <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', background: '#1a1a1a', padding: '2px 7px', borderRadius: 6 }}>
                {block.exercise?.muscle_group}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Set', 'kg', 'Reps', 'Volume'].map((h, i) => (
                    <th key={i} style={{ padding: '4px 14px', fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.sets.map((s, si) => (
                  <tr key={si} style={{ borderTop: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: '#444' }}>{si + 1}</td>
                    <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#ddd' }}>{s.weight_kg}</td>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: '#22c55e' }}>{s.reps}</td>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: '#555' }}>{Math.round(s.weight_kg * s.reps)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Delete confirmation sheet */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#141414', borderRadius: '20px 20px 0 0', padding: '28px 20px 48px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Delete workout?</div>
            <div style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>This will permanently delete the workout and all its sets.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 600, background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a', minHeight: 52 }}>
                Cancel
              </button>
              <button onClick={deleteWorkout} disabled={deleting} style={{ flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: 'rgba(255,68,68,.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,.2)', minHeight: 52, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
