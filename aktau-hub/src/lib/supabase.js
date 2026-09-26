import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ──────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────
export async function fetchEvents(categoryIds = []) {
  let q = supabase
    .from('events')
    .select('*, categories(name)')
    .order('date', { ascending: true })

  if (categoryIds.length > 0) {
    q = q.in('category_id', categoryIds)
  }

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function insertEvent(event) {
  const { data, error } = await supabase.from('events').insert([event]).select().single()
  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────
export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('id')
  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Users / Interests (stored in localStorage for MVP)
// ──────────────────────────────────────────────
export function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('aktau_user')) } catch { return null }
}
export function saveLocalUser(user) {
  localStorage.setItem('aktau_user', JSON.stringify(user))
}

// ──────────────────────────────────────────────
// Dashboard: Demand vs Supply
// ──────────────────────────────────────────────
export async function fetchDashboardData() {
  const [cats, interests, events] = await Promise.all([
    supabase.from('categories').select('id, name'),
    supabase.from('user_interests').select('category_id'),
    supabase.from('events').select('category_id'),
  ])
  if (cats.error || interests.error || events.error) throw cats.error || interests.error || events.error

  return cats.data.map(cat => ({
    name: cat.name,
    demand: interests.data.filter(i => i.category_id === cat.id).length,
    supply: events.data.filter(e => e.category_id === cat.id).length,
  }))
}
