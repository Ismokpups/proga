import { useState, useEffect, useCallback } from 'react'
import Map from './Map'
import Feed from './Feed'
import OrganizerPanel from './OrganizerPanel'
import { fetchEvents } from '../lib/supabase'
import { CATEGORIES } from '../lib/constants'

const TABS = [
  { id: 'feed',   label: 'Лента',        icon: '📰' },
  { id: 'add',    label: 'Организатор',  icon: '🤖' },
]

export default function Hub({ user, onLogout }) {
  const [events, setEvents]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeFilters, setActiveFilters] = useState(CATEGORIES.map(c => c.id)) // all on
  const [sideTab, setSideTab]             = useState('feed')
  const [notifCount, setNotifCount]       = useState(0)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEvents()
      setEvents(data)
      // Notification count: new events matching user interests (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 864e5)
      const newCount = data.filter(e =>
        user.interests.includes(e.category_id) &&
        new Date(e.created_at) > weekAgo
      ).length
      setNotifCount(newCount)
    } catch (e) {
      console.error('fetchEvents:', e)
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => { loadEvents() }, [loadEvents])

  function toggleFilter(catId) {
    setActiveFilters(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#F8FAFC' }}>
      {/* ── Top Nav ── */}
      <header className="flex items-center justify-between px-5 py-3 shadow-sm border-b z-20 flex-shrink-0"
        style={{ background: '#0F4C81', borderColor: '#0a3560' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Aktau Hub</h1>
            <p className="text-blue-200 text-xs">Привет, {user.name}! 👋</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bell */}
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white/10"
            onClick={() => { setNotifCount(0); setSideTab('feed') }}>
            <span className="text-xl">🔔</span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse-dot"
                style={{ background: '#F97316', color: 'white' }}>
                {notifCount}
              </span>
            )}
          </button>

          {/* Admin link */}
          <a href="/admin"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:bg-white/10 text-blue-100">
            🏛️ Акимат
          </a>

          {/* Logout */}
          <button onClick={onLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-blue-100 hover:bg-white/10">
            Выйти
          </button>
        </div>
      </header>

      {/* ── Main layout: map left, panel right ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — left 60% */}
        <div className="flex-1 relative">
          <Map events={events} activeFilters={activeFilters} onFilterToggle={toggleFilter} />
        </div>

        {/* Right panel — 380px fixed */}
        <div className="w-[380px] flex-shrink-0 flex flex-col border-l" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
          {/* Tab bar */}
          <div className="flex border-b px-3 pt-3 gap-1 flex-shrink-0" style={{ borderColor: '#F1F5F9' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setSideTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all"
                style={sideTab === t.id
                  ? { background: '#0F4C81', color: 'white' }
                  : { color: '#64748B' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {sideTab === 'feed' && (
              <Feed events={events} userInterests={user.interests} loading={loading} />
            )}
            {sideTab === 'add' && (
              <OrganizerPanel onEventAdded={() => { loadEvents(); setSideTab('feed') }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
