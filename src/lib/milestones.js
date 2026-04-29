export const MILESTONES = [
  // Workout count
  { id: 'first_step',      title: 'First Step',       icon: '👟', type: 'workout_count', threshold: 1,       statLabel: 'First workout complete' },
  { id: 'getting_serious', title: 'Getting Serious',  icon: '💪', type: 'workout_count', threshold: 10,      statLabel: '10 workouts complete' },
  { id: 'dedicated',       title: 'Dedicated',        icon: '🏋️', type: 'workout_count', threshold: 50,      statLabel: '50 workouts complete' },
  { id: 'century_club',    title: 'Century Club',     icon: '💯', type: 'workout_count', threshold: 100,     statLabel: '100 workouts complete' },
  { id: 'elite',           title: 'Elite',            icon: '⚡', type: 'workout_count', threshold: 250,     statLabel: '250 workouts complete' },
  { id: 'legend',          title: 'Legend',           icon: '👑', type: 'workout_count', threshold: 500,     statLabel: '500 workouts complete' },
  // Streak (weeks)
  { id: 'consistent',      title: 'Consistent',       icon: '🔥', type: 'streak_weeks',  threshold: 2,       statLabel: '2-week streak' },
  { id: 'unstoppable',     title: 'Unstoppable',      icon: '🚀', type: 'streak_weeks',  threshold: 4,       statLabel: '4-week streak' },
  { id: 'warrior',         title: '3 Month Warrior',  icon: '⚔️', type: 'streak_weeks',  threshold: 12,      statLabel: '12-week streak' },
  { id: 'half_year',       title: 'Half Year Strong', icon: '🏆', type: 'streak_weeks',  threshold: 24,      statLabel: '24-week streak' },
  // Volume (kg)
  { id: 'first_ton',       title: 'First Ton',        icon: '🏗️', type: 'volume_kg',     threshold: 10000,   statLabel: '10,000 kg lifted' },
  { id: 'serious_lifter',  title: 'Serious Lifter',   icon: '🦍', type: 'volume_kg',     threshold: 100000,  statLabel: '100,000 kg lifted' },
  { id: 'monster',         title: 'Monster',          icon: '🦾', type: 'volume_kg',     threshold: 1000000, statLabel: '1,000,000 kg lifted' },
]

/**
 * Returns milestones that should now be unlocked but aren't yet.
 * @param {{ totalWorkouts, currentStreak, totalVolume }} stats
 * @param {Set<string>} unlockedIds
 */
export function checkNewMilestones(stats, unlockedIds) {
  return MILESTONES.filter(m => {
    if (unlockedIds.has(m.id)) return false
    if (m.type === 'workout_count') return stats.totalWorkouts >= m.threshold
    if (m.type === 'streak_weeks') return stats.currentStreak >= m.threshold
    if (m.type === 'volume_kg') return stats.totalVolume >= m.threshold
    return false
  })
}
