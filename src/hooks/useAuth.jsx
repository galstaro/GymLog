import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_EXERCISES } from '../lib/exercises'

const ensuredUsers = new Set()

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureExercises(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureExercises(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

async function ensureExercises(userId) {
  if (ensuredUsers.has(userId)) return
  ensuredUsers.add(userId)

  const { data } = await supabase
    .from('exercises')
    .select('id, name')
    .eq('user_id', userId)
    .order('id', { ascending: true })

  const existing = data || []

  // Insert any default exercises that don't exist yet (handles new additions)
  const existingNames = new Set(existing.map(e => e.name))
  const missing = DEFAULT_EXERCISES.filter(e => !existingNames.has(e.name))
  if (missing.length > 0) {
    await supabase.from('exercises').insert(missing.map(e => ({ ...e, user_id: userId })))
  }

  // Dedup: keep lowest id per name
  const seen = new Map()
  const toDelete = []
  for (const ex of existing) {
    if (seen.has(ex.name)) toDelete.push(ex.id)
    else seen.set(ex.name, ex.id)
  }
  if (toDelete.length > 0) {
    await supabase.from('exercises').delete().in('id', toDelete)
  }
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
