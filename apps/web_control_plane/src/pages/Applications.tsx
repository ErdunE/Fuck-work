import { useEffect, useState } from 'react'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ProtectedPage from '../components/ProtectedPage'
import api from '../services/api'
import type { ApplyTask } from '../types'

// Applications 预览内容
function ApplicationsPreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Applications</h1>
      <p className="text-body text-text-secondary mb-lg">Track your job applications</p>

      {/* 假的状态 Tab */}
      <div className="flex gap-sm mb-lg">
        {['All', 'Applied', 'Interview', 'Offer', 'Rejected'].map((tab) => (
          <div key={tab} className="px-sm py-xs bg-bg-tertiary rounded-full">
            <span className="text-body-small text-text-secondary">{tab}</span>
          </div>
        ))}
      </div>

      {/* 假的应用列表 */}
      <div className="space-y-sm">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 bg-bg-tertiary rounded w-1/2 mb-sm" />
                <div className="h-4 bg-bg-tertiary rounded w-1/3" />
              </div>
              <div className="h-6 w-20 bg-bg-tertiary rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Applications 实际内容
function ApplicationsContent() {
  const [tasks, setTasks] = useState<ApplyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await api.getApplyTasks()
      setTasks(data.tasks)
    } catch (error: unknown) {
      console.error('Failed to load tasks:', error)
      const err = error as { response?: { data?: { detail?: string } } }
      setMessage(err.response?.data?.detail || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'submitted':
        return 'bg-accent-green/10 text-accent-green'
      case 'in_progress':
      case 'pending':
        return 'bg-accent-blue/10 text-accent-blue'
      case 'failed':
      case 'blocked':
        return 'bg-accent-red/10 text-accent-red'
      default:
        return 'bg-bg-tertiary text-text-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'submitted':
        return CheckCircleIcon
      case 'in_progress':
      case 'pending':
        return ClockIcon
      case 'failed':
      case 'blocked':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ]

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    return task.status?.toLowerCase() === filter
  })

  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Applications</h1>
      <p className="text-body text-text-secondary mb-lg">Track your job applications</p>

      {/* Message */}
      {message && (
        <div className="mb-lg p-md rounded-lg text-body-small bg-accent-red/10 text-accent-red border border-accent-red/20">
          {message}
        </div>
      )}

      {/* 状态 Tab */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-sm py-xs rounded-full text-body-small transition-colors ${
              filter === f.key
                ? 'bg-accent-blue text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-border-default'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 应用列表 */}
      {loading ? (
        <div className="card p-xl text-center">
          <div className="animate-pulse space-y-sm">
            <div className="h-4 bg-bg-tertiary rounded w-1/4 mx-auto" />
            <div className="h-4 bg-bg-tertiary rounded w-1/2 mx-auto" />
          </div>
          <p className="text-body-small text-text-tertiary mt-md">Loading applications...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card p-xl text-center">
          <p className="text-body text-text-secondary">
            {filter === 'all'
              ? 'No applications yet. Visit the Jobs page to start applying.'
              : `No ${filter.replace('_', ' ')} applications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {filteredTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status)
            return (
              <div
                key={task.id}
                className="card p-md hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-sm mb-xs">
                      <h3 className="text-card-title text-text-primary">
                        {task.task_metadata?.title || 'Job Application'}
                      </h3>
                      <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full text-label ${getStatusColor(task.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {task.task_metadata?.company && (
                      <p className="text-body-small text-text-secondary mb-xs">
                        {task.task_metadata.company}
                      </p>
                    )}

                    <div className="flex items-center gap-md text-label text-text-tertiary">
                      {task.current_stage && (
                        <span>Stage: {task.current_stage}</span>
                      )}
                      {task.created_at && (
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      )}
                    </div>

                    {task.blocked_reason && (
                      <p className="mt-xs text-body-small text-accent-red">
                        {task.blocked_reason}
                      </p>
                    )}
                  </div>

                  {task.task_metadata?.url && (
                    <a
                      href={task.task_metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-md text-body-small text-accent-blue hover:text-accent-blue-hover transition-colors"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Applications() {
  return (
    <ProtectedPage
      preview={<ApplicationsPreview />}
      promptTitle="Sign in to track Applications"
      promptDescription="Keep track of all your job applications, interviews, and offers in one place."
    >
      <ApplicationsContent />
    </ProtectedPage>
  )
}
