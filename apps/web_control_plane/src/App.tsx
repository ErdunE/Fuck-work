import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Layouts
import PublicLayout from './components/Layout/PublicLayout'

// Pages
import Login from './pages/Login'
import Callback from './pages/Callback'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Match from './pages/Match'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Onboarding from './pages/Onboarding'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公开页面（无导航） */}
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* 所有页面使用 PublicLayout（有导航） */}
          <Route element={<PublicLayout />}>
            {/* 完全公开的页面 */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* 受保护的页面（内部使用 ProtectedPage 组件） */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/match" element={<Match />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* 默认重定向 */}
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
