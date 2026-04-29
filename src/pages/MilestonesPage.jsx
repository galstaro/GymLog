import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { MILESTONES } from '../lib/milestones.js'
import BottomNav from '../components/BottomNav.jsx'

const GROUPS = [
  { label: 'Workouts', type: 'workout_count' },
  { label: 'Streak',   type: 'streak_weeks'  },
  { label: 'Volume',   type: 'volume_kg'     },
]

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtVolume(v) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return Math.round(v).toString()
}

export default function MilestonesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(null) // Map<milestone_id, unlocked_at>
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [mRes, sRes] = await Promise.all([
        supabase.from('user_milestones').select('milestone_id, unlocked_at').eq('user_id', user.id),
        supabase.from('user_settings').select('current_streak, longest_streak, total_workouts, total_volume_kg')
          .eq('user_id', user.id).maybeSingle(),
      ])
      const map = new Map()
      for (const m of (mRes.data || [])) map.set(m.milestone_id, m.unlocked_at)
      setUnlocked(map)
      setSettings(sRes.data || {})
    }
    load()
  }, [user])

  const unlockedCount = unlocked?.size || 0

  return (
    <div style={{ flex: 1, paddingBottom: 'var(--page-pb)', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 8px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Milestones</div>
          <div style={{ fontSize: 12, color: 'var(--hint)', marginTop: 1 }}>
            {unlocked === null ? '…' : `${unlockedCount} / ${MILESTONES.length} unlocked`}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {settings && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '12px 16px 20px' }}>
          {[
            { label: 'Workouts', value: settings.total_workouts ?? 0 },
            { label: 'Best streak', value: `${settings.longest_streak ?? 0}w` },
            { label: 'Volume lifted', value: `${fmtVolume(settings.total_volume_kg ?? 0)} kg` },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--hint)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Groups */}
      {GROUPS.map(group => {
        const items = MILESTONES.filter(m => m.type === group.type)
        return (
          <div key={group.type} style={{ marginBottom: 24 }}>
            {/* Section header */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--hint)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{group.label}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-s)' }} />
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, margin: '0 16px' }}>
              {items.map(m => {
                const unlockedAt = unlocked?.get(m.id)
                const isUnlocked = !!unlockedAt

                return (
                  <div key={m.id} style={{
                    background: isUnlocked ? 'var(--surface)' : 'var(--surface2)',
                    borderRadius: 16,
                    border: `1px solid ${isUnlocked ? 'rgba(74,222,128,0.2)' : 'var(--border-s)'}`,
                    padding: '18px 14px',
                    opacity: isUnlocked ? 1 : 0.6,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: isUnlocked ? '0 0 16px rgba(74,222,128,.06)' : 'none',
                  }}>
                    {/* Icon */}
                    <div style={{ fontSize: 32, lineHeight: 1 }}>
                      {isUnlocked ? m.icon : '🔒'}
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: isUnlocked ? '#fff' : 'var(--hint)', lineHeight: 1.2 }}>
                      {m.title}
                    </div>

                    {/* Sub-line */}
                    <div style={{ fontSize: 11, color: isUnlocked ? '#4ade80' : 'var(--disabled)', fontWeight: 500, lineHeight: 1.3 }}>
                      {isUnlocked ? fmtDate(unlockedAt) : m.statLabel}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <BottomNav />
    </div>
  )
}
