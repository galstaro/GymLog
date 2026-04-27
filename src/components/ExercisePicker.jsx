import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MUSCLE_GROUPS = ['chest','back','legs','shoulders','arms','core']

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
    loadExercises()
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (creating) setTimeout(() => newNameRef.current?.focus(), 100)
  }, [creating])

  async function saveNewExercise() {
    if (!newName.trim()) return
    setSaving(true)
    const { data } = await supabase.from('exercises')
      .insert({ user_id: user.id, name: newName.trim(), muscle_group: newGroup })
      .select().single()
    if (data) {
      setExercises(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)))
      onSelect(data)
    }
    setSaving(false)
  }

  async function loadExercises() {
    const [exRes, recentRes] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
      supabase.from('sets').select('exercise_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ])
    setExercises(exRes.data || [])
    const seen = new Set(); const recents = []
    for (const s of (recentRes.data || [])) {
      if (!seen.has(s.exercise_id)) { seen.add(s.exercise_id); recents.push(s.exercise_id) }
    }
    setRecentIds(recents.slice(0, 6))
    setLoading(false)
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div onClick={onClose} style={{ flex: '0 0 60px' }} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--bg2)', borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(0,255,136,.15)', borderBottom: 'none',
        boxShadow: '0 -20px 60px rgba(0,255,136,.06)',
        overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>

        {/* Search bar */}
        <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg)', borderRadius: 14,
            border: '1px solid rgba(0,255,136,.15)',
            padding: '10px 14px',
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="var(--muted)" strokeWidth="1.5"/>
              <path d="M10 10L14 14" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search exercises…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)' }}
            />
          </div>
          <button onClick={onClose} style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: 'var(--bg3)', color: 'var(--muted)', border: '1px solid var(--border)',
          }}>
            Cancel
          </button>
        </div>

        {/* List or Create form */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {creating ? (
            <div style={{ padding: '8px 16px 32px' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--neon)', opacity: .7, marginBottom: 14 }}>New Exercise</p>

              <input
                ref={newNameRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNewExercise()}
                placeholder="Exercise name…"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, fontSize: 15, background: 'var(--bg)', border: '1px solid rgba(0,255,136,.25)', color: 'var(--text)', outline: 'none', marginBottom: 16 }}
              />

              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Muscle Group</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
                {MUSCLE_GROUPS.map(g => (
                  <button key={g} onClick={() => setNewGroup(g)} style={{
                    padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                    background: newGroup === g ? 'rgba(0,255,136,.12)' : 'var(--bg)',
                    color: newGroup === g ? 'var(--neon)' : 'var(--muted)',
                    border: newGroup === g ? '1.5px solid rgba(0,255,136,.35)' : '1px solid var(--border)',
                  }}>{g}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setCreating(false); setNewName('') }} style={{ flex: 1, padding: '13px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'var(--bg3)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Back</button>
                <button onClick={saveNewExercise} disabled={!newName.trim() || saving} style={{
                  flex: 2, padding: '13px 0', borderRadius: 12, fontWeight: 800, fontSize: 14,
                  background: newName.trim() ? 'linear-gradient(120deg,#00ff88,#00e5ff)' : 'var(--bg3)',
                  color: newName.trim() ? '#000' : 'var(--muted)',
                  opacity: saving ? .6 : 1,
                }}>{saving ? 'Saving…' : 'Add & Select'}</button>
              </div>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--neon)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            </div>
          ) : (
            <>
              {!query && recents.length > 0 && <Section title="Recent" items={recents} onSelect={onSelect} />}
              {others.length > 0
                ? <Section title={!query && recents.length > 0 ? 'All Exercises' : ''} items={others} onSelect={onSelect} />
                : <div style={{ textAlign: 'center', paddingTop: 36, color: 'var(--muted)' }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>🔍</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>No match</p>
                  </div>
              }
              {/* Create new */}
              <button onClick={() => { setCreating(true); setNewName(query) }} style={{
                width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', borderTop: '1px solid var(--border)',
                color: 'var(--neon)', fontWeight: 700, fontSize: 14,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
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
        <p style={{
          padding: '12px 16px 6px', fontSize: 10, fontWeight: 800,
          letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--neon)', opacity: .6,
        }}>{title}</p>
      )}
      {items.map((ex, i) => (
        <button key={ex.id} onClick={() => onSelect(ex)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', minHeight: 54, background: 'transparent', textAlign: 'left',
          borderTop: i === 0 && !title ? 'none' : '1px solid var(--border)',
          transition: 'background .1s',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ex.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            color: 'var(--neon)', opacity: .6, background: 'rgba(0,255,136,.08)',
            padding: '3px 8px', borderRadius: 6,
          }}>{ex.muscle_group}</span>
        </button>
      ))}
    </div>
  )
}
