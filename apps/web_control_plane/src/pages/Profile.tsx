import { useState, useEffect } from 'react'
import { UserIcon, BriefcaseIcon, AcademicCapIcon, CogIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import type { Profile as ProfileType, AutomationPreferences } from '../types'

type TabType = 'personal' | 'experience' | 'education' | 'automation'

export default function Profile() {
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
    } catch (error: any) {
      console.error('Failed to load profile:', error)
      setMessage(error.response?.data?.detail || 'Failed to load profile data')
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your information and settings</p>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 p-4 rounded-lg text-sm bg-danger-50 text-danger-700 border border-danger-200">
          {message}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar: w-60 = 240px */}
        <div className="w-60 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow-soft border border-slate-200 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        readOnly
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profile?.primary_email || ''}
                        readOnly
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={profile?.phone || ''}
                        readOnly
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={profile ? `${profile.city || ''}, ${profile.state || ''}, ${profile.country || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '') : ''}
                        readOnly
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Work Experience</h2>
                  {profile?.experience && profile.experience.length > 0 ? (
                    <div className="space-y-4">
                      {profile.experience.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-primary-500 pl-4">
                          <h3 className="font-medium text-slate-900">{exp.job_title}</h3>
                          <p className="text-sm text-slate-600">{exp.company_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No experience added yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'education' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Education</h2>
                  {profile?.education && profile.education.length > 0 ? (
                    <div className="space-y-4">
                      {profile.education.map((edu) => (
                        <div key={edu.id} className="border-l-2 border-primary-500 pl-4">
                          <h3 className="font-medium text-slate-900">{edu.school_name}</h3>
                          <p className="text-sm text-slate-600">
                            {edu.degree} {edu.major && `in ${edu.major}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {edu.start_date} - {edu.end_date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No education added yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'automation' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Automation Settings</h2>
                  {preferences && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Auto-fill after login</p>
                          <p className="text-sm text-slate-600">Automatically fill forms after detecting login</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          preferences.auto_fill_after_login
                            ? 'bg-success-50 text-success-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {preferences.auto_fill_after_login ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">Require review before submit</p>
                          <p className="text-sm text-slate-600">Show confirmation before submitting applications</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          preferences.require_review_before_submit
                            ? 'bg-success-50 text-success-700'
                            : 'bg-slate-100 text-slate-700'
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

