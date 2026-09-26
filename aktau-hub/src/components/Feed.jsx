import { CATEGORIES } from '../lib/constants'

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) +
    ' · ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function EventCard({ event, index }) {
  const cat = CATEGORIES.find(c => c.id === event.category_id) || CATEGORIES[0]

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer animate-fade-up"
      style={{
        background: '#FFFFFF',
        borderColor: '#F1F5F9',
        animationDelay: `${index * 60}ms`
      }}
    >
      {/* Color accent bar */}
      <div className="h-1" style={{ background: cat.color }} />

      <div className="p-4">
        {/* Category + Date row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: cat.color + '18', color: cat.color }}>
            {cat.emoji} {cat.name}
          </span>
          <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
            📅 {formatDate(event.date)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-snug mb-1.5" style={{ color: '#1E293B' }}>
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: '#64748B' }}>
          {event.description || 'Подробности скоро появятся...'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: '#F1F5F9' }}>
          <span className="text-xs flex items-center gap-1" style={{ color: '#94A3B8' }}>
            📍 {event.categories?.name || cat.name}
          </span>
          <button className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: '#F97316', color: 'white' }}>
            Подробнее →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Feed({ events, userInterests, loading }) {
  const filtered = events.filter(e => userInterests.includes(e.category_id))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F1F5F9' }}>
        <div>
          <h2 className="font-bold text-base" style={{ color: '#1E293B' }}>Умная лента</h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>По вашим интересам</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: '#0F4C81' + '14', color: '#0F4C81' }}>
          {filtered.length} событий
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: '#F1F5F9' }} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-4xl mb-3">🎯</span>
            <p className="font-semibold text-sm" style={{ color: '#1E293B' }}>Пока нет мероприятий</p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>По вашим категориям ничего не найдено</p>
          </div>
        )}

        {!loading && filtered.map((ev, i) => (
          <EventCard key={ev.id} event={ev} index={i} />
        ))}
      </div>
    </div>
  )
}
