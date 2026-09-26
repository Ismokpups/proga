import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'
import { fetchDashboardData } from '../lib/supabase'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 shadow-xl border text-sm"
      style={{ background: 'white', borderColor: '#E2E8F0', minWidth: 140 }}>
      <p className="font-bold mb-2" style={{ color: '#1E293B' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#64748B' }}>{p.name}:</span>
          <span className="font-bold ml-auto" style={{ color: '#1E293B' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// Stat card
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm border animate-fade-up" style={{ background: 'white', borderColor: '#F1F5F9' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
          style={{ background: color + '18' }}>{icon}</div>
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="font-semibold text-sm" style={{ color: '#1E293B' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const d = await fetchDashboardData()
      setData(d)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Ошибка загрузки данных: ' + e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalDemand = data.reduce((s, d) => s + d.demand, 0)
  const totalSupply = data.reduce((s, d) => s + d.supply, 0)
  const gap = totalDemand - totalSupply

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
            style={{ background: '#0F4C81' }}>
            <span className="text-white">🏛️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E293B' }}>Дашборд Акимата</h1>
            <p className="text-sm" style={{ color: '#64748B' }}>Аналитика спроса и предложения молодёжных мероприятий</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs" style={{ color: '#94A3B8' }}>
              Обновлено: {lastRefresh.toLocaleTimeString('ru-RU')}
            </span>
          )}
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow"
            style={{ background: '#0F4C81' }}>
            🔄 Обновить
          </button>
          <a href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 border"
            style={{ color: '#64748B', borderColor: '#E2E8F0' }}>
            ← На карту
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего запросов" value={totalDemand} icon="🎯" color="#0F4C81"
          sub="Пользователи выбрали интерес" />
        <StatCard label="Всего мероприятий" value={totalSupply} icon="📅" color="#F97316"
          sub="В базе данных" />
        <StatCard label="Дефицит событий" value={Math.max(0, gap)} icon="📊" color="#DC2626"
          sub="Спрос > Предложение" />
        <StatCard label="Категорий" value={data.length} icon="🏷️" color="#059669"
          sub="Активных направлений" />
      </div>

      {/* Main chart */}
      <div className="rounded-3xl p-6 shadow-sm border animate-fade-up" style={{ background: 'white', borderColor: '#F1F5F9' }}>
        <div className="mb-5">
          <h2 className="font-bold text-lg" style={{ color: '#1E293B' }}>📊 Анализ спроса и предложения</h2>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Спрос — количество молодёжи, интересующейся категорией.
            Предложение — количество мероприятий в базе.
          </p>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#0F4C81', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(val) => <span style={{ color: '#64748B', fontSize: 13 }}>{val}</span>}
              />
              <Bar dataKey="demand" name="Спрос (пользователи)" fill="#0F4C81" radius={[6,6,0,0]} maxBarSize={50} />
              <Bar dataKey="supply" name="Предложение (события)" fill="#F97316" radius={[6,6,0,0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-category detail table */}
      {!loading && data.length > 0 && (
        <div className="rounded-3xl p-6 shadow-sm border animate-fade-up" style={{ background: 'white', borderColor: '#F1F5F9' }}>
          <h2 className="font-bold text-base mb-4" style={{ color: '#1E293B' }}>📋 Детализация по категориям</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#F1F5F9' }}>
                  {['Категория', 'Спрос', 'Предложение', 'Дефицит', 'Покрытие'].map(h => (
                    <th key={h} className="pb-3 text-left font-semibold" style={{ color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const deficit = Math.max(0, row.demand - row.supply)
                  const coverage = row.demand > 0
                    ? Math.min(100, Math.round((row.supply / row.demand) * 100)) : 100
                  return (
                    <tr key={i} className="border-b transition hover:bg-slate-50"
                      style={{ borderColor: '#F8FAFC' }}>
                      <td className="py-3 font-semibold" style={{ color: '#1E293B' }}>{row.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                          style={{ background: '#0F4C81' + '14', color: '#0F4C81' }}>{row.demand}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                          style={{ background: '#F97316' + '14', color: '#F97316' }}>{row.supply}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                          style={{ background: deficit > 0 ? '#FEF2F2' : '#F0FDF4', color: deficit > 0 ? '#DC2626' : '#059669' }}>
                          {deficit > 0 ? `-${deficit}` : '✓'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full" style={{ background: '#F1F5F9', maxWidth: 80 }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${coverage}%`, background: coverage >= 80 ? '#059669' : coverage >= 40 ? '#F97316' : '#DC2626' }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{coverage}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
