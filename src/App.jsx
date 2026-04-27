import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import WorkoutLogger from './pages/WorkoutLogger.jsx'
import WorkoutDetail from './pages/WorkoutDetail.jsx'
import ExerciseProgress from './pages/ExerciseProgress.jsx'
import ExerciseList from './pages/ExerciseList.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>GymLog</span>
      <div style={{ width: 28, height: 28, border: '2px solid #1e1e1e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/workout/active" element={<Protected><WorkoutLogger /></Protected>} />
        <Route path="/workout/:id" element={<Protected><WorkoutDetail /></Protected>} />
        <Route path="/exercise/:id" element={<Protected><ExerciseProgress /></Protected>} />
        <Route path="/exercises" element={<Protected><ExerciseList /></Protected>} />
        <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
