import { Outlet } from 'react-router-dom'
import TopNavigation from '../TopNavigation'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <TopNavigation />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
