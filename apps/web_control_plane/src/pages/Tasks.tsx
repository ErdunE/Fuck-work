import { useEffect, useState } from 'react'
import api from '../services/api'
import type { ApplyTask } from '../types'

export default function Tasks() {
  const [tasks, setTasks] = useState<ApplyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadTasks()
  }, [statusFilter])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const data = await api.getApplyTasks(statusFilter || undefined)
      setTasks(data.tasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'queued': return '#6c757d'
      case 'in_progress': return '#0056b3'
      case 'needs_user': return '#ffc107'
      case 'success': return '#28a745'
      case 'failed': return '#dc3545'
      case 'canceled': return '#6c757d'
      default: return '#6c757d'
    }
  }

  return (
    <div>
      <h1>Apply Tasks</h1>
      <p style={{ marginBottom: '20px' }}>Read-only visibility into automation activity</p>

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setStatusFilter('')}
            className={statusFilter === '' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('queued')}
            className={statusFilter === 'queued' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Queued
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={statusFilter === 'in_progress' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('needs_user')}
            className={statusFilter === 'needs_user' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Needs User
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={statusFilter === 'success' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Success
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={statusFilter === 'failed' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Failed
          </button>
        </div>

        {loading ? (
          <div>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div>No tasks found</div>
        ) : (
          <div>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '15px 0',
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 150px 150px',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {task.company || task.job_id}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {task.source && `Source: ${task.source} | `}
                    {task.current_stage || 'Unknown stage'}
                  </div>
                  {task.last_action && (
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '3px' }}>
                      {task.last_action}
                    </div>
                  )}
                  {task.blocked_reason && (
                    <div style={{ fontSize: '13px', color: '#dc3545', marginTop: '3px' }}>
                      Blocked: {task.blocked_reason}
                    </div>
                  )}
                </div>

                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'white',
                      backgroundColor: getStatusBadgeColor(task.status)
                    }}
                  >
                    {task.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>
                  Priority: {task.priority}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(task.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

