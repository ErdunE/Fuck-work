import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Job } from '../types'

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  // Manual add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newJob, setNewJob] = useState({
    url: '',
    title: '',
    company_name: '',
    platform: ''
  })
  
  // Task creation state
  const [creatingTask, setCreatingTask] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const response = await api.searchJobs({}, 50, 0)
      setJobs(response.jobs)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setMessage('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newJob.url || !newJob.title || !newJob.company_name) {
      setMessage('Please fill in all required fields')
      return
    }

    try {
      await api.addJobManually(newJob)
      setMessage('Job added successfully')
      setShowAddForm(false)
      setNewJob({ url: '', title: '', company_name: '', platform: '' })
      await loadJobs()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to add job')
    }
  }

  const handleStartApply = async (job_id: string) => {
    setCreatingTask(job_id)
    try {
      const result = await api.createApplyTask(job_id)
      setMessage(result.message || 'Task created! Check Tasks page')
      await loadJobs()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to create task')
    } finally {
      setCreatingTask(null)
    }
  }

  return (
    <div>
      <h1>Jobs</h1>
      <p style={{ marginBottom: '20px' }}>Browse and manage job applications</p>

      {message && (
        <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.includes('success') || message.includes('created') ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancel' : '+ Add Job Manually'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Add Job Manually</h3>
          <form onSubmit={handleAddJob}>
            <div className="form-group">
              <label>Job URL *</label>
              <input
                type="url"
                value={newJob.url}
                onChange={(e) => setNewJob({ ...newJob, url: e.target.value })}
                placeholder="https://linkedin.com/jobs/view/123456"
                required
              />
            </div>
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="Software Engineer"
                required
              />
            </div>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                value={newJob.company_name}
                onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                placeholder="TikTok"
                required
              />
            </div>
            <div className="form-group">
              <label>Platform (optional)</label>
              <input
                type="text"
                value={newJob.platform}
                onChange={(e) => setNewJob({ ...newJob, platform: e.target.value })}
                placeholder="LinkedIn (auto-detected if empty)"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" className="btn btn-primary">Add Job</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Job List</h3>
        {loading ? (
          <div>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No jobs found. Add a job manually to get started.
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '15px 0',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {job.title}
                  </div>
                  <div style={{ color: '#666', marginBottom: '5px' }}>
                    {job.company_name} • {job.platform}
                  </div>
                  {job.authenticity_score !== null && job.authenticity_score !== undefined && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Score: {job.authenticity_score.toFixed(1)}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '3px' }}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0056b3' }}>
                      View Job →
                    </a>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleStartApply(job.job_id)}
                    className="btn btn-primary"
                    disabled={creatingTask === job.job_id}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {creatingTask === job.job_id ? 'Creating...' : 'Start Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

