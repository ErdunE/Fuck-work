import { Navigate, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Layout() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div>
      <header style={{ background: '#333', color: 'white', padding: '15px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>FuckWork Control Plane</h2>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
            <Link to="/automation" style={{ color: 'white', textDecoration: 'none' }}>Automation</Link>
            <Link to="/tasks" style={{ color: 'white', textDecoration: 'none' }}>Tasks</Link>
            <Link to="/audit" style={{ color: 'white', textDecoration: 'none' }}>Audit Log</Link>
            <span style={{ borderLeft: '1px solid white', height: '20px' }}></span>
            <span>{user.email}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '5px 15px' }}>Logout</button>
          </nav>
        </div>
      </header>
      <main className="container" style={{ marginTop: '20px' }}>
        <Outlet />
      </main>
    </div>
  )
}

