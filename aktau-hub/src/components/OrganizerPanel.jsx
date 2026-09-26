import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/constants'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// ── AI Parser using Gemini (replaces OpenAI for free tier) ──────────────────
async function parseEventWithGemini(text) {
  const prompt = `Извлеки информацию о мероприятии из текста и верни СТРОГИЙ JSON без Markdown-оберток.
Поля: title (string), date (ISO 8601 datetime), category_id (число: 1=IT, 2=Дебаты, 3=Волонтерство, 4=Олимпиады, 5=Спорт), location_lat (float, Актау ~43.648), location_lng (float, Актау ~51.168), description (string).
Текст: "${text}"
ОТВЕТ (только JSON):`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    }
  )
  const json = await res.json()
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
  // Strip markdown fences if any
  const clean = raw.replace(/```json?/gi, '').replace(/```/g, '').trim()
  return JSON.parse(clean)
}

export default function OrganizerPanel({ onEventAdded }) {
  const [text, setText]     = useState('')
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true); setError(''); setParsed(null); setSaved(false)
    try {
      const result = await parseEventWithGemini(text)
      setParsed(result)
    } catch (e) {
      setError('Ошибка парсинга: ' + (e.message || 'Проверьте API ключ'))
    } finally { setLoading(false) }
  }

  async function handleSave() {
    if (!parsed) return
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.from('events').insert([{
        title: parsed.title,
        description: parsed.description,
        date: parsed.date,
        category_id: parsed.category_id,
        location_lat: parsed.location_lat,
        location_lng: parsed.location_lng,
      }])
      if (err) throw err
      setSaved(true)
      onEventAdded?.()
      setTimeout(() => { setParsed(null); setText(''); setSaved(false) }, 2500)
    } catch (e) {
      setError('Ошибка сохранения: ' + e.message)
    } finally { setLoading(false) }
  }

  const catName = parsed ? CATEGORIES.find(c => c.id === parsed.category_id)?.name : ''

  return (
    <div className="p-5 space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow"
          style={{ background: '#F97316' }}>🤖</div>
        <div>
          <h2 className="font-bold text-base" style={{ color: '#1E293B' }}>AI-парсер мероприятий</h2>
          <p className="text-xs" style={{ color: '#64748B' }}>Вставь текст объявления — Gemini AI сам заполнит форму</p>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#64748B' }}>
          📋 Текст объявления / голосовое описание
        </label>
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={5}
          placeholder="Например: Хакатон по ИИ в IT Hub Актау, 15 октября 2026, начало в 10:00. Участвуют школьники 9-11 классов. Призовой фонд 200 000 тенге."
          className="w-full border-2 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
          onFocus={e => e.target.style.borderColor = '#0F4C81'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />
      </div>

      <button onClick={handleParse} disabled={loading || !text.trim()}
        className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(90deg, #0F4C81, #1a6bb5)', boxShadow: '0 4px 18px rgba(15,76,129,0.3)' }}
      >
        {loading ? <><span className="animate-spin">⏳</span> Анализирую...</> : '✨ Распознать через Gemini AI'}
      </button>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Parsed result */}
      {parsed && !saved && (
        <div className="animate-fade-up rounded-2xl border-2 p-4 space-y-3"
          style={{ borderColor: '#0F4C81' + '30', background: '#0F4C81' + '06' }}>
          <h3 className="font-bold text-sm" style={{ color: '#0F4C81' }}>✅ Распознано — проверьте данные:</h3>
          {[
            ['📌 Название', parsed.title],
            ['📅 Дата', parsed.date],
            ['🏷️ Категория', `${catName} (ID: ${parsed.category_id})`],
            ['📍 Координаты', `${parsed.location_lat}, ${parsed.location_lng}`],
            ['📝 Описание', parsed.description],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#64748B' }}>{label}</div>
              <div className="text-sm font-medium" style={{ color: '#1E293B' }}>{val || '—'}</div>
            </div>
          ))}
          <button onClick={handleSave} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(90deg, #F97316, #ea6c0a)', boxShadow: '0 4px 18px rgba(249,115,22,0.35)' }}
          >
            {loading ? '⏳ Сохраняем...' : '💾 Опубликовать на карте'}
          </button>
        </div>
      )}

      {saved && (
        <div className="animate-fade-up p-4 rounded-2xl text-center"
          style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}>
          <span className="text-2xl">🎉</span>
          <p className="font-bold mt-2" style={{ color: '#166534' }}>Мероприятие добавлено на карту!</p>
        </div>
      )}

      {/* Hint */}
      <div className="p-4 rounded-xl text-xs space-y-1.5" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
        <p className="font-semibold" style={{ color: '#9A3412' }}>💡 Как это работает:</p>
        <p style={{ color: '#C2410C' }}>1. Вставь любой текст объявления о мероприятии</p>
        <p style={{ color: '#C2410C' }}>2. Gemini AI извлечёт название, дату, место и категорию</p>
        <p style={{ color: '#C2410C' }}>3. Нажми «Опубликовать» — маркер появится на карте</p>
      </div>
    </div>
  )
}
