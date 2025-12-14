import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { ApplyRun, ApplyEvent } from '../../types'
import '../../styles/observability.css'

export default function ObservabilityRunDetail() {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const [run, setRun] = useState<any | null>(null)
  const [events, setEvents] = useState<ApplyEvent[]>([])
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (runId) {
      loadRunDetail()
      loadEvents()
    }
  }, [runId])

  // Auto-refresh if run is in_progress (live mode)
  useEffect(() => {
    if (run?.status === 'in_progress') {
      const interval = setInterval(() => {
        loadEvents()
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [run])

  const loadRunDetail = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getObservabilityRun(parseInt(runId!))
      setRun(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load run')
      console.error('Failed to load run detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const data = await api.getObservabilityRunEvents(parseInt(runId!))
      setEvents(data.events)
    } catch (err: any) {
      console.error('Failed to load events:', err)
    }
  }

  const toggleEventExpand = (eventId: number) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString()
  }

  const formatRelativeTime = (ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_progress': return 'badge badge-info'
      case 'success': return 'badge badge-success'
      case 'failed': return 'badge badge-error'
      case 'abandoned': return 'badge badge-warning'
      default: return 'badge'
    }
  }

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'debug': return 'severity-debug'
      case 'info': return 'severity-info'
      case 'warn': return 'severity-warn'
      case 'error': return 'severity-error'
      default: return 'severity-info'
    }
  }

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'extension': return 'badge badge-primary'
      case 'backend': return 'badge badge-secondary'
      case 'web': return 'badge badge-success'
      default: return 'badge'
    }
  }

  if (loading && !run) {
    return <div className="page-container"><div className="loading">Loading run details...</div></div>
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
        <button onClick={() => navigate('/observability')} className="btn">
          ← Back to Runs List
        </button>
      </div>
    )
  }

  if (!run) {
    return <div className="page-container"><div>Run not found</div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={() => navigate('/observability')} className="btn btn-secondary">
          ← Back to Runs
        </button>
        <h1>
          Run #{run.id}
          {run.status === 'in_progress' && (
            <span className="badge badge-info" style={{ marginLeft: '10px' }}>
              LIVE
            </span>
          )}
        </h1>
      </div>

      {/* Header Card */}
      <div className="card">
        <h3>Run Metadata</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Status</label>
            <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
          </div>
          <div className="info-item">
            <label>Task ID</label>
            <span>{run.task_id || '—'}</span>
          </div>
          <div className="info-item">
            <label>Job ID</label>
            <span>{run.job_id || '—'}</span>
          </div>
          <div className="info-item">
            <label>ATS Kind</label>
            <span>{run.ats_kind || 'unknown'}</span>
          </div>
          <div className="info-item">
            <label>Intent</label>
            <span>{run.intent || '—'}</span>
          </div>
          <div className="info-item">
            <label>Stage</label>
            <span>{run.stage || '—'}</span>
          </div>
          <div className="info-item">
            <label>Created</label>
            <span>{formatTimestamp(run.created_at)}</span>
          </div>
          <div className="info-item">
            <label>Ended</label>
            <span>{run.ended_at ? formatTimestamp(run.ended_at) : '—'}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label>Initial URL</label>
          <div className="url-display">{run.initial_url}</div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Current URL</label>
          <div className="url-display">{run.current_url}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Fields Attempted</h4>
          <div className="metric">{run.fields_attempted}</div>
        </div>
        <div className="summary-card">
          <h4>Fields Filled</h4>
          <div className="metric success">{run.fields_filled}</div>
        </div>
        <div className="summary-card">
          <h4>Fields Skipped</h4>
          <div className="metric warning">{run.fields_skipped}</div>
        </div>
        <div className="summary-card">
          <h4>Fill Rate</h4>
          <div className="metric">
            {run.fill_rate !== null && run.fill_rate !== undefined 
              ? `${run.fill_rate.toFixed(0)}%` 
              : '—'}
          </div>
        </div>
      </div>

      {run.failure_reason && (
        <div className="alert alert-error">
          <strong>Failure Reason:</strong> {run.failure_reason}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3>
          Event Timeline 
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
            ({events.length} events)
          </span>
          {run.status === 'in_progress' && (
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#007bff' }}>
              Auto-refreshing every 2s
            </span>
          )}
        </h3>

        {events.length === 0 && (
          <p>No events recorded yet.</p>
        )}

        <div className="timeline">
          {events.map((event, index) => (
            <div key={event.id} className={`timeline-event ${getSeverityClass(event.severity)}`}>
              <div className="timeline-header">
                <div className="timeline-meta">
                  <span className="timeline-timestamp">
                    {formatTimestamp(event.ts)}
                    <small style={{ marginLeft: '8px', color: '#999' }}>
                      ({formatRelativeTime(event.ts)})
                    </small>
                  </span>
                  <span className={getSourceBadgeClass(event.source)}>
                    {event.source}
                  </span>
                  <span className={`badge ${getSeverityClass(event.severity)}`}>
                    {event.severity}
                  </span>
                </div>
                <div className="timeline-event-name">
                  <strong>{event.event_name}</strong>
                  {event.detection_id && (
                    <small style={{ marginLeft: '8px', color: '#666' }}>
                      detection_id: {event.detection_id.substring(0, 8)}
                    </small>
                  )}
                </div>
              </div>

              {event.url && (
                <div className="timeline-url">
                  <small>URL:</small> <code>{event.url}</code>
                </div>
              )}

              {Object.keys(event.payload).length > 0 && (
                <div className="timeline-payload">
                  <button 
                    onClick={() => toggleEventExpand(event.id)}
                    className="btn-link"
                  >
                    {expandedEvents.has(event.id) ? '▼ Hide' : '▶ Show'} Payload
                  </button>
                  {expandedEvents.has(event.id) && (
                    <pre className="json-payload">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

