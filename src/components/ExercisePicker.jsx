import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

export default function ExercisePicker({ user, onSelect, onClose, existingIds = [] }) {
  const [exercises, setExercises] = useState([])
  const [recentIds, setRecentIds] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState('chest')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const newNameRef = useRef(null)

  useEffect(() => {
    load()
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (creating) setTimeout(() => newNameRef.current?.focus(), 100)
  }, [creating])

  async function load() {
    const [exRes, recentRes] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
      supabase.from('sets').select('exercise_id, created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50),
    ])
    setExercises(exRes.data || [])
    const seen = new Set(); const recents = []
    for (const s of (recentRes.data || [])) {
      if (!seen.has(s.exercise_id)) { seen.add(s.exercise_id); recents.push(s.exercise_id) }
    }
    setRecentIds(recents.slice(0, 6))
    setLoading(false)
  }

  async function saveNew() {
    if (!newName.trim()) return
    setSaving(true)
    const { data } = await supabase.from('exercises')
      .insert({ user_id: user.id, name: newName.trim(), muscle_group: newGroup })
      .select().single()
    if (data) { setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); onSelect(data) }
    setSaving(false)
  }

  const filtered = exercises.filter(e =>
    !existingIds.includes(e.id) && e.name.toLowerCase().includes(query.toLowerCase())
  )
  const recents = recentIds.map(id => exercises.find(e => e.id === id)).filter(Boolean)
    .filter(e => !existingIds.includes(e.id))
    .filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
  const recentSet = new Set(recents.map(e => e.id))
  const others = filtered.filter(e => !recentSet.has(e.id))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.75)', display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ flex: '0 0 60px' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111', borderRadius: '16px 16px 0 0', border: '1px solid #1e1e1e', borderBottom: 'none', overflow: 'hidden' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 32, height: 3, borderRadius: 99, background: '#2a2a2a' }} />
        </div>

        {/* Search */}
        <div style={{ padding: '8px 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#0a0a0a', borderRadius: 10, border: '1px solid #1e1e1e', padding: '10px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#444" strokeWidth="1.5" />
              <path d="M10 10L14 14" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search exercises…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff' }}
            />
          </div>
          <button onClick={onClose} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: '#1a1a1a', color: '#555', border: '1px solid #1e1e1e' }}>
            Cancel
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {creating ? (
            <div style={{ padding: '8px 16px 32px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 14 }}>New Exercise</p>
              <input
                ref={newNameRef}
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNew()}
                placeholder="Exercise name…"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', marginBottom: 16 }}
              />
              <p style={{ fontSize: 11, color: '#444', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Muscle Group</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
                {MUSCLE_GROUPS.map(g => (
                  <button key={g} onClick={() => setNewGroup(g)} style={{
                    padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                    background: newGroup === g ? 'rgba(34,197,94,.1)' : '#0a0a0a',
                    color: newGroup === g ? '#22c55e' : '#555',
                    border: newGroup === g ? '1px solid rgba(34,197,94,.3)' : '1px solid #1e1e1e',
                  }}>{g}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCreating(false); setNewName('') }} style={{ flex: 1, padding: 13, borderRadius: 10, fontWeight: 500, fontSize: 14, background: '#1a1a1a', color: '#555', border: '1px solid #1e1e1e' }}>
                  Back
                </button>
                <button onClick={saveNew} disabled={!newName.trim() || saving} style={{
                  flex: 2, padding: 13, borderRadius: 10, fontWeight: 500, fontSize: 14,
                  background: newName.trim() ? '#22c55e' : '#1a1a1a',
                  color: newName.trim() ? '#000' : '#555',
                  opacity: saving ? .6 : 1,
                }}>{saving ? 'Saving…' : 'Add & Select'}</button>
              </div>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div style={{ width: 22, height: 22, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            </div>
          ) : (
            <>
              {!query && recents.length > 0 && <Section title="Recent" items={recents} onSelect={onSelect} />}
              {others.length > 0
                ? <Section title={!query && recents.length > 0 ? 'All Exercises' : ''} items={others} onSelect={onSelect} />
                : <div style={{ textAlign: 'center', paddingTop: 36, color: '#555' }}>
                    <p style={{ fontSize: 13 }}>No match</p>
                  </div>
              }
              <button onClick={() => { setCreating(true); setNewName(query) }} style={{
                width: '100%', padding: '14px 16px', borderTop: '1px solid #1e1e1e',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: '#22c55e', fontWeight: 500, fontSize: 13, minHeight: 48,
              }}>
                <span style={{ fontSize: 16 }}>+</span>
                {query ? `Create "${query}"` : 'Create new exercise'}
              </button>
            </>
          )}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, items, onSelect }) {
  return (
    <div>
      {title && (
        <p style={{ padding: '10px 16px 4px', fontSize: 11, color: '#444', letterSpacing: '.07em', textTransform: 'uppercase' }}>{title}</p>
      )}
      {items.map((ex, i) => (
        <button key={ex.id} onClick={() => onSelect(ex)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', minHeight: 48, textAlign: 'left',
          borderTop: i === 0 && !title ? 'none' : '1px solid #1a1a1a',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>{ex.name}</span>
          <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', background: '#1a1a1a', padding: '2px 7px', borderRadius: 6 }}>
            {ex.muscle_group}
          </span>
        </button>
      ))}
    </div>
  )
}
