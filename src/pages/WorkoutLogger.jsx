import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'

const REST_TOTAL = 90
let lid = 0
const mkSet = (w = '', r = '') => ({ lid: ++lid, weight: w, reps: r, done: false })

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function VolBadge({ current, prev }) {
  if (!prev || !current) return null
  const pct = ((current - prev) / prev * 100)
  if (Math.abs(pct) < 0.5) return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#555', fontWeight: 500 }}>
      Same
    </span>
  )
  const up = pct > 0
  return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: up ? 'rgba(34,197,94,.15)' : 'rgba(255,68,68,.1)', border: `1px solid ${up ? 'rgba(34,197,94,.3)' : 'rgba(255,68,68,.25)'}`, color: up ? '#22c55e' : '#ff6666', fontWeight: 500 }}>
      {up ? '+' : ''}{pct.toFixed(1)}% volume
    </span>
  )
}

function StuckBanner({ name, weight }) {
  return (
    <div style={{ background: '#1f1800', border: '1px solid #ba7517', borderRadius: 14, padding: '12px 14px', margin: '0 0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontSize: 13, color: '#EF9F27', fontWeight: 600 }}>
          {name} stuck at {weight} kg for 3 weeks
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#ba7517', paddingLeft: 24 }}>
        Try {(weight + 2.5).toFixed(1)} kg × 5 reps this session →
      </div>
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
    let lastSets = [], prefillW = '', prefillR = '', prevVolume = 0

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
    const w = parseFloat(set.weight)
    const r = parseInt(set.reps)
    if (!w || !r || set.done) return
    const workoutId = await getOrCreateWorkout()
    await supabase.from('sets').insert({
      user_id: user.id, workout_id: workoutId,
      exercise_id: blocks[bi].exercise.id,
      set_number: si + 1, weight_kg: w, reps: r,
    })
    setBlocks(prev => prev.map((b, i) => i !== bi ? b : {
      ...b, sets: b.sets.map((s, j) => j !== si ? s : { ...s, weight: w, reps: r, done: true })
    }))
    setRest({ remaining: REST_TOTAL, total: REST_TOTAL })
    if (navigator.vibrate) navigator.vibrate(50)
  }

  function addSet(bi) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== bi) return b
      const last = b.sets[b.sets.length - 1]
      return { ...b, sets: [...b.sets, mkSet(last.weight, '')] }
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
    <div style={{ flex: 1, background: '#0a0a0a', paddingBottom: 40 }}>

      {/* Rest timer — top of screen */}
      <div style={{ position: 'relative', height: rest ? 'auto' : 0, overflow: 'hidden' }}>
        {rest && (
          <>
            <div style={{ height: 3, background: '#1a1a1a' }}>
              <div style={{ height: '100%', background: '#22c55e', width: `${(rest.remaining / rest.total) * 100}%`, transition: 'width 1s linear' }} />
            </div>
            <div style={{ position: 'absolute', top: 6, right: 16, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              Rest {rest.remaining}s
            </div>
          </>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Live Workout</div>
          <div style={{ fontSize: 13, color: '#22c55e', marginTop: 3, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
            {fmt(elapsed)} <span style={{ fontSize: 12 }}>⏱</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => setDiscardConfirm(true)} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#555', border: '1px solid #1e1e1e', background: 'transparent' }}>
            Discard
          </button>
          <button onClick={finish} disabled={finishing || !workoutIdRef.current} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: (finishing || !workoutIdRef.current) ? '#1a1a1a' : '#22c55e',
            color: (finishing || !workoutIdRef.current) ? '#444' : '#000',
          }}>
            {finishing ? '…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Exercise blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {blocks.map((block, bi) => {
          const doneSets = block.sets.filter(s => s.done)
          const currentVol = doneSets.reduce((sum, s) => sum + parseFloat(s.weight) * parseInt(s.reps), 0)
          const lastTimeStr = block.lastSets.length
            ? block.lastSets.map(s => `${s.weight_kg}×${s.reps}`).join(', ')
            : null

          return (
            <div key={block.exercise.id}>
              {block.stuck && bi > 0 && <StuckBanner name={block.exercise.name} weight={block.stuck.weight} />}

              <div style={{ background: '#161616', borderRadius: 16, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
                {/* Block header */}
                <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.2 }}>{block.exercise.name}</div>
                    {lastTimeStr && (
                      <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>Last time: {lastTimeStr}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <VolBadge current={currentVol || null} prev={block.prevVolume || null} />
                    <button onClick={() => removeBlock(bi)} style={{ color: '#333', fontSize: 20, lineHeight: 1, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                </div>

                {/* Sets table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 14px', fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, textAlign: 'left', width: 36 }}>Set</th>
                      <th style={{ padding: '4px 14px', fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, textAlign: 'left' }}>KG</th>
                      <th style={{ padding: '4px 14px', fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, textAlign: 'left' }}>Reps</th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.sets.map((set, si) => (
                      <tr key={set.lid} style={{ borderTop: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '9px 14px', fontSize: 14, color: '#444', width: 36 }}>{si + 1}</td>
                        <td style={{ padding: '9px 14px' }}>
                          {set.done ? (
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>{set.weight}</span>
                          ) : (
                            <input
                              type="number" inputMode="decimal"
                              value={set.weight}
                              onChange={e => updateSet(bi, si, 'weight', e.target.value)}
                              placeholder="—"
                              style={{ width: 56, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#ddd', padding: 0 }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          {set.done ? (
                            <span style={{ fontSize: 15, fontWeight: 600, color: '#22c55e' }}>{set.reps}</span>
                          ) : (
                            <input
                              type="number" inputMode="numeric"
                              value={set.reps}
                              onChange={e => updateSet(bi, si, 'reps', e.target.value)}
                              placeholder="—"
                              style={{ width: 56, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#666', padding: 0 }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'center', width: 48 }}>
                          {set.done ? (
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          ) : (
                            <button onClick={() => logSet(bi, si)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  width: '100%', padding: '11px 14px', borderTop: '1px solid #1e1e1e',
                  fontSize: 13, color: '#444', textAlign: 'center',
                  background: '#111', fontWeight: 500,
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

      {/* Add exercise */}
      <div style={{ margin: blocks.length > 0 ? '14px 16px 0' : '0 16px' }}>
        <button onClick={() => setPickerOpen(true)} style={{
          width: '100%', padding: 14, borderRadius: 16,
          border: '1.5px dashed #2a2a2a', fontSize: 14, color: '#444', fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          + Add exercise
        </button>
      </div>

      {/* Discard sheet */}
      {discardConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#161616', borderRadius: '18px 18px 0 0', padding: '24px 20px 44px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Discard workout?</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 22 }}>All logged sets will be deleted.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDiscardConfirm(false)} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 500, background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}>
                Cancel
              </button>
              <button onClick={discard} style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'rgba(255,68,68,.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,.2)' }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <ExercisePicker user={user} existingIds={existingIds} onSelect={addExercise} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  )
}
