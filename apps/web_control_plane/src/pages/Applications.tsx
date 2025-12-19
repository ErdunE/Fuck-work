import { useEffect, useState } from 'react'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import type { ApplyTask } from '../types'

export default function Applications() {
  const [tasks, setTasks] = useState<ApplyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    setMessage('')
    try {
      const data = await api.getTasks()
      setTasks(data)
    } catch (error: any) {
      console.error('Failed to load tasks:', error)
      setMessage(error.response?.data?.detail || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'submitted':
        return 'bg-success-50 text-success-700 border-success-200'
      case 'in_progress':
      case 'pending':
        return 'bg-primary-50 text-primary-700 border-primary-200'
      case 'failed':
      case 'blocked':
        return 'bg-danger-50 text-danger-700 border-danger-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="mt-1 text-sm text-slate-600">Track your job applications</p>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 p-4 rounded-lg text-sm bg-danger-50 text-danger-700 border border-danger-200">
          {message}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-soft p-12 text-center border border-slate-200">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Loading applications...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-soft p-12 text-center border border-slate-200">
          <p className="text-sm text-slate-600">
            No applications yet. Visit the Jobs page to start applying.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status)
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-soft border border-slate-200 p-4 hover:shadow-medium transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {task.task_metadata?.title || 'Job Application'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(task.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.task_metadata?.company && (
                      <p className="text-sm text-slate-600 mb-2">
                        {task.task_metadata.company}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {task.current_stage && (
                        <span>Stage: {task.current_stage}</span>
                      )}
                      {task.created_at && (
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {task.blocked_reason && (
                      <p className="mt-2 text-sm text-danger-600">
                        {task.blocked_reason}
                      </p>
                    )}
                  </div>
                  
                  {task.task_metadata?.url && (
                    <a
                      href={task.task_metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-primary-600 hover:text-primary-700 transition"
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

