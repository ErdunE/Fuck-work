import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Profile } from '../types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState<Partial<Profile>>({})

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

  const handleChange = (field: keyof Profile, value: string) => {
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

  if (loading) {
    return <div>Loading profile...</div>
  }

  return (
    <div>
      <h1>Profile Management</h1>
      <p style={{ marginBottom: '20px' }}>Authoritative source for application autofill</p>

      <form onSubmit={handleSubmit}>
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

        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '20px' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}

