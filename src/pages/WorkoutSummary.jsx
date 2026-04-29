import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { getMondayStr, getLastMondayStr } from '../lib/streaks.js'
import { checkNewMilestones } from '../lib/milestones.js'
import MilestoneCelebration from '../components/MilestoneCelebration.jsx'

function fmt(s) {
  if (!s) return '0:00'
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const MSGS = [
  'Crushed it! 💪', 'Beast mode activated 🔥', 'Every rep counts 🏅',
  "That's how it's done! ⚡", 'Progress never stops 🚀',
]

export default function WorkoutSummary() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newMilestones, setNewMilestones] = useState([])
  const [celebrationIdx, setCelebrationIdx] = useState(0)

  if (!state) { navigate('/'); return null }

  const { workoutId, duration, exerciseSummary = [] } = state
  const done = exerciseSummary.filter(e => e.doneSets > 0)
  const totalSets = done.reduce((s, e) => s + e.doneSets, 0)
  const totalVolume = Math.round(done.reduce((s, e) => s + e.volume, 0))
  const msg = MSGS[Math.floor(Math.random() * MSGS.length)]

  useEffect(() => {
    if (user) processWorkoutCompletion()
  }, [user])

  async function processWorkoutCompletion() {
    // Load settings (upsert ensures row exists)
    await supabase.from('user_settings').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
    const { data: settings } = await supabase.from('user_settings')
      .select('*').eq('user_id', user.id).single()
    if (!settings) return

    const goal = settings.weekly_workout_goal || 3
    const thisWeekMon = getMondayStr()
    const lastWeekMon = getLastMondayStr()

    // Count workouts this week (current workout already saved)
    const { count: weekCount } = await supabase.from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', thisWeekMon)

    // Compute new totals
    const newTotalWorkouts = (settings.total_workouts || 0) + 1
    const newTotalVolume = (settings.total_volume_kg || 0) + totalVolume

    // Compute streak increment
    let currentStreak = settings.current_streak || 0
    let longestStreak = settings.longest_streak || 0
    let lastStreakWeek = settings.last_streak_week || null

    const goalNowMet = (weekCount || 1) >= goal
    const alreadyCounted = lastStreakWeek === thisWeekMon

    if (goalNowMet && !alreadyCounted) {
      if (!lastStreakWeek || lastStreakWeek === lastWeekMon) {
        currentStreak += 1   // continuous
      } else {
        currentStreak = 1    // gap → fresh start
      }
      lastStreakWeek = thisWeekMon
      longestStreak = Math.max(longestStreak, currentStreak)
    }

    // Save
    await supabase.from('user_settings').update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_streak_week: lastStreakWeek,
      total_workouts: newTotalWorkouts,
      total_volume_kg: newTotalVolume,
    }).eq('user_id', user.id)

    // Check milestones
    const { data: existingMilestones } = await supabase.from('user_milestones')
      .select('milestone_id').eq('user_id', user.id)
    const unlockedIds = new Set((existingMilestones || []).map(m => m.milestone_id))

    const earned = checkNewMilestones({
      totalWorkouts: newTotalWorkouts,
      currentStreak,
      totalVolume: newTotalVolume,
    }, unlockedIds)

    if (earned.length > 0) {
      await supabase.from('user_milestones').insert(
        earned.map(m => ({ user_id: user.id, milestone_id: m.id }))
      )
      // Delay so the summary screen is visible first
      setTimeout(() => {
        setNewMilestones(earned)
        setCelebrationIdx(0)
      }, 1200)
    }
  }

  function dismissCelebration() {
    if (celebrationIdx < newMilestones.length - 1) {
      setCelebrationIdx(i => i + 1)
    } else {
      setNewMilestones([])
    }
  }

  return (
    <div style={{ flex: 1, background: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 52px', overflowY: 'auto' }}>

      {/* Radial glow bg */}
      <div style={{
        position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,.2) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'glowPulse 2.5s ease-in-out infinite',
      }} />

      {/* Trophy */}
      <div style={{ fontSize: 92, marginTop: 60, marginBottom: 18, animation: 'popIn .65s cubic-bezier(.34,1.56,.64,1) forwards', position: 'relative', zIndex: 1 }}>
        🏆
      </div>

      {/* Title */}
      <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, textAlign: 'center', marginBottom: 8, animation: 'fadeUp .5s ease .15s both', position: 'relative', zIndex: 1 }}>
        Workout Complete!
      </div>
      <div style={{ fontSize: 15, color: '#555', marginBottom: 36, fontWeight: 500, animation: 'fadeUp .5s ease .25s both' }}>
        {msg}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 360, marginBottom: 18, animation: 'fadeUp .5s ease .35s both' }}>
        {[
          { label: 'Duration',   value: fmt(duration) },
          { label: 'Exercises',  value: done.length },
          { label: 'Sets Done',  value: totalSets },
          { label: 'Volume',     value: `${totalVolume.toLocaleString()} kg` },
        ].map(s => (
          <div key={s.label} style={{ background: '#131313', borderRadius: 16, border: '1px solid #1e1e1e', padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e', letterSpacing: -1, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      {done.length > 0 && (
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 30, borderRadius: 14, overflow: 'hidden', border: '1px solid #1a1a1a', animation: 'fadeUp .5s ease .45s both' }}>
          {done.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', background: '#111',
              borderTop: i > 0 ? '1px solid #1a1a1a' : 'none',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ddd' }}>{e.name}</span>
              <div>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{e.doneSets} set{e.doneSets !== 1 ? 's' : ''}</span>
                {e.maxWeight > 0 && (
                  <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginLeft: 8 }}>{e.maxWeight} kg</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA buttons */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp .5s ease .55s both' }}>
        <button onClick={() => navigate('/')} style={{
          width: '100%', padding: 17, borderRadius: 16, fontSize: 16, fontWeight: 800,
          background: '#22c55e', color: '#000', minHeight: 58,
          boxShadow: '0 0 30px rgba(34,197,94,.4), 0 4px 20px rgba(0,0,0,.5)',
        }}>
          Back to Home
        </button>
        {workoutId && (
          <button onClick={() => navigate(`/workout/${workoutId}`)} style={{
            width: '100%', padding: 14, borderRadius: 16, fontSize: 14, fontWeight: 600,
            background: 'transparent', color: '#444', border: '1px solid #1e1e1e', minHeight: 50,
          }}>
            View Details
          </button>
        )}
      </div>

      {/* Milestone celebration */}
      {newMilestones.length > 0 && (
        <MilestoneCelebration
          milestone={newMilestones[celebrationIdx]}
          totalCount={newMilestones.length}
          onDismiss={dismissCelebration}
        />
      )}
    </div>
  )
}
