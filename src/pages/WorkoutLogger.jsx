import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'

const REST_TOTAL = 90
let lid = 0
const mkSet = (w = 0, r = 0) => ({ lid: ++lid, weight: w, reps: r, done: false })

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function VolBadge({ current, prev }) {
  if (!prev || !current) return null
  const pct = ((current - prev) / prev * 100)
  if (Math.abs(pct) < 0.5) return (
    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555' }}>Same</span>
  )
  const up = pct > 0
  return (
    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: up ? '#0f2d18' : 'rgba(255,68,68,.08)', border: `1px solid ${up ? 'rgba(34,197,94,.18)' : 'rgba(255,68,68,.2)'}`, color: up ? '#22c55e' : '#ff6666' }}>
      {up ? '+' : ''}{pct.toFixed(1)}% vol
    </span>
  )
}

function StuckBanner({ name, weight }) {
  return (
    <div style={{ margin: '0 16px', background: '#1f1800', border: '1px solid #ba7517', borderRadius: 12, padding: '11px 14px' }}>
      <div style={{ fontSize: 12, color: '#EF9F27', lineHeight: 1.5 }}>
        <span style={{ fontSize: 16, marginRight: 6 }}>⚡</span>
        {name} stuck at {weight} kg for 3+ sessions
      </div>
      <div style={{ fontSize: 11, color: '#ba7517', marginTop: 4 }}>
        Try {(weight + 2.5).toFixed(1)} kg × 5 reps this session →
      </div>
    </div>
  )
}

export default function WorkoutLogger() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState([])
  const [rest, setRest] = useState(null) // { remaining, total }
  const [elapsed, setElapsed] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const workoutIdRef = useRef(null)
  const creatingRef = useRef(null)
  const startRef = useRef(Date.now())

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  // Rest countdown
  useEffect(() => {
    if (!rest) return
    if (rest.remaining <= 0) {
      if (navigator.vibrate) navigator.vibrate(200)
      setRest(null)
      return
    }
    const id = setTimeout(() => setRest(r => r ? { ...r, remaining: r.remaining - 1 } : null), 1000)
    return () => clearTimeout(id)
  }, [rest])

  async function getOrCreateWorkout() {
    if (workoutIdRef.current) return workoutIdRef.current
    if (creatingRef.current) return creatingRef.current
    creatingRef.current = (async () => {
      const { data } = await supabase.from('workouts').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
      }).select('id').single()
      workoutIdRef.current = data.id
      creatingRef.current = null
      return data.id
    })()
    return creatingRef.current
  }

  async function addExercise(exercise) {
    setPickerOpen(false)
    const block = { exercise, sets: [mkSet()], lastSets: [], prevVolume: 0, stuck: null }
    setBlocks(prev => [...prev, block])

    // Fetch last session + stuck check in parallel
    const [lastRes, stuckRes] = await Promise.all([
      supabase.from('sets').select('weight_kg, reps, workout_id')
        .eq('user_id', user.id).eq('exercise_id', exercise.id)
        .order('created_at', { ascending: false }).limit(30),
      checkStuck(user.id, exercise.id),
    ])

    const allSets = lastRes.data || []
    let lastSets = []
    let prefillWeight = 0, prefillReps = 0, prevVolume = 0

    if (allSets.length) {
      const lastWid = allSets[0].workout_id
      lastSets = allSets.filter(s => s.workout_id === lastWid)
      const lastSet = lastSets[lastSets.length - 1]
      prefillWeight = lastSet.weight_kg
      prefillReps = lastSet.reps
      prevVolume = lastSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
    }

    setBlocks(prev => prev.map(b => b.exercise.id === exercise.id
      ? { ...b, lastSets, prevVolume, stuck: stuckRes, sets: [mkSet(prefillWeight, prefillReps)] }
      : b
    ))
  }

  async function checkStuck(userId, exerciseId) {
    const { data } = await supabase.from('sets')
      .select('weight_kg, workout_id')
      .eq('user_id', userId).eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false }).limit(60)
    if (!data?.length) return null
    const byWorkout = {}
    for (const s of data) {
      if (!byWorkout[s.workout_id]) byWorkout[s.workout_id] = []
      byWorkout[s.workout_id].push(s.weight_kg)
    }
    const sessions = Object.values(byWorkout).map(arr => Math.max(...arr))
    if (sessions.length >= 3 && sessions[0] === sessions[1] && sessions[1] === sessions[2]) {
      return { weight: sessions[0] }
    }
    return null
  }

  async function logSet(bi, si) {
    const set = blocks[bi].sets[si]
    if (!set.weight || !set.reps || set.done) return
    const workoutId = await getOrCreateWorkout()
    await supabase.from('sets').insert({
      user_id: user.id, workout_id: workoutId,
      exercise_id: blocks[bi].exercise.id,
      set_number: si + 1, weight_kg: set.weight, reps: set.reps,
    })
    setBlocks(prev => prev.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => j !== si ? s : { ...s, done: true })
    }))
    setRest({ remaining: REST_TOTAL, total: REST_TOTAL })
    if (navigator.vibrate) navigator.vibrate(50)
  }

  function addSet(bi) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const last = b.sets[b.sets.length - 1]
      return { ...b, sets: [...b.sets, mkSet(last.weight, last.reps)] }
    }))
  }

  function updateSet(bi, si, field, val) {
    setBlocks(prev => prev.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => j !== si ? s : { ...s, [field]: val })
    }))
  }

  function removeBlock(bi) {
    setBlocks(prev => prev.filter((_, i) => i !== bi))
  }

  async function finish() {
    setFinishing(true)
    const duration = Math.floor((Date.now() - startRef.current) / 1000)
    if (workoutIdRef.current) {
      await supabase.from('workouts').update({ duration_seconds: duration }).eq('id', workoutIdRef.current)
      navigate(`/workout/${workoutIdRef.current}`)
    } else {
      navigate('/')
    }
  }

  async function discard() {
    if (workoutIdRef.current) {
      await supabase.from('sets').delete().eq('workout_id', workoutIdRef.current)
      await supabase.from('workouts').delete().eq('id', workoutIdRef.current)
    }
    navigate('/')
  }

  const existingIds = blocks.map(b => b.exercise.id)

  return (
    <div style={{ flex: 1, paddingBottom: 32, background: '#0a0a0a' }}>
      {/* Rest timer bar */}
      {rest && (
        <div style={{ position: 'sticky', top: 0, zIndex: 60, background: '#0a0a0a' }}>
          <div style={{ height: 3, background: '#1a1a1a', position: 'relative' }}>
            <div style={{
              height: '100%', background: '#22c55e', borderRadius: '0 2px 2px 0',
              width: `${(rest.remaining / rest.total) * 100}%`,
              transition: 'width 1s linear',
            }} />
          </div>
          <div style={{ position: 'absolute', top: 5, right: 12, fontSize: 11, color: '#22c55e', fontWeight: 500 }}>
            Rest {rest.remaining}s
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#fff' }}>Live Workout</div>
          <div style={{ fontSize: 13, color: '#22c55e', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
            {fmt(elapsed)} ⏱
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDiscardConfirm(true)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 13, color: '#555', border: '1px solid #1e1e1e' }}>
            Discard
          </button>
          <button onClick={finish} disabled={finishing || !workoutIdRef.current} style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: (finishing || !workoutIdRef.current) ? '#1a1a1a' : '#22c55e',
            color: (finishing || !workoutIdRef.current) ? '#555' : '#000',
          }}>
            {finishing ? '…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Exercise blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {blocks.map((block, bi) => {
          const doneSets = block.sets.filter(s => s.done)
          const currentVol = doneSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
          const lastTimeStr = block.lastSets.length
            ? block.lastSets.map(s => `${s.weight_kg}×${s.reps}`).join(', ')
            : null

          return (
            <div key={block.exercise.id}>
              {/* Stuck banner above block */}
              {block.stuck && bi > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />
                </div>
              )}

              <div style={{ background: '#111', borderRadius: 14, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
                {/* Block header */}
                <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{block.exercise.name}</div>
                    {lastTimeStr && (
                      <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Last time: {lastTimeStr}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <VolBadge current={currentVol || null} prev={block.prevVolume || null} />
                    <button onClick={() => removeBlock(bi)} style={{ color: '#333', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                </div>

                {/* Sets table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Set', 'kg', 'Reps', ''].map((h, i) => (
                        <th key={i} style={{ padding: '4px 14px', fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, textAlign: i === 3 ? 'center' : 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.sets.map((set, si) => (
                      <tr key={set.lid} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td style={{ padding: '7px 14px', fontSize: 13, color: set.done ? '#555' : '#555', width: 36 }}>
                          {si + 1}
                        </td>
                        <td style={{ padding: '7px 8px 7px 14px' }}>
                          {set.done ? (
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>{set.weight}</span>
                          ) : (
                            <input
                              type="number" value={set.weight || ''} min={0} step={2.5}
                              placeholder="0"
                              onChange={e => { const v = parseFloat(e.target.value); updateSet(bi, si, 'weight', isNaN(v) ? 0 : v) }}
                              style={{ width: 60, padding: '6px 8px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', textAlign: 'center' }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          {set.done ? (
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#22c55e' }}>{set.reps}</span>
                          ) : (
                            <input
                              type="number" value={set.reps || ''} min={0} step={1}
                              placeholder="0"
                              onChange={e => { const v = parseInt(e.target.value); updateSet(bi, si, 'reps', isNaN(v) ? 0 : v) }}
                              style={{ width: 60, padding: '6px 8px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', textAlign: 'center' }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '7px 14px 7px 4px', textAlign: 'center' }}>
                          {set.done ? (
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          ) : (
                            <button onClick={() => logSet(bi, si)} style={{
                              width: 24, height: 24, borderRadius: '50%',
                              border: '1.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                            }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 2.5" stroke="#2a2a2a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add set */}
                <button onClick={() => addSet(bi)} style={{
                  width: '100%', padding: '10px 14px', borderTop: '1px solid #1a1a1a',
                  fontSize: 12, color: '#555', textAlign: 'left',
                  background: '#1a1a1a',
                }}>
                  + Add set
                </button>
              </div>

              {/* Stuck banner below first block */}
              {block.stuck && bi === 0 && (
                <div style={{ marginTop: 8 }}>
                  <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add exercise */}
      <div style={{ margin: blocks.length > 0 ? '12px 16px 0' : '0 16px' }}>
        <button onClick={() => setPickerOpen(true)} style={{
          width: '100%', padding: 13, borderRadius: 14,
          border: '1.5px dashed #2a2a2a', fontSize: 13, color: '#444',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add exercise
        </button>
      </div>

      {/* Discard confirm */}
      {discardConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#111', borderRadius: '16px 16px 0 0', padding: '24px 16px 40px' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 6 }}>Discard workout?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>All logged sets will be deleted.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDiscardConfirm(false)} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 500, background: '#1a1a1a', color: '#999', border: '1px solid #1e1e1e' }}>
                Cancel
              </button>
              <button onClick={discard} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 500, background: 'rgba(255,68,68,.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,.2)' }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise picker */}
      {pickerOpen && (
        <ExercisePicker
          user={user}
          existingIds={existingIds}
          onSelect={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
