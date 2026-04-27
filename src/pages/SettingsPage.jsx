import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, signOut } from '../hooks/useAuth.jsx'
import BottomNav from '../components/BottomNav.jsx'

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
  }, [user])

  async function saveName() {
    if (!name.trim()) return
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      // Delete all user data in order (sets first due to FK)
      await supabase.from('sets').delete().eq('user_id', user.id)
      await supabase.from('workouts').delete().eq('user_id', user.id)
      await supabase.from('exercises').delete().eq('user_id', user.id)
    } finally {
      await signOut()
    }
  }

  return (
    <div style={{ flex: 1, paddingBottom: 'var(--page-pb)', background: '#0a0a0a' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: '50%', background: '#181818', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Settings</div>
      </div>

      {/* Profile section */}
      <div style={{ margin: '0 16px 6px', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Profile</div>
      <div style={{ margin: '8px 16px 20px', background: '#131313', borderRadius: 18, border: '1px solid #1e1e1e', padding: '16px' }}>
        <div style={{ fontSize: 12, color: '#555', fontWeight: 600, marginBottom: 10 }}>Display name</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            placeholder="Your name"
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff', fontSize: 15, outline: 'none', minHeight: 48 }}
          />
          <button onClick={saveName} disabled={saving || !name.trim()} style={{
            padding: '12px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, minHeight: 48,
            background: saved ? 'rgba(34,197,94,.15)' : '#22c55e',
            color: saved ? '#22c55e' : '#000',
            border: saved ? '1px solid rgba(34,197,94,.3)' : 'none',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? '…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>{user?.email}</div>
      </div>

      {/* Account section */}
      <div style={{ margin: '0 16px 6px', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Account</div>
      <div style={{ margin: '8px 16px 20px', background: '#131313', borderRadius: 18, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
        <button onClick={() => signOut()} style={{
          width: '100%', padding: '16px', minHeight: 56, textAlign: 'left',
          fontSize: 15, fontWeight: 600, color: '#999',
          borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="#666" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M13 14l4-4-4-4M17 10H8" stroke="#666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign Out
        </button>
        <button onClick={() => setDeleteConfirm(true)} style={{
          width: '100%', padding: '16px', minHeight: 56, textAlign: 'left',
          fontSize: 15, fontWeight: 600, color: '#ff4444',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M8 5V3h4v2M6 5l1 12h6l1-12" stroke="#ff4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Delete Account
        </button>
      </div>

      {/* App info */}
      <div style={{ margin: '0 16px', textAlign: 'center', color: '#333', fontSize: 12, paddingTop: 8 }}>
        GymLog · Track every rep. Beat every session.
      </div>

      {/* Delete confirmation sheet */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: '#141414', borderRadius: '20px 20px 0 0', padding: '28px 20px 52px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Delete Account?</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 6, lineHeight: 1.6 }}>
              This will permanently delete all your workouts, sets, and exercise history. This cannot be undone.
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
              Type <span style={{ color: '#ff4444', fontWeight: 700 }}>DELETE</span> to confirm:
            </div>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '13px 14px', marginBottom: 16, borderRadius: 12, background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#fff', fontSize: 15, outline: 'none', minHeight: 48 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDeleteConfirm(false); setDeleteInput('') }} style={{ flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 600, background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a', minHeight: 52 }}>
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                style={{
                  flex: 1, padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, minHeight: 52,
                  background: deleteInput === 'DELETE' ? 'rgba(255,68,68,.15)' : '#1a1a1a',
                  color: deleteInput === 'DELETE' ? '#ff4444' : '#444',
                  border: deleteInput === 'DELETE' ? '1px solid rgba(255,68,68,.3)' : '1px solid #2a2a2a',
                  opacity: deleting ? 0.6 : 1,
                }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
