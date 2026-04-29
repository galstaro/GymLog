import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, signInWithGoogle } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Browser will redirect to Google — no further action needed
    } catch (err) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

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
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,.18) 0%, transparent 65%)',
        pointerEvents: 'none', animation: 'glowPulse 3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '20%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ marginBottom: 44, textAlign: 'center', position: 'relative', zIndex: 1, animation: 'fadeUp .5s ease both' }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, rgba(34,197,94,.2) 0%, rgba(74,222,128,.1) 100%)',
          border: '1px solid rgba(34,197,94,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(34,197,94,.2)',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13H12L11 22l8.5-11H13L13 2z"
              fill="url(#lg)" stroke="none" />
            <defs>
              <linearGradient id="lg" x1="4.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div style={{
          fontSize: 38, fontWeight: 900, letterSpacing: -1.5,
          background: 'linear-gradient(90deg, #fff 20%, #4ade80 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          GymLog
        </div>
        <div style={{ fontSize: 14, color: 'var(--hint)', marginTop: 8, fontWeight: 500, letterSpacing: '0.01em' }}>
          Track every rep. Beat every session.
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24, padding: '28px 24px 32px',
        position: 'relative', zIndex: 1,
        boxShadow: '0 0 0 1px rgba(255,255,255,.03), 0 24px 48px rgba(0,0,0,.5)',
        animation: 'fadeUp .5s ease .1s both',
      }}>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg)',
          borderRadius: 12, padding: 4, marginBottom: 28,
          border: '1px solid var(--border-s)',
        }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 14, fontWeight: 700,
              background: tab === t ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'transparent',
              color: tab === t ? '#000' : 'var(--hint)',
              boxShadow: tab === t ? '0 0 16px rgba(34,197,94,.3)' : 'none',
              transition: 'all .18s',
            }}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            background: googleLoading ? 'var(--surface2)' : '#fff',
            color: googleLoading ? 'var(--hint)' : '#111',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 16,
            boxShadow: googleLoading ? 'none' : '0 2px 12px rgba(0,0,0,0.3)',
            transition: 'all .18s',
            opacity: (googleLoading || loading) ? 0.7 : 1,
          }}
        >
          {googleLoading ? (
            <div style={{ width: 18, height: 18, border: '2px solid #ccc', borderTopColor: '#555', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-d)' }} />
          <span style={{ fontSize: 12, color: 'var(--hint)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-d)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="var(--hint)" strokeWidth="1.4" />
                <path d="M1.5 5.5l6.5 4 6.5-4" stroke="var(--hint)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '15px 14px 15px 40px',
                borderRadius: 14, fontSize: 15,
                background: 'var(--bg)',
                border: '1px solid var(--border-d)',
                color: '#fff', outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="var(--hint)" strokeWidth="1.4" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="var(--hint)" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="10.5" r="1" fill="var(--hint)" />
              </svg>
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '15px 14px 15px 40px',
                borderRadius: 14, fontSize: 15,
                background: 'var(--bg)',
                border: '1px solid var(--border-d)',
                color: '#fff', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13, color: '#ff6b6b', padding: '10px 14px',
              background: 'rgba(255,68,68,.08)', borderRadius: 10,
              border: '1px solid rgba(255,68,68,.15)',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              fontSize: 13, color: '#4ade80', padding: '10px 14px',
              background: 'rgba(34,197,94,.08)', borderRadius: 10,
              border: '1px solid rgba(34,197,94,.2)',
            }}>{success}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px 0', borderRadius: 14,
            fontSize: 16, fontWeight: 900,
            background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
            color: loading ? 'var(--hint)' : '#000',
            marginTop: 4, letterSpacing: -0.2,
            boxShadow: loading ? 'none' : '0 0 28px rgba(34,197,94,.4), 0 4px 16px rgba(0,0,0,.4)',
            transition: 'all .18s',
          }}>
            {loading ? '…' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28, fontSize: 12, color: 'var(--disabled)',
        position: 'relative', zIndex: 1, animation: 'fadeUp .5s ease .2s both',
      }}>
        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }} style={{
          color: '#22c55e', fontWeight: 700, fontSize: 12, background: 'none',
        }}>
          {tab === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  )
}
