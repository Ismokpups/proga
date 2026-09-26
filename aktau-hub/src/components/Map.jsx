import { useEffect, useRef, useState } from 'react'
import { AKTAU_CENTER, AKTAU_ZOOM, CATEGORIES, YANDEX_API_KEY } from '../lib/constants'

// Dynamically inject Yandex Maps script once
function loadYandexMaps() {
  return new Promise((resolve, reject) => {
    if (window.ymaps) { resolve(window.ymaps); return }
    if (document.getElementById('ymaps-script')) {
      const check = setInterval(() => {
        if (window.ymaps) { clearInterval(check); resolve(window.ymaps) }
      }, 100)
      return
    }
    const script = document.createElement('script')
    script.id = 'ymaps-script'
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YANDEX_API_KEY}`
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps))
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Color → Yandex preset map
const COLOR_PRESET = {
  '#2563EB': 'islands#blueDotIcon',
  '#7C3AED': 'islands#violetDotIcon',
  '#10B981': 'islands#greenDotIcon',
  '#F59E0B': 'islands#yellowDotIcon',
  '#EF4444': 'islands#redDotIcon',
}

export default function Map({ events, activeFilters, onFilterToggle }) {
  const mapRef   = useRef(null)
  const ymapRef  = useRef(null)
  const markerRef = useRef([]) // {id, placemark}
  const [ready, setReady] = useState(false)

  // Init map
  useEffect(() => {
    loadYandexMaps().then(ymaps => {
      if (ymapRef.current) return
      ymapRef.current = new ymaps.Map(mapRef.current, {
        center: AKTAU_CENTER,
        zoom: AKTAU_ZOOM,
        controls: ['zoomControl', 'fullscreenControl'],
      }, { searchControlProvider: 'yandex#search' })
      setReady(true)
    })
  }, [])

  // Sync markers when events or filters change
  useEffect(() => {
    if (!ready || !ymapRef.current) return
    const ymaps = window.ymaps

    // Remove all existing markers
    markerRef.current.forEach(({ placemark }) => ymapRef.current.geoObjects.remove(placemark))
    markerRef.current = []

    const visible = events.filter(ev => activeFilters.includes(ev.category_id))

    visible.forEach(ev => {
      if (!ev.location_lat || !ev.location_lng) return
      const cat = CATEGORIES.find(c => c.id === ev.category_id) || CATEGORIES[0]
      const preset = COLOR_PRESET[cat.mapColor] || 'islands#blueDotIcon'

      const balloon = `
        <div style="font-family:Inter,sans-serif;padding:12px 14px;min-width:220px;max-width:260px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="background:${cat.color};color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px">${cat.emoji} ${cat.name}</span>
          </div>
          <h3 style="font-size:14px;font-weight:700;color:#1E293B;margin:0 0 4px">${escapeHtml(ev.title)}</h3>
          <p style="font-size:12px;color:#64748B;margin:0 0 6px">
            📅 ${formatDate(ev.date)}
          </p>
          <p style="font-size:12px;color:#64748B;margin:0;line-height:1.5">${escapeHtml(ev.description || '')}</p>
        </div>
      `

      const placemark = new ymaps.Placemark(
        [ev.location_lat, ev.location_lng],
        { balloonContentBody: balloon, hintContent: ev.title },
        { preset, balloonCloseButton: true, hideIconOnBalloonOpen: false }
      )
      ymapRef.current.geoObjects.add(placemark)
      markerRef.current.push({ id: ev.id, placemark })
    })
  }, [events, activeFilters, ready])

  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Filter pills overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap gap-2 justify-center px-4 max-w-full">
        {CATEGORIES.map(cat => {
          const active = activeFilters.includes(cat.id)
          return (
            <button key={cat.id} onClick={() => onFilterToggle(cat.id)}
              className="map-pill"
              style={active ? { background: cat.color, color: 'white', borderColor: cat.color } : {}}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          )
        })}
      </div>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
          style={{ background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(6px)' }}>
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-3"
            style={{ borderColor: '#0F4C81', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium" style={{ color: '#64748B' }}>Загрузка карты Актау...</p>
        </div>
      )}

      {/* Recenter button */}
      {ready && (
        <button
          onClick={() => ymapRef.current?.setCenter(AKTAU_CENTER, AKTAU_ZOOM, { duration: 500 })}
          className="absolute bottom-6 right-4 z-10 w-10 h-10 rounded-xl shadow-lg flex items-center justify-center text-white transition hover:scale-105"
          style={{ background: '#0F4C81' }}
          title="Сбросить к центру"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}
    </div>
  )
}

function escapeHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}
