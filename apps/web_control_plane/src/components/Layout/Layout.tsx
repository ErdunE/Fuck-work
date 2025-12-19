import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopNavigation from '../TopNavigation'

export default function Layout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-32 mx-auto"></div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavigation />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

