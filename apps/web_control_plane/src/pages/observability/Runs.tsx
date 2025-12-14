import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { ApplyRun } from '../../types'
import '../../styles/observability.css'

export default function ObservabilityRuns() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<ApplyRun[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [atsFilter, setAtsFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    loadRuns()
  }, [statusFilter, atsFilter, searchQuery, offset])

  const loadRuns = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const filters: any = { limit, offset }
      if (statusFilter) filters.status = statusFilter
      if (atsFilter) filters.ats_kind = atsFilter
      if (searchQuery) filters.q = searchQuery
      
      const response = await api.getObservabilityRuns(filters)
      setRuns(response.runs)
      setTotal(response.total)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load runs')
      console.error('Failed to load observability runs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (runId: number) => {
    navigate(`/observability/runs/${runId}`)
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString()
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Observability Console</h1>
        <p>View end-to-end application run timelines and debugging information</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="card">
        <div className="filters">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => {setStatusFilter(e.target.value); setOffset(0)}}
              className="input"
            >
              <option value="">All</option>
              <option value="in_progress">In Progress</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="filter-group">
            <label>ATS Type</label>
            <select 
              value={atsFilter} 
              onChange={(e) => {setAtsFilter(e.target.value); setOffset(0)}}
              className="input"
            >
              <option value="">All</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="workday">Workday</option>
              <option value="lever">Lever</option>
              <option value="linkedin_easy_apply">LinkedIn Easy Apply</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="filter-group" style={{flex: 1}}>
            <label>Search (Job ID / URL)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setOffset(0)}}
              placeholder="Search by job ID or URL..."
              className="input"
            />
          </div>

          <div className="filter-group">
            <button onClick={loadRuns} className="btn btn-secondary">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading runs...</div>}

      {!loading && runs.length === 0 && (
        <div className="card">
          <p>No runs found. Start an application to see observability data.</p>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Time</th>
                <th>Status</th>
                <th>ATS</th>
                <th>Intent / Stage</th>
                <th>Job ID</th>
                <th>Fill Rate</th>
                <th>Fields</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr 
                  key={run.id} 
                  onClick={() => handleRowClick(run.id)}
                  style={{ cursor: 'pointer' }}
                  className="clickable-row"
                >
                  <td><code>#{run.id}</code></td>
                  <td>{formatTimestamp(run.created_at)}</td>
                  <td>
                    <span className={getStatusBadgeClass(run.status)}>
                      {run.status}
                    </span>
                  </td>
                  <td>{run.ats_kind || 'unknown'}</td>
                  <td>
                    {run.intent && <div><small>Intent:</small> {run.intent}</div>}
                    {run.stage && <div><small>Stage:</small> {run.stage}</div>}
                  </td>
                  <td>
                    {run.job_id ? (
                      <code>{run.job_id.substring(0, 20)}{run.job_id.length > 20 ? '...' : ''}</code>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td>
                    {run.fill_rate !== null && run.fill_rate !== undefined ? (
                      <strong>{run.fill_rate.toFixed(0)}%</strong>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td>
                    <small>
                      {run.fields_filled}/{run.fields_attempted}
                      {run.fields_skipped > 0 && ` (${run.fields_skipped} skipped)`}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span>
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </span>
            <button 
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

