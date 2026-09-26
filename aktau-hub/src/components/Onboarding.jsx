import { useState, useEffect } from 'react'
import { CATEGORIES } from '../lib/constants'
import { saveLocalUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'

const INTEREST_ICONS = { IT: '💻', 'Дебаты': '🎙️', 'Волонтерство': '🤝', 'Олимпиады': '🏆', 'Спорт': '⚽' }

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [selectedCats, setSelectedCats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleCat(id) {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!name.trim() || !age || selectedCats.length === 0) {
      setError('Заполните все поля и выберите хотя бы один интерес')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Insert user into Supabase
      const { data: user, error: uErr } = await supabase
        .from('users')
        .insert([{ name: name.trim(), age: parseInt(age) }])
        .select()
        .single()
      if (uErr) throw uErr

      // Insert user_interests
      const interests = selectedCats.map(cat_id => ({ user_id: user.id, category_id: cat_id }))
      const { error: iErr } = await supabase.from('user_interests').insert(interests)
      if (iErr) throw iErr

      const profile = { id: user.id, name: user.name, age: user.age, interests: selectedCats }
      saveLocalUser(profile)
      onComplete(profile)
    } catch (e) {
      console.error(e)
      // Fallback: save locally even if DB fails
      const profile = { id: Date.now(), name: name.trim(), age: parseInt(age), interests: selectedCats }
      saveLocalUser(profile)
      onComplete(profile)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1a6bb5 50%, #0f3d6e 100%)' }}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: '#F97316', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: '#60a5fa', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl" style={{ background: '#F97316' }}>
            <span className="text-3xl">🗺️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Aktau Hub</h1>
          <p className="text-blue-200 text-sm mt-1">Мероприятия города — в одном месте</p>
        </div>

        <div className="rounded-3xl p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-7">
            {[1,2].map(s => (
              <div key={s} className="h-2 rounded-full transition-all duration-300"
                style={{ width: step === s ? 32 : 8, background: step >= s ? '#0F4C81' : '#E2E8F0' }} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: '#1E293B' }}>Расскажи о себе</h2>
                <p className="text-sm" style={{ color: '#64748B' }}>Персонализируем ленту под тебя</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#64748B' }}>Имя</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Например: Алия"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ borderColor: name ? '#0F4C81' : '#E2E8F0', color: '#1E293B' }}
                  onFocus={e => e.target.style.borderColor = '#0F4C81'}
                  onBlur={e => e.target.style.borderColor = name ? '#0F4C81' : '#E2E8F0'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#64748B' }}>Возраст</label>
                <input
                  type="number" min="10" max="35" value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="18"
                  className="w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ borderColor: age ? '#0F4C81' : '#E2E8F0', color: '#1E293B' }}
                  onFocus={e => e.target.style.borderColor = '#0F4C81'}
                  onBlur={e => e.target.style.borderColor = age ? '#0F4C81' : '#E2E8F0'}
                />
              </div>
              <button
                onClick={() => { if (!name.trim() || !age) { setError('Заполните имя и возраст'); return; } setError(''); setStep(2) }}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(90deg, #0F4C81, #1a6bb5)', boxShadow: '0 4px 20px rgba(15,76,129,0.35)' }}
              >
                Продолжить →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: '#1E293B' }}>Мои интересы</h2>
                <p className="text-sm" style={{ color: '#64748B' }}>Выбери категории, которые тебя интересуют</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => {
                  const selected = selectedCats.includes(cat.id)
                  return (
                    <button key={cat.id} onClick={() => toggleCat(cat.id)}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.97]"
                      style={{
                        borderColor: selected ? cat.color : '#E2E8F0',
                        background: selected ? cat.color + '12' : 'white',
                      }}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: selected ? cat.color : '#1E293B' }}>{cat.name}</div>
                        {selected && <div className="text-xs font-bold" style={{ color: cat.color }}>✓ Выбрано</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl font-semibold border-2 transition-all"
                  style={{ borderColor: '#E2E8F0', color: '#64748B' }}
                >← Назад</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(90deg, #F97316, #ea6c0a)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}
                >
                  {loading ? '⏳ Сохраняем...' : '🚀 Начать!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
