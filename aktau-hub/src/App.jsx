import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './components/Onboarding'
import Hub from './components/Hub'
import AdminDashboard from './components/AdminDashboard'
import { getLocalUser, saveLocalUser } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(() => getLocalUser())

  function handleOnboardingComplete(profile) {
    setUser(profile)
  }

  function handleLogout() {
    localStorage.removeItem('aktau_user')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin dashboard — always accessible */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Main app */}
        <Route path="/" element={
          user
            ? <Hub user={user} onLogout={handleLogout} />
            : <Onboarding onComplete={handleOnboardingComplete} />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
