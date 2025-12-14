import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Profile, Education, Experience, Project, Skill } from '../types'

export default function ProfileExtended() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState<Partial<Profile>>({})

  // Collections state
  const [editingEducation, setEditingEducation] = useState<Partial<Education> | null>(null)
  const [editingExperience, setEditingExperience] = useState<Partial<Experience> | null>(null)
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await api.getProfile()
      setProfile(data)
      setFormData(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setSaving(true)

    try {
      await api.updateProfile(formData)
      setMessage('Profile updated successfully')
      await loadProfile()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Education methods
  const handleAddEducation = async () => {
    if (!editingEducation?.school_name) return
    try {
      await api.createEducation(editingEducation as any)
      setEditingEducation(null)
      await loadProfile()
    } catch (error) {
      console.error('Failed to add education:', error)
    }
  }

  const handleDeleteEducation = async (id: number) => {
    if (!confirm('Delete this education entry?')) return
    try {
      await api.deleteEducation(id)
      await loadProfile()
    } catch (error) {
      console.error('Failed to delete education:', error)
    }
  }

  // Experience methods
  const handleAddExperience = async () => {
    if (!editingExperience?.company_name || !editingExperience?.job_title) return
    try {
      await api.createExperience(editingExperience as any)
      setEditingExperience(null)
      await loadProfile()
    } catch (error) {
      console.error('Failed to add experience:', error)
    }
  }

  const handleDeleteExperience = async (id: number) => {
    if (!confirm('Delete this experience entry?')) return
    try {
      await api.deleteExperience(id)
      await loadProfile()
    } catch (error) {
      console.error('Failed to delete experience:', error)
    }
  }

  // Project methods
  const handleAddProject = async () => {
    if (!editingProject?.project_name) return
    try {
      await api.createProject(editingProject as any)
      setEditingProject(null)
      await loadProfile()
    } catch (error) {
      console.error('Failed to add project:', error)
    }
  }

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Delete this project?')) return
    try {
      await api.deleteProject(id)
      await loadProfile()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  // Skill methods
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return
    try {
      await api.createSkill({ skill_name: newSkill.trim(), skill_category: undefined })
      setNewSkill('')
      await loadProfile()
    } catch (error) {
      console.error('Failed to add skill:', error)
    }
  }

  const handleDeleteSkill = async (id: number) => {
    try {
      await api.deleteSkill(id)
      await loadProfile()
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  if (loading) {
    return <div>Loading profile...</div>
  }

  return (
    <div>
      <h1>Profile Management</h1>
      <p style={{ marginBottom: '20px' }}>Authoritative source for application autofill (Phase 5.2: ATS-complete)</p>

      {message && (
        <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="card">
          <h3>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Primary Email</label>
              <input
                type="email"
                value={formData.primary_email || ''}
                onChange={(e) => handleChange('primary_email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h3>Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                value={formData.postal_code || ''}
                onChange={(e) => handleChange('postal_code', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Professional Links */}
        <div className="card">
          <h3>Professional Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Portfolio URL</label>
              <input
                type="url"
                value={formData.portfolio_url || ''}
                onChange={(e) => handleChange('portfolio_url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                value={formData.github_url || ''}
                onChange={(e) => handleChange('github_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Compliance / Preferences */}
        <div className="card">
          <h3>Compliance & Preferences</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label>Work Authorization</label>
              <input
                type="text"
                value={formData.work_authorization || ''}
                onChange={(e) => handleChange('work_authorization', e.target.value)}
                placeholder="e.g., US Citizen, Green Card, H1B"
              />
            </div>
            <div className="form-group">
              <label>Visa Status</label>
              <input
                type="text"
                value={formData.visa_status || ''}
                onChange={(e) => handleChange('visa_status', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.willing_to_relocate || false}
                  onChange={(e) => handleChange('willing_to_relocate', e.target.checked)}
                />
                Willing to Relocate
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.government_employment_history || false}
                  onChange={(e) => handleChange('government_employment_history', e.target.checked)}
                />
                Government Employment History
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Education Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Education</h3>
        {profile?.education && profile.education.length > 0 ? (
          <div style={{ marginTop: '15px' }}>
            {profile.education.map((edu) => (
              <div key={edu.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{edu.school_name}</div>
                  <div>{edu.degree} {edu.major && `in ${edu.major}`}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {edu.start_date} - {edu.end_date || 'Present'}
                    {edu.gpa && ` | GPA: ${edu.gpa}`}
                  </div>
                </div>
                <button onClick={() => handleDeleteEducation(edu.id)} className="btn btn-secondary" style={{ fontSize: '12px' }}>Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '15px', color: '#666' }}>No education entries yet</div>
        )}
        {editingEducation ? (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div className="form-group">
              <label>School Name *</label>
              <input
                type="text"
                value={editingEducation.school_name || ''}
                onChange={(e) => setEditingEducation({ ...editingEducation, school_name: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>Degree</label>
                <input
                  type="text"
                  value={editingEducation.degree || ''}
                  onChange={(e) => setEditingEducation({ ...editingEducation, degree: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Major</label>
                <input
                  type="text"
                  value={editingEducation.major || ''}
                  onChange={(e) => setEditingEducation({ ...editingEducation, major: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleAddEducation} className="btn btn-primary">Add</button>
              <button onClick={() => setEditingEducation(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingEducation({})} className="btn btn-secondary" style={{ marginTop: '15px' }}>+ Add Education</button>
        )}
      </div>

      {/* Experience Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Work Experience</h3>
        {profile?.experience && profile.experience.length > 0 ? (
          <div style={{ marginTop: '15px' }}>
            {profile.experience.map((exp) => (
              <div key={exp.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{exp.job_title}</div>
                  <div>{exp.company_name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                  </div>
                </div>
                <button onClick={() => handleDeleteExperience(exp.id)} className="btn btn-secondary" style={{ fontSize: '12px' }}>Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '15px', color: '#666' }}>No experience entries yet</div>
        )}
        {editingExperience ? (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                value={editingExperience.company_name || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, company_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                value={editingExperience.job_title || ''}
                onChange={(e) => setEditingExperience({ ...editingExperience, job_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={editingExperience.is_current || false}
                  onChange={(e) => setEditingExperience({ ...editingExperience, is_current: e.target.checked })}
                />
                Currently working here
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleAddExperience} className="btn btn-primary">Add</button>
              <button onClick={() => setEditingExperience(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingExperience({ is_current: false })} className="btn btn-secondary" style={{ marginTop: '15px' }}>+ Add Experience</button>
        )}
      </div>

      {/* Projects Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Projects</h3>
        {profile?.projects && profile.projects.length > 0 ? (
          <div style={{ marginTop: '15px' }}>
            {profile.projects.map((proj) => (
              <div key={proj.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{proj.project_name}</div>
                  {proj.role && <div>{proj.role}</div>}
                  {proj.description && <div style={{ fontSize: '14px', color: '#666' }}>{proj.description}</div>}
                </div>
                <button onClick={() => handleDeleteProject(proj.id)} className="btn btn-secondary" style={{ fontSize: '12px' }}>Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '15px', color: '#666' }}>No projects yet</div>
        )}
        {editingProject ? (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={editingProject.project_name || ''}
                onChange={(e) => setEditingProject({ ...editingProject, project_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={editingProject.role || ''}
                onChange={(e) => setEditingProject({ ...editingProject, role: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleAddProject} className="btn btn-primary">Add</button>
              <button onClick={() => setEditingProject(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingProject({})} className="btn btn-secondary" style={{ marginTop: '15px' }}>+ Add Project</button>
        )}
      </div>

      {/* Skills Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Skills</h3>
        {profile?.skills && profile.skills.length > 0 ? (
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {profile.skills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '16px',
                  fontSize: '14px'
                }}
              >
                <span>{skill.skill_name}</span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontSize: '16px',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '15px', color: '#666' }}>No skills yet</div>
        )}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Enter skill name"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            style={{ flex: 1 }}
          />
          <button onClick={handleAddSkill} className="btn btn-primary">Add Skill</button>
        </div>
      </div>
    </div>
  )
}

