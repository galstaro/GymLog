import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await signIn(email, password)
        navigate('/', { replace: true })
      } else {
        await signUp(email, password)
        setSuccess('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: '#0a0a0a' }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#fff', letterSpacing: -0.5 }}>GymLog</div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Track every rep. Beat every session.</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 360, background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: 24 }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: tab === t ? '#22c55e' : 'transparent',
              color: tab === t ? '#000' : '#555',
              transition: 'all .15s',
            }}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 10, fontSize: 14,
              background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 10, fontSize: 14,
              background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff',
              outline: 'none',
            }}
          />

          {error && <p style={{ fontSize: 13, color: '#ff4444', padding: '8px 12px', background: 'rgba(255,68,68,.08)', borderRadius: 8 }}>{error}</p>}
          {success && <p style={{ fontSize: 13, color: '#22c55e', padding: '8px 12px', background: 'rgba(34,197,94,.08)', borderRadius: 8 }}>{success}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 0', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: '#22c55e', color: '#000', marginTop: 4,
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? '…' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
