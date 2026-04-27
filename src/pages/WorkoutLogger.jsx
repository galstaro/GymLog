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
        width: 38, height: 38, borderRadius: 11,
        background: 'var(--surface2)', border: '1px solid var(--border-d)',
        fontSize: 20, color: 'var(--muted)', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>−</button>
      <span style={{ fontSize: 18, fontWeight: 800, color, minWidth: 44, textAlign: 'center' }}>{value}</span>
      <button onPointerDown={e => { e.stopPropagation(); onInc() }} style={{
        width: 38, height: 38, borderRadius: 11,
        background: 'linear-gradient(135deg, #22c55e, #4ade80)', border: 'none',
        fontSize: 20, color: '#000', fontWeight: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 0 10px rgba(34,197,94,.3)',
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

  function getLocalDateStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  async function getOrCreateWorkout() {
    if (workoutIdRef.current) return workoutIdRef.current
    if (creatingRef.current) return creatingRef.current
    const p = (async () => {
      try {
        const { data, error } = await supabase.from('workouts').insert({
          user_id: user.id,
          date: getLocalDateStr(),
        }).select('id').single()
        if (error || !data) throw new Error(error?.message || 'insert failed')
        workoutIdRef.current = data.id
        return data.id
      } finally {
        creatingRef.current = null
      }
    })()
    creatingRef.current = p
    return p
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
        if (field === 'weight') return { ...s, weight: adj(s.weight, delta, 1) }
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
    try {
      const duration = Math.floor((Date.now() - startRef.current) / 1000)
      const wid = await getOrCreateWorkout()
      const { error } = await supabase.from('workouts').update({ duration_seconds: duration }).eq('id', wid)
      if (error) console.error('duration update failed:', error)
      const exerciseSummary = blocks.map(b => {
        const doneSets = b.sets.filter(s => s.done)
        return {
          name: b.exercise.name,
          doneSets: doneSets.length,
          maxWeight: doneSets.length > 0 ? Math.max(...doneSets.map(s => parseFloat(s.weight) || 0)) : 0,
          volume: doneSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0),
        }
      })
      navigate('/workout/complete', { state: { workoutId: wid, duration, exerciseSummary } })
    } catch (e) {
      console.error('finish failed:', e)
      setFinishing(false)
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
  const canFinish = blocks.length > 0 && !finishing

  return (
    <div style={{ flex: 1, background: 'var(--bg)', paddingBottom: 'var(--page-pb)' }}>

      {/* Rest timer strip */}
      {rest && (
        <div style={{ position: 'sticky', top: 'var(--inset-top)', zIndex: 60 }}>
          <div style={{ height: 5, background: 'var(--border-s)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', width: `${(rest.remaining / rest.total) * 100}%`, transition: 'width 1s linear', boxShadow: '0 0 12px rgba(34,197,94,.7)' }} />
          </div>
          <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 12, color: '#4ade80', fontWeight: 800, letterSpacing: '0.05em' }}>
            REST {rest.remaining}s
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>● LIVE</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.8, lineHeight: 1 }}>Workout</div>
          <div style={{ fontSize: 20, color: '#4ade80', marginTop: 4, fontVariantNumeric: 'tabular-nums', fontWeight: 800, letterSpacing: -0.5, textShadow: '0 0 16px rgba(74,222,128,.5)' }}>
            {fmt(elapsed)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDiscardConfirm(true)} style={{
            padding: '10px 16px', minHeight: 46, borderRadius: 14, fontSize: 14, fontWeight: 600,
            color: 'var(--hint)', border: '1px solid var(--border)', background: 'transparent',
          }}>
            Discard
          </button>
          <button onClick={finish} disabled={!canFinish} style={{
            padding: '10px 20px', minHeight: 46, borderRadius: 14, fontSize: 14, fontWeight: 800,
            background: canFinish ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'var(--surface)',
            color: canFinish ? '#000' : 'var(--disabled)',
            boxShadow: canFinish ? '0 0 20px rgba(34,197,94,.4)' : 'none',
            letterSpacing: -0.2,
          }}>
            {finishing ? '…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Exercise blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {blocks.map((block, bi) => {
          const doneSets = block.sets.filter(s => s.done)
          const currentVol = doneSets.reduce((sum, s) => sum + (s.weight || 0) * s.reps, 0)
          const lastTimeStr = block.lastSets.length
            ? block.lastSets.map(s => `${s.weight_kg}×${s.reps}`).join(', ')
            : null

          return (
            <div key={block.exercise.id}>
              {block.stuck && bi > 0 && <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />}

              <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Block header */}
                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{block.exercise.name}</div>
                    {lastTimeStr && (
                      <div style={{ fontSize: 11, color: 'var(--hint)', marginTop: 3, fontWeight: 500 }}>Last: {lastTimeStr}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <VolBadge current={currentVol || null} prev={block.prevVolume || null} />
                    <button onClick={() => removeBlock(bi)} style={{ color: '#333', fontSize: 22, lineHeight: 1, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 52px', padding: '0 16px 4px', borderTop: '1px solid var(--border-s)' }}>
                  {['SET', 'KG', 'REPS', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 10, color: 'var(--disabled)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, paddingTop: 8, paddingBottom: 2 }}>{h}</span>
                  ))}
                </div>

                {/* Set rows */}
                {block.sets.map((set, si) => (
                  <div key={set.lid} style={{
                    display: 'grid', gridTemplateColumns: '30px 1fr 1fr 52px',
                    alignItems: 'center', padding: '8px 16px',
                    borderTop: '1px solid var(--border-s)',
                    minHeight: 62,
                    background: set.done ? 'rgba(34,197,94,.06)' : 'transparent',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--hint)', fontWeight: 700 }}>{si + 1}</span>

                    {set.done ? (
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text2)' }}>{set.weight}</span>
                    ) : (
                      <Stepper value={set.weight || 0} onDec={() => adjustSet(bi, si, 'weight', -1)} onInc={() => adjustSet(bi, si, 'weight', 1)} color="var(--text2)" />
                    )}

                    {set.done ? (
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', textShadow: '0 0 10px rgba(74,222,128,.4)' }}>{set.reps}</span>
                    ) : (
                      <Stepper value={set.reps || 0} onDec={() => adjustSet(bi, si, 'reps', -1)} onInc={() => adjustSet(bi, si, 'reps', 1)} color="#22c55e" />
                    )}

                    {set.done ? (
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#22c55e,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end', boxShadow: '0 0 12px rgba(34,197,94,.4)' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2.5 8l4 4 7-7" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <button onClick={() => logSet(bi, si)} style={{
                        width: 40, height: 40, borderRadius: 12,
                        border: '1.5px solid rgba(34,197,94,.25)',
                        background: 'rgba(34,197,94,.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M2.5 8l4 4 7-7" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add set */}
                <button onClick={() => addSet(bi)} style={{
                  width: '100%', padding: '12px 16px', borderTop: '1px solid var(--border-s)',
                  fontSize: 13, color: 'var(--hint)', textAlign: 'center',
                  background: 'transparent', fontWeight: 600, minHeight: 46,
                  letterSpacing: '0.02em',
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
      <div style={{ margin: blocks.length > 0 ? '12px 16px 0' : '4px 16px 0' }}>
        <button onClick={() => setPickerOpen(true)} style={{
          width: '100%', padding: 16, borderRadius: 18, minHeight: 58,
          border: '1.5px dashed rgba(34,197,94,.25)', fontSize: 15, color: '#22c55e', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(34,197,94,.04)',
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
