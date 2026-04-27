import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'
import BottomNav from '../components/BottomNav.jsx'

const REST_TOTAL = 90
let lid = 0
const mkSet = (w = 0, r = 0) => ({ lid: ++lid, weight: w, reps: r, done: false })

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function adj(val, delta, step, min = 0) {
  const n = parseFloat((parseFloat(val || 0) + delta).toFixed(2))
  return Math.max(min, n)
}

function VolBadge({ current, prev }) {
  if (!prev || !current) return null
  const pct = ((current - prev) / prev * 100)
  if (Math.abs(pct) < 0.5) return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#555', fontWeight: 600 }}>Same</span>
  )
  const up = pct > 0
  return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: up ? 'rgba(34,197,94,.12)' : 'rgba(255,68,68,.08)', border: `1px solid ${up ? 'rgba(34,197,94,.3)' : 'rgba(255,68,68,.2)'}`, color: up ? '#22c55e' : '#ff6666', fontWeight: 600 }}>
      {up ? '+' : ''}{pct.toFixed(1)}% volume
    </span>
  )
}

function StuckBanner({ name, weight }) {
  return (
    <div style={{ background: '#1f1800', border: '1px solid #ba7517', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontSize: 14, color: '#EF9F27', fontWeight: 700 }}>
          {name} stuck at {weight} kg for 3 weeks
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#ba7517', paddingLeft: 24, fontWeight: 500 }}>
        Try {(weight + 2.5).toFixed(1)} kg × 5 reps this session →
      </div>
    </div>
  )
}

// +/- stepper control
function Stepper({ value, onDec, onInc, color = '#fff', decStep, incStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onPointerDown={e => { e.stopPropagation(); onDec() }} style={{
        width: 36, height: 36, borderRadius: 10,
        background: '#1e1e1e', border: '1px solid #2a2a2a',
        fontSize: 20, color: '#888', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>−</button>
      <span style={{ fontSize: 17, fontWeight: 800, color, minWidth: 46, textAlign: 'center' }}>{value}</span>
      <button onPointerDown={e => { e.stopPropagation(); onInc() }} style={{
        width: 36, height: 36, borderRadius: 10,
        background: '#22c55e', border: 'none',
        fontSize: 20, color: '#000', fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>+</button>
    </div>
  )
}

export default function WorkoutLogger() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState([])
  const [rest, setRest] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const workoutIdRef = useRef(null)
  const creatingRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

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
    setBlocks(prev => [...prev, { exercise, sets: [mkSet()], lastSets: [], prevVolume: 0, stuck: null }])

    const [lastRes, stuckInfo] = await Promise.all([
      supabase.from('sets').select('weight_kg, reps, workout_id')
        .eq('user_id', user.id).eq('exercise_id', exercise.id)
        .order('created_at', { ascending: false }).limit(30),
      checkStuck(user.id, exercise.id),
    ])

    const allSets = lastRes.data || []
    let lastSets = [], prefillW = 0, prefillR = 0, prevVolume = 0

    if (allSets.length) {
      const lastWid = allSets[0].workout_id
      lastSets = allSets.filter(s => s.workout_id === lastWid)
      const lastSet = lastSets[lastSets.length - 1]
      prefillW = lastSet.weight_kg
      prefillR = lastSet.reps
      prevVolume = lastSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
    }

    setBlocks(prev => prev.map(b => b.exercise.id === exercise.id
      ? { ...b, lastSets, prevVolume, stuck: stuckInfo, sets: [mkSet(prefillW, prefillR)] }
      : b
    ))
  }

  async function checkStuck(userId, exerciseId) {
    const { data } = await supabase.from('sets').select('weight_kg, workout_id')
      .eq('user_id', userId).eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false }).limit(60)
    if (!data?.length) return null
    const byWorkout = {}
    for (const s of data) {
      if (!byWorkout[s.workout_id]) byWorkout[s.workout_id] = []
      byWorkout[s.workout_id].push(s.weight_kg)
    }
    const sessions = Object.values(byWorkout).map(arr => Math.max(...arr))
    if (sessions.length >= 3 && sessions[0] === sessions[1] && sessions[1] === sessions[2]) return { weight: sessions[0] }
    return null
  }

  async function logSet(bi, si) {
    const set = blocks[bi].sets[si]
    if (!set.reps || set.done) return
    const workoutId = await getOrCreateWorkout()
    await supabase.from('sets').insert({
      user_id: user.id, workout_id: workoutId,
      exercise_id: blocks[bi].exercise.id,
      set_number: si + 1, weight_kg: set.weight || 0, reps: set.reps,
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

  function adjustSet(bi, si, field, delta) {
    setBlocks(prev => prev.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => {
        if (j !== si || s.done) return s
        if (field === 'weight') return { ...s, weight: adj(s.weight, delta, 2.5) }
        return { ...s, reps: Math.max(0, Math.round(s.reps + delta)) }
      })
    }))
  }

  function removeBlock(bi) {
    setBlocks(prev => prev.filter((_, i) => i !== bi))
  }

  async function finish() {
    if (blocks.length === 0) { navigate('/'); return }
    setFinishing(true)
    const duration = Math.floor((Date.now() - startRef.current) / 1000)
    const wid = await getOrCreateWorkout()
    await supabase.from('workouts').update({ duration_seconds: duration }).eq('id', wid)
    navigate(`/workout/${wid}`)
  }

  async function discard() {
    if (workoutIdRef.current) {
      await supabase.from('sets').delete().eq('workout_id', workoutIdRef.current)
      await supabase.from('workouts').delete().eq('id', workoutIdRef.current)
    }
    navigate('/')
  }

  const existingIds = blocks.map(b => b.exercise.id)
  const canFinish = blocks.length > 0 && !finishing

  return (
    <div style={{ flex: 1, background: '#0a0a0a', paddingBottom: 90 }}>

      {/* Rest timer strip */}
      {rest && (
        <div style={{ position: 'sticky', top: 0, zIndex: 60 }}>
          <div style={{ height: 4, background: '#1a1a1a' }}>
            <div style={{ height: '100%', background: '#22c55e', width: `${(rest.remaining / rest.total) * 100}%`, transition: 'width 1s linear', boxShadow: '0 0 8px rgba(34,197,94,.5)' }} />
          </div>
          <div style={{ position: 'absolute', top: 7, right: 16, fontSize: 12, color: '#22c55e', fontWeight: 700, letterSpacing: '0.02em' }}>
            Rest {rest.remaining}s
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Live Workout</div>
          <div style={{ fontSize: 14, color: '#22c55e', marginTop: 3, fontVariantNumeric: 'tabular-nums', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            {fmt(elapsed)} <span>⏱</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => setDiscardConfirm(true)} style={{ padding: '10px 14px', minHeight: 44, borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#555', border: '1px solid #222', background: 'transparent' }}>
            Discard
          </button>
          <button onClick={finish} disabled={!canFinish} style={{
            padding: '10px 18px', minHeight: 44, borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: canFinish ? '#22c55e' : '#1a1a1a',
            color: canFinish ? '#000' : '#444',
            boxShadow: canFinish ? '0 0 14px rgba(34,197,94,.3)' : 'none',
          }}>
            {finishing ? '…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Exercise blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 16px' }}>
        {blocks.map((block, bi) => {
          const doneSets = block.sets.filter(s => s.done)
          const currentVol = doneSets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0)
          const lastTimeStr = block.lastSets.length
            ? block.lastSets.map(s => `${s.weight_kg}×${s.reps}`).join(', ')
            : null

          return (
            <div key={block.exercise.id}>
              {block.stuck && bi > 0 && <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />}

              <div style={{ background: '#141414', borderRadius: 18, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
                {/* Block header */}
                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{block.exercise.name}</div>
                    {lastTimeStr && (
                      <div style={{ fontSize: 11, color: '#444', marginTop: 3, fontWeight: 500 }}>Last time: {lastTimeStr}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <VolBadge current={currentVol || null} prev={block.prevVolume || null} />
                    <button onClick={() => removeBlock(bi)} style={{ color: '#333', fontSize: 22, lineHeight: 1, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 52px', padding: '0 16px 4px', borderTop: '1px solid #1a1a1a' }}>
                  {['SET', 'KG', 'REPS', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, paddingTop: 8, paddingBottom: 2 }}>{h}</span>
                  ))}
                </div>

                {/* Set rows */}
                {block.sets.map((set, si) => (
                  <div key={set.lid} style={{
                    display: 'grid', gridTemplateColumns: '30px 1fr 1fr 52px',
                    alignItems: 'center', padding: '8px 16px',
                    borderTop: '1px solid #1a1a1a',
                    minHeight: 60,
                    background: set.done ? 'rgba(34,197,94,.04)' : 'transparent',
                  }}>
                    {/* Set number */}
                    <span style={{ fontSize: 14, color: '#555', fontWeight: 700 }}>{si + 1}</span>

                    {/* KG */}
                    {set.done ? (
                      <span style={{ fontSize: 17, fontWeight: 800, color: '#ddd' }}>{set.weight}</span>
                    ) : (
                      <Stepper
                        value={set.weight || 0}
                        onDec={() => adjustSet(bi, si, 'weight', -2.5)}
                        onInc={() => adjustSet(bi, si, 'weight', 2.5)}
                        color="#ddd"
                      />
                    )}

                    {/* Reps */}
                    {set.done ? (
                      <span style={{ fontSize: 17, fontWeight: 800, color: '#22c55e' }}>{set.reps}</span>
                    ) : (
                      <Stepper
                        value={set.reps || 0}
                        onDec={() => adjustSet(bi, si, 'reps', -1)}
                        onInc={() => adjustSet(bi, si, 'reps', 1)}
                        color="#22c55e"
                      />
                    )}

                    {/* Check */}
                    {set.done ? (
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2.5 8l4 4 7-7" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <button onClick={() => logSet(bi, si)} style={{
                        width: 38, height: 38, borderRadius: 12, border: '1.5px solid #2a2a2a',
                        background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M2.5 8l4 4 7-7" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add set */}
                <button onClick={() => addSet(bi)} style={{
                  width: '100%', padding: '13px 16px', borderTop: '1px solid #1a1a1a',
                  fontSize: 14, color: '#555', textAlign: 'center',
                  background: '#0f0f0f', fontWeight: 600, minHeight: 48,
                }}>
                  + Add set
                </button>
              </div>

              {block.stuck && bi === 0 && (
                <div style={{ marginTop: 12 }}>
                  <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add exercise button */}
      <div style={{ margin: blocks.length > 0 ? '14px 16px 0' : '4px 16px 0' }}>
        <button onClick={() => setPickerOpen(true)} style={{
          width: '100%', padding: 16, borderRadius: 16, minHeight: 56,
          border: '1.5px dashed #2a2a2a', fontSize: 15, color: '#555', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          + Add exercise
        </button>
      </div>

      {/* Discard sheet */}
      {discardConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#141414', borderRadius: '20px 20px 0 0', padding: '28px 20px 48px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Discard workout?</div>
            <div style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>All logged sets will be deleted.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDiscardConfirm(false)} style={{ flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 600, background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a', minHeight: 52 }}>
                Cancel
              </button>
              <button onClick={discard} style={{ flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: 'rgba(255,68,68,.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,.2)', minHeight: 52 }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <ExercisePicker user={user} existingIds={existingIds} onSelect={addExercise} onClose={() => setPickerOpen(false)} />
      )}

      <BottomNav />
    </div>
  )
}
