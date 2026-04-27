import { useState } from 'react'
import { useAuth } from './hooks/useAuth.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import WorkoutSummary from './pages/WorkoutSummary'
import ExerciseProgress from './pages/ExerciseProgress'

function AppInner() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState('dashboard')
  const [workoutResult, setWorkoutResult] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 20 }}>
        <span className="grad" style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>GYMLOG</span>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(0,255,136,.2)', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (screen === 'workout') {
    return (
      <WorkoutLogger
        user={user}
        onFinish={(result) => { setWorkoutResult(result); setScreen('summary') }}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'summary' && workoutResult) {
    return (
      <WorkoutSummary
        result={workoutResult}
        onDone={() => { setWorkoutResult(null); setScreen('dashboard') }}
      />
    )
  }

  if (screen === 'exercise' && selectedExercise) {
    return (
      <ExerciseProgress
        user={user}
        exercise={selectedExercise}
        onBack={() => { setSelectedExercise(null); setScreen('dashboard') }}
      />
    )
  }

  return (
    <Dashboard
      user={user}
      onStartWorkout={() => setScreen('workout')}
      onViewExercise={(ex) => { setSelectedExercise(ex); setScreen('exercise') }}
    />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
