export function getMondayStr(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateStr(d)
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getLastMondayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return getMondayStr(d)
}

/**
 * Returns the streak display status given stored settings + workouts logged this week.
 * @returns {{ state: 'active'|'at_risk'|'broken'|'normal', remaining: number, currentStreak: number }}
 */
export function computeStreakStatus(settings, workoutsThisWeek) {
  const goal = settings?.weekly_workout_goal || 3
  const currentStreak = settings?.current_streak || 0
  const lastStreakWeek = settings?.last_streak_week || null

  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 6=Sat
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  const atRisk = daysUntilSunday <= 1 // Saturday or Sunday

  const goalMet = workoutsThisWeek >= goal
  const remaining = Math.max(0, goal - workoutsThisWeek)
  const lastWeekMon = getLastMondayStr()
  const broken = currentStreak > 0 && lastStreakWeek && lastStreakWeek < lastWeekMon && !goalMet

  if (broken) return { state: 'broken', remaining, currentStreak }
  if (goalMet) return { state: 'active', remaining: 0, currentStreak }
  if (atRisk) return { state: 'at_risk', remaining, currentStreak }
  return { state: 'normal', remaining, currentStreak }
}

/** True if stored streak should be reset (gap detected) */
export function isStreakBroken(settings) {
  const currentStreak = settings?.current_streak || 0
  const lastStreakWeek = settings?.last_streak_week || null
  if (!currentStreak || !lastStreakWeek) return false
  return lastStreakWeek < getLastMondayStr()
}

/** Check and fire Saturday 18:00 notification if conditions met */
export function maybeNotifyStreak(remaining) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (remaining === 0) return

  const today = new Date()
  if (today.getDay() !== 6 || today.getHours() < 18) return

  const thisWeekMon = getMondayStr()
  const key = 'gymlog_last_notif_week'
  if (localStorage.getItem(key) === thisWeekMon) return
  localStorage.setItem(key, thisWeekMon)

  new Notification('GymLog — Streak at risk! 🔥', {
    body: `You need ${remaining} more workout${remaining !== 1 ? 's' : ''} to keep your streak alive`,
    icon: '/icon-192.png',
  })
}
