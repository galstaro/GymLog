import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

const GROUPS = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core']

export default function ExerciseList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    const { data } = await supabase.from('exercises').select('*').eq('user_id', user.id).order('name')
    setExercises(data || [])
    setLoading(false)
  }

  const visible = exercises.filter(e =>
    (filter === 'all' || e.muscle_group === filter) &&
    e.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ flex: 1, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>Exercises</div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>Tap to view progress</div>
      </div>

      {/* Search */}
      <div style={{ margin: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 10, border: '1px solid #1e1e1e', padding: '10px 12px' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#444" strokeWidth="1.5" />
          <path d="M10 10L14 14" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff' }}
        />
      </div>

      {/* Muscle group filter */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {GROUPS.map(g => (
          <button key={g} onClick={() => setFilter(g)} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            textTransform: g === 'all' ? 'none' : 'capitalize', whiteSpace: 'nowrap', flexShrink: 0,
            background: filter === g ? '#22c55e' : '#111',
            color: filter === g ? '#000' : '#555',
            border: `1px solid ${filter === g ? '#22c55e' : '#1e1e1e'}`,
          }}>
            {g === 'all' ? 'All' : g}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <div style={{ width: 22, height: 22, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 16px' }}>
          {visible.map(ex => (
            <button key={ex.id} onClick={() => navigate(`/exercise/${ex.id}`)} style={{
              background: '#111', borderRadius: 12, border: '1px solid #1e1e1e',
              padding: '13px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              textAlign: 'left', width: '100%', minHeight: 48,
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>{ex.name}</span>
              <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', background: '#1a1a1a', padding: '2px 7px', borderRadius: 6 }}>
                {ex.muscle_group}
              </span>
            </button>
          ))}
          {visible.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 32, color: '#444', fontSize: 13 }}>No exercises found</div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
