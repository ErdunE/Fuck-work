import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AutomationSettings from './pages/AutomationSettings'
import Tasks from './pages/Tasks'
import AuditLog from './pages/AuditLog'
import Jobs from './pages/Jobs'  // Phase 5.2
import ObservabilityRuns from './pages/observability/Runs'  // Phase 5.3.0
import ObservabilityRunDetail from './pages/observability/RunDetail'  // Phase 5.3.0

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="profile" element={<Profile />} />
            <Route path="automation" element={<AutomationSettings />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="observability" element={<ObservabilityRuns />} />
            <Route path="observability/runs/:runId" element={<ObservabilityRunDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

