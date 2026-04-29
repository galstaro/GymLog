import { describe, it, expect } from 'vitest'
import { getSwaps, PAIN_TAG, REASON_TAG } from '../lib/swaps.js'
import { DEFAULT_EXERCISES } from '../lib/exercises.js'

// ── getSwaps ──────────────────────────────────────────────────────────────────

describe('getSwaps', () => {
  it('returns up to 3 results', () => {
    const results = getSwaps('Bench Press', 'machine_taken')
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('returns swaps that include the requested tag when matches exist', () => {
    const results = getSwaps('Bench Press', 'machine_taken')
    results.forEach(s => expect(s.tags).toContain('machine_taken'))
  })

  it('falls back to all swaps when no entry matches the tag', () => {
    // 'Plank' has no 'machine_taken' tag — should return generic fallback
    const results = getSwaps('Plank', 'machine_taken')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns empty array for an unknown exercise', () => {
    const results = getSwaps('Totally Made Up Exercise', 'variety')
    expect(results).toEqual([])
  })

  it('every swap result has required fields', () => {
    const results = getSwaps('Squat', 'hurts_lower_back')
    results.forEach(s => {
      expect(s).toHaveProperty('name')
      expect(s).toHaveProperty('reason')
      expect(s).toHaveProperty('ratio')
      expect(s).toHaveProperty('tags')
      expect(typeof s.name).toBe('string')
      expect(typeof s.reason).toBe('string')
      expect(Array.isArray(s.tags)).toBe(true)
    })
  })

  it('ratio is either null or a positive number', () => {
    const results = getSwaps('Overhead Press', 'variety')
    results.forEach(s => {
      if (s.ratio !== null) {
        expect(typeof s.ratio).toBe('number')
        expect(s.ratio).toBeGreaterThan(0)
      }
    })
  })

  it('handles all four reason tags without throwing', () => {
    const tags = ['machine_taken', 'no_equipment', 'variety', 'hurts_shoulder']
    tags.forEach(tag => {
      expect(() => getSwaps('Pull-up', tag)).not.toThrow()
    })
  })

  it('handles all four pain location tags', () => {
    const painTags = Object.values(PAIN_TAG)
    painTags.forEach(tag => {
      expect(() => getSwaps('Overhead Press', tag)).not.toThrow()
    })
  })
})

// ── PAIN_TAG ─────────────────────────────────────────────────────────────────

describe('PAIN_TAG', () => {
  it('maps all four pain locations', () => {
    expect(PAIN_TAG['Shoulder']).toBe('hurts_shoulder')
    expect(PAIN_TAG['Elbow']).toBe('hurts_elbow')
    expect(PAIN_TAG['Wrist']).toBe('hurts_wrist')
    expect(PAIN_TAG['Lower Back']).toBe('hurts_lower_back')
  })
})

// ── exercises.js ──────────────────────────────────────────────────────────────

describe('DEFAULT_EXERCISES', () => {
  it('has 65 exercises', () => {
    expect(DEFAULT_EXERCISES.length).toBe(65)
  })

  it('every exercise has a name and muscle_group', () => {
    DEFAULT_EXERCISES.forEach(e => {
      expect(typeof e.name).toBe('string')
      expect(e.name.length).toBeGreaterThan(0)
      expect(['chest', 'legs', 'back', 'shoulders', 'arms', 'core']).toContain(e.muscle_group)
    })
  })

  it('has no duplicate exercise names', () => {
    const names = DEFAULT_EXERCISES.map(e => e.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('covers all muscle groups', () => {
    const groups = new Set(DEFAULT_EXERCISES.map(e => e.muscle_group))
    expect(groups).toContain('chest')
    expect(groups).toContain('legs')
    expect(groups).toContain('back')
    expect(groups).toContain('shoulders')
    expect(groups).toContain('arms')
    expect(groups).toContain('core')
  })
})

// ── Suggested weight calculation (mirrors SmartSwap logic) ────────────────────

describe('suggested weight calculation', () => {
  function suggestedWeight(origWeight, ratio) {
    if (!ratio || !origWeight) return null
    return Math.round(origWeight * ratio * 2) / 2
  }

  it('rounds to nearest 0.5 kg', () => {
    // 100 × 0.55 = 55 → nearest 0.5 = 55
    expect(suggestedWeight(100, 0.55)).toBe(55)
    // 80 × 0.55 = 44 → nearest 0.5 = 44
    expect(suggestedWeight(80, 0.55)).toBe(44)
    // 60 × 0.4 = 24 → nearest 0.5 = 24
    expect(suggestedWeight(60, 0.4)).toBe(24)
    // 75 × 0.35 = 26.25 → nearest 0.5 = 26.5
    expect(suggestedWeight(75, 0.35)).toBe(26.5)
  })

  it('returns null when origWeight is 0', () => {
    expect(suggestedWeight(0, 0.5)).toBeNull()
  })

  it('returns null when ratio is null', () => {
    expect(suggestedWeight(100, null)).toBeNull()
  })

  it('always returns a value divisible by 0.5', () => {
    const weights = [30, 47.5, 62.5, 100, 120]
    const ratios = [0.35, 0.45, 0.55, 0.75, 0.9]
    weights.forEach(w => {
      ratios.forEach(r => {
        const result = suggestedWeight(w, r)
        if (result !== null) {
          expect(result % 0.5).toBe(0)
        }
      })
    })
  })
})
