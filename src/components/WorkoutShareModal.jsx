import { useState, useEffect, useRef } from 'react'
import { toPng } from 'html-to-image'
import ShareableCard from './ShareableCard.jsx'

function buildHeroStat(shareData) {
  const { totalVolume, prExercise, currentStreak, workoutNumber } = shareData

  if (prExercise) {
    return {
      type: 'pr',
      displayValue: `${prExercise.weight}kg`,
      label: prExercise.name,
      subLabel: 'New Record 🏆',
    }
  }
  if (totalVolume >= 1000) {
    return {
      type: 'volume',
      displayValue: totalVolume.toLocaleString(),
      label: 'Total Volume',
      subLabel: null,
    }
  }
  return {
    type: 'session',
    displayValue: `#${workoutNumber}`,
    label: `${currentStreak} week streak 🔥`,
    subLabel: null,
  }
}

export default function WorkoutShareModal({ shareData, onContinue }) {
  const cardRef = useRef(null)
  const [displayVolume, setDisplayVolume] = useState(0)
  const [sharing, setSharing] = useState(false)
  const heroStat = buildHeroStat(shareData)

  // Count-up animation over 1.5s
  useEffect(() => {
    const target = shareData.totalVolume
    if (!target) return
    const duration = 1500
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayVolume(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [shareData.totalVolume])

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'gymlog-workout.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Workout — GymLog' })
      } else {
        // Fallback: download
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'gymlog-workout.png'
        a.click()
      }
    } catch (e) {
      if (e?.name !== 'AbortError') console.error('share failed:', e)
    } finally {
      setSharing(false)
      onContinue()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 32px',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Card — scaled to fit screen width with margin */}
      <div style={{
        animation: 'cardEntrance 400ms ease-out forwards',
        width: '100%', display: 'flex', justifyContent: 'center',
        marginBottom: 28, position: 'relative', zIndex: 1,
      }}>
        {/* Scale wrapper: card is 375px wide, scale down to fit within 32px margins */}
        <div style={{
          transform: `scale(${Math.min(1, (window.innerWidth - 64) / 375)})`,
          transformOrigin: 'top center',
        }}>
          <ShareableCard
            ref={cardRef}
            heroStat={heroStat}
            stats={{
              duration: shareData.duration,
              totalSets: shareData.totalSets,
              musclesWorked: shareData.musclesWorked,
            }}
            displayVolume={displayVolume}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: 375 - 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: '100%', height: 52, borderRadius: 16,
            fontSize: 16, fontWeight: 900, color: '#000',
            background: sharing ? '#1e1e1e' : '#4ade80',
            letterSpacing: -0.3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .15s',
          }}
        >
          {sharing ? (
            <div style={{ width: 18, height: 18, border: '2px solid #555', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h2" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Share
            </>
          )}
        </button>

        <button
          onClick={onContinue}
          style={{ fontSize: 13, color: '#444', background: 'none', padding: '6px 0' }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
