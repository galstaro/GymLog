import { useState, useMemo } from 'react'
import { getSwaps, PAIN_TAG } from '../lib/swaps.js'

const REASONS = [
  { id: 'machine_taken', label: 'Machine taken', icon: '🚫' },
  { id: 'something_hurts', label: 'Something hurts', icon: '🤕' },
  { id: 'no_equipment', label: 'No equipment', icon: '🏠' },
  { id: 'variety', label: 'Want variety', icon: '🔀' },
]

const PAIN_LOCS = ['Shoulder', 'Elbow', 'Wrist', 'Lower Back']

/**
 * SmartSwap bottom sheet
 * Props:
 *   block        — the exercise block ({ exercise, sets, lastSets })
 *   onSwap(name, suggestedWeight)  — called when user confirms swap
 *   onClose()    — called on dismiss
 */
export default function SmartSwap({ block, onSwap, onClose }) {
  const [step, setStep] = useState(1)        // 1 reason | 2 pain | 3 results | 4 confirm
  const [reason, setReason] = useState(null)
  const [painLoc, setPainLoc] = useState(null)
  const [selected, setSelected] = useState(null)

  // Determine the best reference weight from the block
  const origWeight = useMemo(() => {
    const doneSets = block.sets.filter(s => s.done)
    if (doneSets.length) return Math.max(...doneSets.map(s => parseFloat(s.weight) || 0))
    if (block.lastSets?.length) return Math.max(...block.lastSets.map(s => s.weight_kg || 0))
    return 0
  }, [block])

  function suggestedWeight(ratio) {
    if (!ratio || !origWeight) return null
    return Math.round(origWeight * ratio * 2) / 2   // nearest 0.5
  }

  // Compute suggestions when entering step 3
  const suggestions = useMemo(() => {
    if (step < 3) return []
    const tag = reason === 'something_hurts'
      ? PAIN_TAG[painLoc]
      : reason
    return getSwaps(block.exercise.name, tag)
  }, [step, reason, painLoc, block.exercise.name])

  function handleReasonPick(id) {
    setReason(id)
    if (id === 'something_hurts') {
      setStep(2)
    } else {
      setStep(3)
    }
  }

  function handlePainPick(loc) {
    setPainLoc(loc)
    setStep(3)
  }

  function handleSelect(swap) {
    setSelected(swap)
    setStep(4)
  }

  function handleConfirm() {
    if (!selected) return
    onSwap(selected.name, suggestedWeight(selected.ratio))
    onClose()
  }

  const totalSteps = reason === 'something_hurts' ? 4 : 3

  return (
    <>
      {/* Blur overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 91,
        maxWidth: 430, margin: '0 auto',
        background: '#161616',
        borderRadius: '22px 22px 0 0',
        border: '1px solid #252525',
        borderBottom: 'none',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        animation: 'slideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1) both',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333' }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 16 }}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const dotStep = i + 1
            const active = dotStep === step
            const done = dotStep < step
            return (
              <div key={i} style={{
                width: active ? 20 : 6, height: 6,
                borderRadius: 3,
                background: active ? '#4ade80' : done ? 'rgba(74,222,128,0.4)' : '#2a2a2a',
                transition: 'all 0.25s ease',
                boxShadow: active ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
              }} />
            )
          })}
        </div>

        {/* Back button — steps 2, 3, 4 */}
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              position: 'absolute', top: 20, left: 16,
              background: 'none', color: '#4a4a60',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 16,
            background: 'none', color: '#4a4a60', fontSize: 22, lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ padding: '0 20px 24px' }}>

          {/* ── STEP 1: Reason ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Smart Swap
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
                  Why swap <span style={{ color: '#4ade80' }}>{block.exercise.name}</span>?
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleReasonPick(r.id)}
                    style={{
                      background: '#1c1c1c',
                      border: '1px solid #252525',
                      borderRadius: 16,
                      padding: '20px 14px',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onPointerEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.06)' }}
                    onPointerLeave={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = '#1c1c1c' }}
                  >
                    <span style={{ fontSize: 26 }}>{r.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e2e8', lineHeight: 1.2 }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 2: Pain location ───────────────────────── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Smart Swap · Step 2
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
                  Where does it hurt?
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PAIN_LOCS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => handlePainPick(loc)}
                    style={{
                      background: '#1c1c1c',
                      border: '1px solid #252525',
                      borderRadius: 14,
                      padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onPointerEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.06)' }}
                    onPointerLeave={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = '#1c1c1c' }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e2e8' }}>{loc}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="#4a4a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Suggestions ─────────────────────────── */}
          {step === 3 && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Smart Swap · Suggestions
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
                  Pick an alternative
                </div>
              </div>

              {suggestions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#555', fontSize: 14, padding: '32px 0' }}>
                  No suggestions found. Try a different reason.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map((swap) => {
                    const sw = suggestedWeight(swap.ratio)
                    return (
                      <button
                        key={swap.name}
                        onClick={() => handleSelect(swap)}
                        style={{
                          background: '#1c1c1c',
                          border: '1px solid #252525',
                          borderRadius: 16,
                          padding: '16px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          textAlign: 'left',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onPointerEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.background = 'rgba(74,222,128,0.06)' }}
                        onPointerLeave={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = '#1c1c1c' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{swap.name}</div>
                          <div style={{ fontSize: 12, color: '#666', fontWeight: 500, lineHeight: 1.4 }}>{swap.reason}</div>
                        </div>
                        {sw !== null && (
                          <div style={{
                            background: 'rgba(74,222,128,0.12)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 10, padding: '6px 10px',
                            fontSize: 13, fontWeight: 800, color: '#4ade80',
                            whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            ~{sw} kg
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── STEP 4: Confirmation ────────────────────────── */}
          {step === 4 && selected && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Smart Swap · Confirm
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
                  Swap to this exercise?
                </div>
              </div>

              {/* From → To */}
              <div style={{
                background: '#1c1c1c', border: '1px solid #252525',
                borderRadius: 16, padding: '18px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 4 }}>FROM</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#888' }}>{block.exercise.name}</div>
                </div>
                <div style={{ fontSize: 20, color: '#4ade80', flexShrink: 0 }}>⇄</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>TO</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{selected.name}</div>
                </div>
              </div>

              {/* Reason */}
              <div style={{
                background: '#1c1c1c', border: '1px solid #252525',
                borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 4 }}>WHY THIS SWAP</div>
                <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>{selected.reason}</div>
              </div>

              {/* Weight suggestion */}
              {(() => {
                const sw = suggestedWeight(selected.ratio)
                return sw !== null ? (
                  <div style={{
                    background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                    borderRadius: 14, padding: '14px 16px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 2 }}>SUGGESTED WEIGHT</div>
                      <div style={{ fontSize: 12, color: '#555' }}>Based on your {block.exercise.name} history</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80', textShadow: '0 0 12px rgba(74,222,128,.5)' }}>
                      {sw} kg
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }} />
                )
              })()}

              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 16 }}>
                This only affects this session — your exercise list stays the same.
              </div>

              <button
                onClick={handleConfirm}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 14,
                  fontSize: 16, fontWeight: 900,
                  background: 'linear-gradient(135deg, #22c55e, #4ade80)',
                  color: '#000',
                  boxShadow: '0 0 24px rgba(74,222,128,.4)',
                  letterSpacing: -0.2,
                }}
              >
                Use this exercise
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
