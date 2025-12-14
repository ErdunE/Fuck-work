import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import type { ApplyTask, AutomationPreferences } from '../types'

export default function Dashboard() {
  const [tasks, setTasks] = useState<ApplyTask[]>([])
  const [prefs, setPrefs] = useState<AutomationPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [tasksData, prefsData] = await Promise.all([
          api.getApplyTasks(undefined, 5),
          api.getAutomationPreferences()
        ])
        setTasks(tasksData.tasks)
        setPrefs(prefsData)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboard()
  }, [])

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ marginBottom: '30px' }}>Welcome to your FuckWork Control Plane</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Automation Status</h3>
          {prefs && (
            <div style={{ marginTop: '15px' }}>
              <div>Auto-fill: <strong>{prefs.auto_fill_after_login ? 'Enabled' : 'Disabled'}</strong></div>
              <div>Auto-submit: <strong>{prefs.auto_submit_when_ready ? 'Enabled' : 'Disabled'}</strong></div>
              <div style={{ marginTop: '10px' }}>
                <Link to="/automation">Manage Settings</Link>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ marginTop: '15px' }}>
            <div>Active tasks: {tasks.filter(t => t.status === 'in_progress').length}</div>
            <div>Queued: {tasks.filter(t => t.status === 'queued').length}</div>
            <div style={{ marginTop: '10px' }}>
              <Link to="/tasks">View All Tasks</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Apply Tasks</h3>
        {tasks.length === 0 ? (
          <p style={{ marginTop: '15px' }}>No tasks yet</p>
        ) : (
          <div style={{ marginTop: '15px' }}>
            {tasks.map(task => (
              <div key={task.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                <div><strong>{task.company || task.job_id}</strong></div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Status: {task.status} | {task.current_stage || 'Unknown stage'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

