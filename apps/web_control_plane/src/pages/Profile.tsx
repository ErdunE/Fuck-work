import { useState, useEffect } from 'react'
import { UserIcon, BriefcaseIcon, AcademicCapIcon, CogIcon } from '@heroicons/react/24/outline'
import ProtectedPage from '../components/ProtectedPage'
import api from '../services/api'
import type { Profile as ProfileType, AutomationPreferences } from '../types'

type TabType = 'personal' | 'experience' | 'education' | 'automation'

// Profile 预览内容
function ProfilePreview() {
  const tabs = [
    { name: 'Personal Info', icon: UserIcon },
    { name: 'Experience', icon: BriefcaseIcon },
    { name: 'Education', icon: AcademicCapIcon },
    { name: 'Automation', icon: CogIcon },
  ]

  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Profile</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your information and settings</p>

      <div className="flex gap-lg">
        {/* 侧边 Tab */}
        <div className="w-[200px] flex-shrink-0">
          <div className="space-y-xs">
            {tabs.map((tab, index) => (
              <div
                key={tab.name}
                className={`flex items-center gap-sm px-sm py-xs rounded-md ${
                  index === 0 ? 'bg-bg-tertiary' : ''
                }`}
              >
                <tab.icon className="w-5 h-5 text-text-secondary" />
                <span className="text-body-small text-text-secondary">{tab.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1">
          <div className="card p-lg">
            <h2 className="text-section-title text-text-primary mb-md">Personal Information</h2>
            <div className="space-y-md">
              {['Full Name', 'Email', 'Phone', 'Location'].map((field) => (
                <div key={field}>
                  <p className="text-body-small text-text-secondary mb-xs">{field}</p>
                  <div className="h-10 bg-bg-tertiary rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile 实际内容
function ProfileContent() {
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [preferences, setPreferences] = useState<AutomationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setMessage('')
    try {
      const [profileData, prefsData] = await Promise.all([
        api.getProfile(),
        api.getAutomationPreferences()
      ])
      setProfile(profileData)
      setPreferences(prefsData)
    } catch (error: unknown) {
      console.error('Failed to load profile:', error)
      const err = error as { response?: { data?: { detail?: string } } }
      setMessage(err.response?.data?.detail || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal' as TabType, label: 'Personal Info', icon: UserIcon },
    { id: 'experience' as TabType, label: 'Experience', icon: BriefcaseIcon },
    { id: 'education' as TabType, label: 'Education', icon: AcademicCapIcon },
    { id: 'automation' as TabType, label: 'Automation', icon: CogIcon },
  ]

  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Profile</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your information and settings</p>

      {/* Message */}
      {message && (
        <div className="mb-lg p-md rounded-lg text-body-small bg-accent-red/10 text-accent-red border border-accent-red/20">
          {message}
        </div>
      )}

      <div className="flex gap-lg">
        {/* Sidebar */}
        <div className="w-[200px] flex-shrink-0">
          <nav className="space-y-xs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-sm px-sm py-xs rounded-md text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-body-small">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 card p-lg">
          {loading ? (
            <div className="text-center py-xl">
              <div className="animate-pulse space-y-sm">
                <div className="h-4 bg-bg-tertiary rounded w-1/4 mx-auto" />
                <div className="h-4 bg-bg-tertiary rounded w-1/2 mx-auto" />
              </div>
              <p className="text-body-small text-text-tertiary mt-md">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-section-title text-text-primary mb-md">Personal Information</h2>
                  <div className="space-y-md">
                    <div>
                      <label className="block text-body-small text-text-secondary mb-xs">Full Name</label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        readOnly
                        className="input bg-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-body-small text-text-secondary mb-xs">Email</label>
                      <input
                        type="email"
                        value={profile?.primary_email || ''}
                        readOnly
                        className="input bg-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-body-small text-text-secondary mb-xs">Phone</label>
                      <input
                        type="tel"
                        value={profile?.phone || ''}
                        readOnly
                        className="input bg-bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-body-small text-text-secondary mb-xs">Location</label>
                      <input
                        type="text"
                        value={profile ? `${profile.city || ''}, ${profile.state || ''}, ${profile.country || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '') : ''}
                        readOnly
                        className="input bg-bg-secondary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div>
                  <h2 className="text-section-title text-text-primary mb-md">Work Experience</h2>
                  {profile?.experience && profile.experience.length > 0 ? (
                    <div className="space-y-md">
                      {profile.experience.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-accent-blue pl-md">
                          <h3 className="text-card-title text-text-primary">{exp.job_title}</h3>
                          <p className="text-body-small text-text-secondary">{exp.company_name}</p>
                          <p className="text-label text-text-tertiary mt-xs">
                            {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body text-text-secondary">No experience added yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'education' && (
                <div>
                  <h2 className="text-section-title text-text-primary mb-md">Education</h2>
                  {profile?.education && profile.education.length > 0 ? (
                    <div className="space-y-md">
                      {profile.education.map((edu) => (
                        <div key={edu.id} className="border-l-2 border-accent-blue pl-md">
                          <h3 className="text-card-title text-text-primary">{edu.school_name}</h3>
                          <p className="text-body-small text-text-secondary">
                            {edu.degree} {edu.major && `in ${edu.major}`}
                          </p>
                          <p className="text-label text-text-tertiary mt-xs">
                            {edu.start_date} - {edu.end_date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body text-text-secondary">No education added yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'automation' && (
                <div>
                  <h2 className="text-section-title text-text-primary mb-md">Automation Settings</h2>
                  {preferences && (
                    <div className="space-y-md">
                      <div className="flex items-center justify-between p-md border border-border-light rounded-lg">
                        <div>
                          <p className="text-card-title text-text-primary">Auto-fill after login</p>
                          <p className="text-body-small text-text-secondary">Automatically fill forms after detecting login</p>
                        </div>
                        <div className={`px-sm py-xs rounded-full text-label ${
                          preferences.auto_fill_after_login
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-bg-tertiary text-text-secondary'
                        }`}>
                          {preferences.auto_fill_after_login ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-md border border-border-light rounded-lg">
                        <div>
                          <p className="text-card-title text-text-primary">Require review before submit</p>
                          <p className="text-body-small text-text-secondary">Show confirmation before submitting applications</p>
                        </div>
                        <div className={`px-sm py-xs rounded-full text-label ${
                          preferences.require_review_before_submit
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-bg-tertiary text-text-secondary'
                        }`}>
                          {preferences.require_review_before_submit ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  return (
    <ProtectedPage
      preview={<ProfilePreview />}
      promptTitle="Sign in to manage your Profile"
      promptDescription="Complete your profile to get better job matches and streamline your applications."
    >
      <ProfileContent />
    </ProtectedPage>
  )
}
