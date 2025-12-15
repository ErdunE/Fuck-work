import { useEffect, useState } from 'react'
import api from '../services/api'
import type { ApplyTask } from '../types'

export default function Tasks() {
  const [tasks, setTasks] = useState<ApplyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [executing, setExecuting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleStartApply = async (taskId: number, jobUrl: string) => {
    setExecuting(taskId)
    setError(null)
    
    try {
      // Step 1: Execute task (creates run)
      const result = await api.executeApplyTask(taskId)
      console.log('[FW Web] Task executed:', result)
      
      // Step 2: Set active session (CRITICAL - must succeed before opening URL)
      try {
        const session = await api.setActiveSession({
          task_id: taskId,
          run_id: result.run_id,
          job_url: result.job_url,
          ats_type: result.ats_type
        })
        console.log('[FW Web] Active session set:', { task_id: taskId, run_id: result.run_id })
      } catch (sessionErr: any) {
        // BLOCKING ERROR - do not open job URL
        throw new Error(`Failed to set active session: ${sessionErr.response?.data?.detail || sessionErr.message}`)
      }
      
      // Step 3: Only now open job URL
      window.open(result.job_url, '_blank')
      console.log('[FW Web] Job URL opened in new tab')
      
      // Refresh task list
      await loadTasks()
      
      // Show success
      alert(`Application started! Run ID: ${result.run_id}`)
    } catch (err: any) {
      setError(err.message || err.response?.data?.detail || 'Failed to start application')
      console.error('[FW Web] Failed to execute task:', err)
    } finally {
      setExecuting(null)
    }
  }

  return (
    <div>
      <h1>Apply Tasks</h1>
      <p style={{ marginBottom: '20px' }}>Read-only visibility into automation activity</p>

      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

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
                  gridTemplateColumns: '1fr 120px 150px 150px 180px',
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

                <div>
                  {task.status === 'queued' && (
                    <button
                      onClick={() => {
                        const metadata = task.task_metadata || {}
                        const jobUrl = metadata.url || `https://linkedin.com/jobs/view/${task.job_id}`
                        handleStartApply(task.id, jobUrl)
                      }}
                      disabled={executing === task.id}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '13px' }}
                    >
                      {executing === task.id ? 'Starting...' : 'Start Apply'}
                    </button>
                  )}
                  {task.status === 'running' && (
                    <button
                      onClick={() => window.location.href = '/observability'}
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: '13px' }}
                    >
                      View Run
                    </button>
                  )}
                  {task.status === 'failed' && (
                    <button
                      onClick={() => {
                        const metadata = task.task_metadata || {}
                        const jobUrl = metadata.url || `https://linkedin.com/jobs/view/${task.job_id}`
                        handleStartApply(task.id, jobUrl)
                      }}
                      disabled={executing === task.id}
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: '13px' }}
                    >
                      {executing === task.id ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

