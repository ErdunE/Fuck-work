import { useState } from 'react'
import ProtectedPage from '../components/ProtectedPage'
import {
  UserIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  TrophyIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

// Import tab components
import PersonalInfoTab from '../components/Profile/PersonalInfoTab'
import ResumeTab from '../components/Profile/ResumeTab'
import ExperienceTab from '../components/Profile/ExperienceTab'
import EducationTab from '../components/Profile/EducationTab'
import SkillsTab from '../components/Profile/SkillsTab'
import AchievementsTab from '../components/Profile/AchievementsTab'
import PreferencesTab from '../components/Profile/PreferencesTab'

// Tab configuration
const TABS = [
  { key: 'personal', label: 'Personal Info', icon: UserIcon },
  { key: 'resume', label: 'Resume', icon: DocumentTextIcon },
  { key: 'experience', label: 'Experience', icon: BriefcaseIcon },
  { key: 'education', label: 'Education', icon: AcademicCapIcon },
  { key: 'skills', label: 'Skills', icon: WrenchScrewdriverIcon },
  { key: 'achievements', label: 'Achievements', icon: TrophyIcon },
  { key: 'preferences', label: 'Preferences', icon: AdjustmentsHorizontalIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

// Preview component for unauthenticated users
function ProfilePreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-xs">Profile</h1>
      <p className="text-body text-text-secondary mb-lg">
        Manage your personal information
      </p>

      <div className="flex gap-lg">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="space-y-xs">
            {TABS.map((tab, index) => (
              <div
                key={tab.key}
                className={`flex items-center gap-sm px-md py-sm rounded-lg ${
                  index === 0 ? 'bg-bg-tertiary' : ''
                }`}
              >
                <div className="w-5 h-5 bg-bg-tertiary rounded" />
                <div className="h-4 bg-bg-tertiary rounded w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card p-xl">
            <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-lg" />
            <div className="grid grid-cols-2 gap-lg">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-sm" />
                  <div className="h-10 bg-bg-tertiary rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Profile component
function ProfileContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('personal')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab />
      case 'resume':
        return <ResumeTab />
      case 'experience':
        return <ExperienceTab />
      case 'education':
        return <EducationTab />
      case 'skills':
        return <SkillsTab />
      case 'achievements':
        return <AchievementsTab />
      case 'preferences':
        return <PreferencesTab />
      default:
        return null
    }
  }

  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-xs">Profile</h1>
      <p className="text-body text-text-secondary mb-lg">
        Manage your personal information
      </p>

      <div className="flex gap-lg">
        {/* Sidebar Navigation */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-xs sticky top-24">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-accent-blue text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-body-small font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">{renderTabContent()}</div>
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
