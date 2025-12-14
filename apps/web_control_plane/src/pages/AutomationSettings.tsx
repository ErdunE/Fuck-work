import { useEffect, useState } from 'react'
import api from '../services/api'
import type { AutomationPreferences } from '../types'

export default function AutomationSettings() {
  const [prefs, setPrefs] = useState<AutomationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const data = await api.getAutomationPreferences()
      setPrefs(data)
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (field: 'auto_fill_after_login' | 'auto_submit_when_ready' | 'require_review_before_submit') => {
    if (prefs) {
      setPrefs({ ...prefs, [field]: !prefs[field] })
    }
  }

  const handleSave = async () => {
    if (!prefs) return

    setMessage('')
    setSaving(true)

    try {
      await api.updateAutomationPreferences({
        auto_fill_after_login: prefs.auto_fill_after_login,
        auto_submit_when_ready: prefs.auto_submit_when_ready,
        require_review_before_submit: prefs.require_review_before_submit,
        sync_source: 'web'
      })
      setMessage('Preferences updated successfully. Extension will sync within 5 minutes.')
      await loadPreferences()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading preferences...</div>
  }

  if (!prefs) {
    return <div>Failed to load preferences</div>
  }

  return (
    <div>
      <h1>Automation Settings</h1>
      <p style={{ marginBottom: '20px' }}>Control how the browser extension handles job applications</p>

      <div className="card">
        <h3>Global Automation Preferences</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          These settings apply to all job applications. Extension syncs every 5 minutes.
        </p>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="auto_fill"
              checked={prefs.auto_fill_after_login}
              onChange={() => handleToggle('auto_fill_after_login')}
              style={{ width: 'auto' }}
            />
            <label htmlFor="auto_fill" style={{ margin: 0 }}>
              <strong>Auto-fill after login</strong>
            </label>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginLeft: '30px' }}>
            Automatically fill application forms with your profile data after you log in to an ATS.
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="auto_submit"
              checked={prefs.auto_submit_when_ready}
              onChange={() => handleToggle('auto_submit_when_ready')}
              style={{ width: 'auto' }}
            />
            <label htmlFor="auto_submit" style={{ margin: 0 }}>
              <strong>Auto-submit when ready</strong>
            </label>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginLeft: '30px' }}>
            Automatically submit applications after review. Requires explicit opt-in per session.
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="require_review"
              checked={prefs.require_review_before_submit}
              onChange={() => handleToggle('require_review_before_submit')}
              style={{ width: 'auto' }}
            />
            <label htmlFor="require_review" style={{ margin: 0 }}>
              <strong>Require review before submit</strong>
            </label>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginLeft: '30px' }}>
            SAFETY GATE: Always show review modal before submitting. Highly recommended.
          </p>
        </div>

        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        
        <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ marginTop: '20px' }}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="card" style={{ background: '#f9f9f9' }}>
        <h3>Sync Status</h3>
        <p style={{ fontSize: '14px' }}>
          Last synced: {prefs.last_synced_at ? new Date(prefs.last_synced_at).toLocaleString() : 'Never'}
        </p>
        <p style={{ fontSize: '14px' }}>
          Source: {prefs.sync_source || 'Unknown'}
        </p>
      </div>
    </div>
  )
}

