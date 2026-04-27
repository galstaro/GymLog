import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ExercisePicker from '../components/ExercisePicker'
import RestTimer from '../components/RestTimer'
import ProgressComparison from '../components/ProgressComparison'

function daysAgo(dateStr) {
  const days = Math.round((Date.now() - new Date(dateStr)) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function WorkoutLogger({ user, onFinish, onBack }) {
  const [workoutId, setWorkoutId] = useState(null)
  const [exercises, setExercises] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [lastData, setLastData] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [startTime] = useState(Date.now())
  const [finishing, setFinishing] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const restRef = useRef(null)
  const workoutIdRef = useRef(null)
  const creatingRef = useRef(null) // promise lock for workout creation

  useEffect(() => {
    return () => { if (restRef.current) clearInterval(restRef.current) }
  }, [])

  // Lazy: only create workout when first set is added
  async function getOrCreateWorkout() {
    if (workoutIdRef.current) return workoutIdRef.current
    if (!creatingRef.current) {
      creatingRef.current = (async () => {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase.from('workouts')
          .insert({ user_id: user.id, date: today })
          .select().single()
        if (data) {
          workoutIdRef.current = data.id
          setWorkoutId(data.id)
          return data.id
        }
        return null
      })()
    }
    return creatingRef.current
  }

  async function fetchLastSession(exerciseId) {
    if (lastData[exerciseId] !== undefined) return
    const { data } = await supabase.from('sets')
      .select('weight_kg, reps, set_number, workouts(date)')
      .eq('user_id', user.id).eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false }).limit(20)
    if (!data?.length) { setLastData(p => ({ ...p, [exerciseId]: null })); return }
    const byWorkout = {}
    for (const s of data) {
      const d = s.workouts?.date
      if (d && !byWorkout[d]) byWorkout[d] = []
      if (d) byWorkout[d].push(s)
    }
    const today = new Date().toISOString().split('T')[0]
    const lastDate = Object.keys(byWorkout).sort().reverse().find(d => d !== today)
    if (!lastDate) { setLastData(p => ({ ...p, [exerciseId]: null })); return }
    setLastData(p => ({ ...p, [exerciseId]: { sets: byWorkout[lastDate], date: lastDate } }))
  }

  function addExercise(exercise) {
    setExercises(prev => {
      if (prev.find(e => e.exercise.id === exercise.id)) return prev
      return [...prev, { exercise, sets: [] }]
    })
    fetchLastSession(exercise.id)
    setShowPicker(false)
  }

  function removeExercise(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  async function addSet(exerciseIdx) {
    const wId = await getOrCreateWorkout()
    if (!wId) return
    const ex = exercises[exerciseIdx]
    const prevSet = ex.sets[ex.sets.length - 1]
    const last = lastData[ex.exercise.id]
    const weight = prevSet?.weight_kg ?? last?.sets?.[0]?.weight_kg ?? 20
    const reps = prevSet?.reps ?? last?.sets?.[0]?.reps ?? 10
    const { data } = await supabase.from('sets').insert({
      user_id: user.id, workout_id: wId, exercise_id: ex.exercise.id,
      set_number: ex.sets.length + 1, weight_kg: weight, reps,
    }).select().single()
    if (data) {
      setExercises(prev => prev.map((e, i) => i === exerciseIdx ? { ...e, sets: [...e.sets, data] } : e))
      startRest(90)
      setEditingSet({ exerciseIdx, setIdx: ex.sets.length })
    }
  }

  async function updateSet(exerciseIdx, setIdx, field, value) {
    const set = exercises[exerciseIdx].sets[setIdx]
    const numVal = parseFloat(value) || 0
    await supabase.from('sets').update({ [field]: numVal }).eq('id', set.id)
    setExercises(prev => prev.map((e, i) =>
      i === exerciseIdx ? { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: numVal } : s) } : e
    ))
  }

  async function deleteSet(exerciseIdx, setIdx) {
    const set = exercises[exerciseIdx].sets[setIdx]
    await supabase.from('sets').delete().eq('id', set.id)
    setExercises(prev => prev.map((e, i) =>
      i === exerciseIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e
    ))
    if (editingSet?.exerciseIdx === exerciseIdx && editingSet?.setIdx === setIdx) setEditingSet(null)
  }

  function startRest(seconds) {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimer({ remaining: seconds, total: seconds })
    restRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.remaining <= 1) {
          clearInterval(restRef.current)
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          return null
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
  }

  async function finishWorkout() {
    if (!workoutIdRef.current) return
    setFinishing(true)
    const durationMins = Math.round((Date.now() - startTime) / 60000)
    await supabase.from('workouts').update({ duration_minutes: durationMins }).eq('id', workoutIdRef.current)
    if (restRef.current) clearInterval(restRef.current)
    onFinish({ workoutId: workoutIdRef.current, exercises, durationMins })
  }

  async function discardWorkout() {
    if (restRef.current) clearInterval(restRef.current)
    // Only delete from DB if we actually created a workout
    if (workoutIdRef.current) {
      await supabase.from('sets').delete().eq('workout_id', workoutIdRef.current)
      await supabase.from('workouts').delete().eq('id', workoutIdRef.current)
    }
    onBack()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={discardWorkout} style={{
          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: 'rgba(255,45,85,.08)', color: 'var(--red)',
          border: '1px solid rgba(255,45,85,.2)',
        }}>Discard</button>
        <LiveTimer startTime={startTime} />
        <button
          onClick={finishWorkout}
          disabled={finishing || exercises.length === 0 || !workoutId}
          className={exercises.length > 0 && workoutId ? 'glow-sm' : ''}
          style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
            letterSpacing: '.04em', textTransform: 'uppercase',
            background: exercises.length > 0 && workoutId ? 'linear-gradient(120deg,#00ff88,#00e5ff)' : 'var(--bg3)',
            color: exercises.length > 0 && workoutId ? '#000' : 'var(--muted)',
            opacity: finishing ? .6 : 1,
          }}
        >{finishing ? 'Saving…' : 'Finish'}</button>
      </div>

      {/* List */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '14px 16px 140px', WebkitOverflowScrolling: 'touch',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💪</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Add your first exercise</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Tap the button below to get started</p>
          </div>
        )}
        {exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.exercise.id}
            ex={ex} exerciseIdx={idx}
            lastSession={lastData[ex.exercise.id]}
            editingSet={editingSet}
            onAddSet={() => addSet(idx)}
            onUpdateSet={(si, field, val) => updateSet(idx, si, field, val)}
            onDeleteSet={si => deleteSet(idx, si)}
            onRemoveExercise={() => removeExercise(idx)}
            onEditSet={si => setEditingSet(
              editingSet?.exerciseIdx === idx && editingSet?.setIdx === si ? null : { exerciseIdx: idx, setIdx: si }
            )}
          />
        ))}
        <button onClick={() => setShowPicker(true)} style={{
          width: '100%', padding: '16px 0', borderRadius: 16, fontWeight: 700, fontSize: 15,
          background: 'rgba(0,255,136,.04)', color: 'var(--neon)',
          border: '1.5px dashed rgba(0,255,136,.25)', letterSpacing: '.04em',
        }}>+ Add Exercise</button>
      </div>

      {restTimer && (
        <RestTimer remaining={restTimer.remaining} total={restTimer.total}
          onDismiss={() => { if (restRef.current) clearInterval(restRef.current); setRestTimer(null) }}
        />
      )}
      {showPicker && (
        <ExercisePicker user={user} onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          existingIds={exercises.map(e => e.exercise.id)}
        />
      )}
    </div>
  )
}

function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTime])
  const m = Math.floor(elapsed / 60), s = elapsed % 60
  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, letterSpacing: 1, color: 'var(--neon)', textShadow: '0 0 12px rgba(0,255,136,.4)' }}>
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

function ExerciseCard({ ex, exerciseIdx, lastSession, editingSet, onAddSet, onUpdateSet, onDeleteSet, onRemoveExercise, onEditSet }) {
  return (
    <div className="fade-up" style={{ background: 'var(--bg2)', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', borderTop: '2px solid rgba(0,255,136,.2)' }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{ex.exercise.name}</h3>
          {lastSession
            ? <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Last: {lastSession.sets[0]?.weight_kg}kg × {lastSession.sets[0]?.reps} × {lastSession.sets.length} sets ({daysAgo(lastSession.date)})</p>
            : lastSession === null
              ? <p style={{ fontSize: 11, color: 'var(--neon)', marginTop: 2, opacity: .7 }}>First time! 🔥</p>
              : null}
        </div>
        <button onClick={onRemoveExercise} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,45,85,.08)', color: 'var(--red)', fontSize: 14 }}>✕</button>
      </div>
      <ProgressComparison exerciseSets={ex.sets} lastSession={lastSession} />
      <div style={{ padding: '4px 14px 2px' }}>
        {ex.sets.length === 0 && <p style={{ fontSize: 12, textAlign: 'center', padding: '8px 0', color: 'var(--muted)' }}>No sets yet</p>}
        {ex.sets.map((set, si) => {
          const isEditing = editingSet?.exerciseIdx === exerciseIdx && editingSet?.setIdx === si
          return (
            <SetRow key={set.id} set={set} setIdx={si} isEditing={isEditing}
              onEdit={() => onEditSet(si)}
              onUpdate={(field, val) => onUpdateSet(si, field, val)}
              onDelete={() => onDeleteSet(si)}
            />
          )
        })}
      </div>
      <div style={{ padding: '8px 14px 14px' }}>
        <button onClick={onAddSet} style={{ width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'rgba(0,255,136,.06)', color: 'var(--neon)', border: '1px solid rgba(0,255,136,.15)', letterSpacing: '.04em' }}>
          + Add Set
        </button>
      </div>
    </div>
  )
}

function NumControl({ value, onChange, step = 1, min = 0, unit }) {
  const dec = () => onChange(Math.max(min, parseFloat((value - step).toFixed(2))))
  const inc = () => onChange(parseFloat((value + step).toFixed(2)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg)', borderRadius: 12, border: '1.5px solid rgba(0,255,136,.25)', overflow: 'hidden' }}>
        <button onClick={dec} style={{ width: 40, height: 40, fontSize: 20, fontWeight: 700, color: 'var(--neon)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        <input
          type="number" value={value} min={min} step={step}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
          style={{ width: 58, height: 40, textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 800, color: 'var(--text)' }}
        />
        <button onClick={inc} style={{ width: 40, height: 40, fontSize: 20, fontWeight: 700, color: 'var(--neon)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>{unit}</span>
    </div>
  )
}

function SetRow({ set, setIdx, isEditing, onEdit, onUpdate, onDelete }) {
  const [weight, setWeight] = useState(set.weight_kg)
  const [reps, setReps] = useState(set.reps)

  useEffect(() => setWeight(set.weight_kg), [set.weight_kg])
  useEffect(() => setReps(set.reps), [set.reps])

  function commitWeight(v) { setWeight(v); if (v !== set.weight_kg) onUpdate('weight_kg', v) }
  function commitReps(v) { setReps(v); if (v !== set.reps) onUpdate('reps', v) }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon)', opacity: .5, width: 28, letterSpacing: '.04em' }}>S{setIdx + 1}</span>

        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
            <NumControl value={weight} onChange={commitWeight} step={2.5} min={0} unit="kg" />
            <NumControl value={reps} onChange={commitReps} step={1} min={1} unit="reps" />
          </div>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{set.weight_kg} kg</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--muted)' }}>{set.reps} reps</span>
          </>
        )}

        <button onClick={onEdit} style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
          background: isEditing ? 'linear-gradient(120deg,#00ff88,#00e5ff)' : 'var(--bg3)',
          color: isEditing ? '#000' : 'var(--muted)',
          border: isEditing ? 'none' : '1px solid var(--border)',
          flexShrink: 0,
        }}>{isEditing ? 'Done' : 'Edit'}</button>

        <button onClick={onDelete} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: 'rgba(255,45,85,.08)', color: 'var(--red)', fontSize: 13, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  )
}
