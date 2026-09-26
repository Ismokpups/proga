// Category metadata — single source of truth
export const CATEGORIES = [
  { id: 1, name: 'IT',           emoji: '💻', color: '#0F4C81', mapColor: '#2563EB' },
  { id: 2, name: 'Дебаты',       emoji: '🎙️',  color: '#7C3AED', mapColor: '#7C3AED' },
  { id: 3, name: 'Волонтерство', emoji: '🤝', color: '#059669', mapColor: '#10B981' },
  { id: 4, name: 'Олимпиады',    emoji: '🏆', color: '#D97706', mapColor: '#F59E0B' },
  { id: 5, name: 'Спорт',        emoji: '⚽', color: '#DC2626', mapColor: '#EF4444' },
]

export const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY

export const AKTAU_CENTER = [43.648, 51.168]
export const AKTAU_ZOOM   = 13
