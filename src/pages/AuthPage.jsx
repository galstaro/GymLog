import { useState } from 'react'
import { signIn, signUp } from '../hooks/useAuth.jsx'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh', overflowY: 'auto', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,255,136,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="fade-up" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20, marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(0,255,136,.15) 0%, rgba(0,229,255,.1) 100%)',
            border: '1.5px solid rgba(0,255,136,.3)',
            boxShadow: '0 0 32px rgba(0,255,136,.2)',
          }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="13" width="6" height="6" rx="2" fill="#00ff88"/>
              <rect x="24" y="13" width="6" height="6" rx="2" fill="#00ff88"/>
              <rect x="7" y="9" width="4" height="14" rx="2" fill="#00ff88"/>
              <rect x="21" y="9" width="4" height="14" rx="2" fill="#00ff88"/>
              <rect x="11" y="12" width="10" height="8" rx="2" fill="#00ff88"/>
            </svg>
          </div>
          <h1 className="grad" style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>
            GYMLOG
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, letterSpacing: '.05em' }}>
            TRACK · PROGRESS · DOMINATE
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid rgba(0,255,136,.12)',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 0 60px rgba(0,255,136,.05)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg)', borderRadius: 12, padding: 4 }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 700,
                letterSpacing: '.04em', textTransform: 'uppercase', transition: 'all .2s',
                background: mode === m ? 'linear-gradient(120deg,#00ff88,#00e5ff)' : 'transparent',
                color: mode === m ? '#000' : 'var(--muted)',
                boxShadow: mode === m ? '0 0 18px rgba(0,255,136,.35)' : 'none',
              }}>
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(255,45,85,.08)', color: '#ff2d55', border: '1px solid rgba(255,45,85,.2)',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              marginBottom: 16, padding: '12px 14px', borderRadius: 10, fontSize: 13,
              background: 'rgba(0,255,136,.06)', color: '#00ff88', border: '1px solid rgba(0,255,136,.2)',
            }}>{success}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['email','password'].map(field => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  {field}
                </label>
                <input
                  type={field}
                  required
                  value={field === 'email' ? email : password}
                  onChange={e => field === 'email' ? setEmail(e.target.value) : setPassword(e.target.value)}
                  placeholder={field === 'email' ? 'you@example.com' : '••••••••'}
                  autoComplete={field === 'email' ? 'email' : mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={field === 'password' ? 6 : undefined}
                  style={{
                    width: '100%', padding: '13px 14px', borderRadius: 12, fontSize: 15,
                    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                    outline: 'none', transition: 'border-color .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,.5)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className={loading ? '' : 'glow'}
              style={{
                marginTop: 6, width: '100%', padding: '15px 0', borderRadius: 14,
                fontWeight: 800, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase',
                background: 'linear-gradient(120deg, #00ff88 0%, #00e5ff 100%)',
                color: '#000', opacity: loading ? .6 : 1, transition: 'opacity .2s',
              }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
