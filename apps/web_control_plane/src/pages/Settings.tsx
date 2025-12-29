import { useState, useRef } from 'react'
import ProtectedPage from '../components/ProtectedPage'
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CogIcon,
  XMarkIcon,
  CameraIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'

// ============================================================================
// Types
// ============================================================================

interface NotificationSettings {
  emailNotifications: boolean
  newJobMatches: boolean
  applicationUpdates: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
  smsNotifications: boolean
}

interface AutoApplySettings {
  enabled: boolean
  maxApplicationsPerDay: number
  requireReviewBeforeSubmit: boolean
  excludedCompanies: string[]
  excludedKeywords: string[]
  pauseAutoApply: boolean
}

interface PrivacySettings {
  profileVisibleToRecruiters: boolean
  showSalaryExpectations: boolean
  allowDataAnalytics: boolean
}

interface ConnectedAccount {
  id: string
  provider: 'google' | 'linkedin' | 'github' | 'apple'
  email: string
  connectedAt: string
}

// ============================================================================
// Constants
// ============================================================================

const PROVIDER_INFO = {
  google: { name: 'Google', color: 'text-[#4285F4]', bgColor: 'bg-[#4285F4]/10' },
  linkedin: { name: 'LinkedIn', color: 'text-[#0A66C2]', bgColor: 'bg-[#0A66C2]/10' },
  github: { name: 'GitHub', color: 'text-[#333]', bgColor: 'bg-[#333]/10' },
  apple: { name: 'Apple', color: 'text-[#000]', bgColor: 'bg-[#000]/10' },
}

// ============================================================================
// Section Card Component
// ============================================================================

interface SectionCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  danger?: boolean
}

function SectionCard({ icon, title, description, children, danger = false }: SectionCardProps) {
  return (
    <div className={`card p-xl mb-lg ${danger ? 'border-accent-red/30' : ''}`}>
      <div className="flex items-start gap-md mb-lg">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? 'bg-accent-red/10' : 'bg-accent-blue/10'}`}>
          {icon}
        </div>
        <div>
          <h2 className={`text-card-title ${danger ? 'text-accent-red' : 'text-text-primary'}`}>{title}</h2>
          {description && (
            <p className="text-body-small text-text-secondary mt-xs">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// Setting Row Component
// ============================================================================

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
  last?: boolean
}

function SettingRow({ label, description, children, last = false }: SettingRowProps) {
  return (
    <div className={`flex items-center justify-between gap-lg py-md ${!last ? 'border-b border-border-light' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-body text-text-primary">{label}</p>
        {description && (
          <p className="text-body-small text-text-secondary mt-xs">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

// ============================================================================
// Toggle Component
// ============================================================================

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        w-12 h-6 rounded-full relative transition-colors
        ${enabled ? 'bg-accent-blue' : 'bg-bg-tertiary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
          ${enabled ? 'right-1' : 'left-1'}
        `}
      />
    </button>
  )
}

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-lg">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-bg-primary rounded-2xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-lg border-b border-border-light">
          <h3 className="text-card-title text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Tag Input Component
// ============================================================================

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagInput({ tags, onChange, placeholder = 'Type and press Enter...' }: TagInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()])
      }
      setInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div>
      <div className="input flex items-center gap-sm p-sm mb-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border-0 p-0 focus:ring-0 text-body-small bg-transparent"
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-sm">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-md py-xs bg-bg-tertiary text-text-secondary rounded-full text-body-small"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-bg-secondary rounded-full p-0.5 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tip Component
// ============================================================================

interface TipProps {
  children: React.ReactNode
}

function Tip({ children }: TipProps) {
  return (
    <div className="flex items-start gap-sm p-md bg-accent-blue/5 rounded-xl mt-lg">
      <LightBulbIcon className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
      <p className="text-body-small text-text-secondary">{children}</p>
    </div>
  )
}

// ============================================================================
// Settings Preview (Skeleton)
// ============================================================================

function SettingsPreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Settings</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your account and preferences</p>

      <div className="max-w-6xl mx-auto">
        {/* Account Skeleton */}
        <div className="card p-xl mb-lg">
          <div className="flex items-start gap-md mb-lg">
            <div className="w-10 h-10 bg-bg-tertiary rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-bg-tertiary rounded w-24 mb-xs animate-pulse" />
              <div className="h-4 bg-bg-tertiary rounded w-48 animate-pulse" />
            </div>
          </div>
          <div className="space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-md border-b border-border-light last:border-0">
                <div className="flex-1">
                  <div className="h-4 bg-bg-tertiary rounded w-32 mb-xs animate-pulse" />
                  <div className="h-3 bg-bg-tertiary rounded w-48 animate-pulse" />
                </div>
                <div className="h-8 bg-bg-tertiary rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Skeleton */}
        <div className="card p-xl mb-lg">
          <div className="flex items-start gap-md mb-lg">
            <div className="w-10 h-10 bg-bg-tertiary rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-bg-tertiary rounded w-28 mb-xs animate-pulse" />
              <div className="h-4 bg-bg-tertiary rounded w-56 animate-pulse" />
            </div>
          </div>
          <div className="space-y-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-md border-b border-border-light last:border-0">
                <div className="flex-1">
                  <div className="h-4 bg-bg-tertiary rounded w-40 mb-xs animate-pulse" />
                  <div className="h-3 bg-bg-tertiary rounded w-64 animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-bg-tertiary rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone Skeleton */}
        <div className="card p-xl border-accent-red/20">
          <div className="flex items-start gap-md mb-lg">
            <div className="w-10 h-10 bg-accent-red/10 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-bg-tertiary rounded w-28 mb-xs animate-pulse" />
              <div className="h-4 bg-bg-tertiary rounded w-48 animate-pulse" />
            </div>
          </div>
          <div className="space-y-md">
            <div className="flex items-center justify-between py-md">
              <div className="flex-1">
                <div className="h-4 bg-bg-tertiary rounded w-32 mb-xs animate-pulse" />
                <div className="h-3 bg-bg-tertiary rounded w-56 animate-pulse" />
              </div>
              <div className="h-8 bg-bg-tertiary rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Settings Content (Main Component)
// ============================================================================

function SettingsContent() {
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Account state
  const [email] = useState('john.doe@example.com')
  const [connectedAccounts] = useState<ConnectedAccount[]>([
    { id: '1', provider: 'google', email: 'john.doe@gmail.com', connectedAt: '2024-01-15' },
  ])

  // Modal state
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Form state for modals
  const [newEmail, setNewEmail] = useState('')
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    newJobMatches: true,
    applicationUpdates: true,
    weeklyDigest: false,
    marketingEmails: false,
    smsNotifications: false,
  })

  // Auto-apply settings
  const [autoApply, setAutoApply] = useState<AutoApplySettings>({
    enabled: true,
    maxApplicationsPerDay: 10,
    requireReviewBeforeSubmit: true,
    excludedCompanies: ['Company X', 'Company Y'],
    excludedKeywords: ['unpaid', 'intern'],
    pauseAutoApply: false,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibleToRecruiters: true,
    showSalaryExpectations: false,
    allowDataAnalytics: true,
  })

  // Handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const updateAutoApply = <K extends keyof AutoApplySettings>(key: K, value: AutoApplySettings[K]) => {
    setAutoApply((prev) => ({ ...prev, [key]: value }))
  }

  const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
  }

  const handleChangeEmail = () => {
    // TODO: Implement email change
    console.log('Change email to:', newEmail)
    setChangeEmailModalOpen(false)
    setNewEmail('')
    setCurrentPasswordForEmail('')
  }

  const handleChangePassword = () => {
    // TODO: Implement password change
    console.log('Change password')
    setChangePasswordModalOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeactivate = () => {
    // TODO: Implement deactivation
    console.log('Deactivate account')
    setDeactivateModalOpen(false)
  }

  const handleDelete = () => {
    // TODO: Implement deletion
    console.log('Delete account')
    setDeleteModalOpen(false)
    setDeleteConfirmText('')
  }

  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Export data')
  }

  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Settings</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your account and preferences</p>

      <div className="max-w-6xl mx-auto">
        {/* ================================================================ */}
        {/* Account Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<UserCircleIcon className="w-5 h-5 text-accent-blue" />}
          title="Account"
          description="Manage your email, password, and connected accounts"
        >
          <SettingRow
            label="Email address"
            description={email}
          >
            <button
              onClick={() => setChangeEmailModalOpen(true)}
              className="btn-secondary text-body-small"
            >
              Change
            </button>
          </SettingRow>

          <SettingRow
            label="Password"
            description="••••••••••••"
          >
            <button
              onClick={() => setChangePasswordModalOpen(true)}
              className="btn-secondary text-body-small"
            >
              Change
            </button>
          </SettingRow>

          <SettingRow
            label="Connected accounts"
            description="Sign in faster with connected services"
            last
          >
            <div className="flex flex-col gap-sm items-end">
              {connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`inline-flex items-center gap-2 px-md py-xs rounded-full text-body-small ${PROVIDER_INFO[account.provider].bgColor} ${PROVIDER_INFO[account.provider].color}`}
                >
                  <CheckIcon className="w-4 h-4" />
                  {PROVIDER_INFO[account.provider].name}
                </div>
              ))}
              <button className="text-accent-blue text-body-small hover:underline">
                Connect more
              </button>
            </div>
          </SettingRow>
        </SectionCard>

        {/* ================================================================ */}
        {/* Profile Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<CameraIcon className="w-5 h-5 text-accent-blue" />}
          title="Profile"
          description="Customize your profile appearance"
        >
          <div className="flex items-center gap-lg">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <UserCircleIcon className="w-12 h-12 text-text-tertiary" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent-blue-dark transition-colors"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-body text-text-primary font-medium mb-xs">Profile photo</p>
              <p className="text-body-small text-text-secondary mb-md">
                JPG, PNG or GIF. Max size 5MB.
              </p>
              <div className="flex gap-sm">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-body-small"
                >
                  Upload new
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="btn-secondary text-body-small text-accent-red"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ================================================================ */}
        {/* Notifications Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<BellIcon className="w-5 h-5 text-accent-blue" />}
          title="Notifications"
          description="Choose what updates you receive"
        >
          <SettingRow
            label="Email notifications"
            description="Master toggle for all email communications"
          >
            <Toggle
              enabled={notifications.emailNotifications}
              onChange={(v) => updateNotification('emailNotifications', v)}
            />
          </SettingRow>

          <SettingRow
            label="New job matches"
            description="Get notified when new jobs match your preferences"
          >
            <Toggle
              enabled={notifications.newJobMatches}
              onChange={(v) => updateNotification('newJobMatches', v)}
              disabled={!notifications.emailNotifications}
            />
          </SettingRow>

          <SettingRow
            label="Application updates"
            description="Status changes on your applications"
          >
            <Toggle
              enabled={notifications.applicationUpdates}
              onChange={(v) => updateNotification('applicationUpdates', v)}
              disabled={!notifications.emailNotifications}
            />
          </SettingRow>

          <SettingRow
            label="Weekly digest"
            description="Summary of new opportunities and activity"
          >
            <Toggle
              enabled={notifications.weeklyDigest}
              onChange={(v) => updateNotification('weeklyDigest', v)}
              disabled={!notifications.emailNotifications}
            />
          </SettingRow>

          <SettingRow
            label="Marketing emails"
            description="Tips, product updates, and promotions"
          >
            <Toggle
              enabled={notifications.marketingEmails}
              onChange={(v) => updateNotification('marketingEmails', v)}
              disabled={!notifications.emailNotifications}
            />
          </SettingRow>

          <SettingRow
            label="SMS notifications"
            description="Urgent updates via text message"
            last
          >
            <Toggle
              enabled={notifications.smsNotifications}
              onChange={(v) => updateNotification('smsNotifications', v)}
            />
          </SettingRow>
        </SectionCard>

        {/* ================================================================ */}
        {/* Auto-Apply Settings Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<CogIcon className="w-5 h-5 text-accent-blue" />}
          title="Auto-Apply Settings"
          description="Configure how automatic job applications work"
        >
          <SettingRow
            label="Enable auto-apply"
            description="Automatically apply to matching jobs"
          >
            <Toggle
              enabled={autoApply.enabled}
              onChange={(v) => updateAutoApply('enabled', v)}
            />
          </SettingRow>

          <SettingRow
            label="Max applications per day"
            description="Limit automatic applications to prevent spam"
          >
            <select
              value={autoApply.maxApplicationsPerDay}
              onChange={(e) => updateAutoApply('maxApplicationsPerDay', parseInt(e.target.value))}
              disabled={!autoApply.enabled}
              className="input py-xs px-sm text-body-small w-24"
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </SettingRow>

          <SettingRow
            label="Review before submit"
            description="Preview applications before they're sent"
          >
            <Toggle
              enabled={autoApply.requireReviewBeforeSubmit}
              onChange={(v) => updateAutoApply('requireReviewBeforeSubmit', v)}
              disabled={!autoApply.enabled}
            />
          </SettingRow>

          <SettingRow
            label="Pause auto-apply"
            description="Temporarily stop all automatic applications"
          >
            <Toggle
              enabled={autoApply.pauseAutoApply}
              onChange={(v) => updateAutoApply('pauseAutoApply', v)}
              disabled={!autoApply.enabled}
            />
          </SettingRow>

          <div className="py-md border-b border-border-light">
            <p className="text-body text-text-primary mb-xs">Excluded companies</p>
            <p className="text-body-small text-text-secondary mb-md">
              Companies you don't want to apply to
            </p>
            <TagInput
              tags={autoApply.excludedCompanies}
              onChange={(tags) => updateAutoApply('excludedCompanies', tags)}
              placeholder="Type company name and press Enter..."
            />
          </div>

          <div className="py-md">
            <p className="text-body text-text-primary mb-xs">Excluded keywords</p>
            <p className="text-body-small text-text-secondary mb-md">
              Skip jobs containing these words
            </p>
            <TagInput
              tags={autoApply.excludedKeywords}
              onChange={(tags) => updateAutoApply('excludedKeywords', tags)}
              placeholder="Type keyword and press Enter..."
            />
          </div>

          <Tip>
            Auto-apply uses your profile and preferences to find and apply to matching jobs.
            Enable "Review before submit" to maintain control over each application.
          </Tip>
        </SectionCard>

        {/* ================================================================ */}
        {/* Privacy & Data Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<ShieldCheckIcon className="w-5 h-5 text-accent-blue" />}
          title="Privacy & Data"
          description="Control your data and visibility"
        >
          <SettingRow
            label="Profile visible to recruiters"
            description="Allow recruiters to find your profile"
          >
            <Toggle
              enabled={privacy.profileVisibleToRecruiters}
              onChange={(v) => updatePrivacy('profileVisibleToRecruiters', v)}
            />
          </SettingRow>

          <SettingRow
            label="Show salary expectations"
            description="Display your salary range to employers"
          >
            <Toggle
              enabled={privacy.showSalaryExpectations}
              onChange={(v) => updatePrivacy('showSalaryExpectations', v)}
            />
          </SettingRow>

          <SettingRow
            label="Analytics & improvements"
            description="Help us improve by sharing usage data"
          >
            <Toggle
              enabled={privacy.allowDataAnalytics}
              onChange={(v) => updatePrivacy('allowDataAnalytics', v)}
            />
          </SettingRow>

          <SettingRow
            label="Export your data"
            description="Download a copy of all your data (GDPR/CCPA)"
            last
          >
            <button
              onClick={handleExportData}
              className="btn-secondary text-body-small inline-flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>
          </SettingRow>

          <Tip>
            Your data is encrypted and stored securely. We never sell your personal information
            to third parties. You can request a full export or deletion at any time.
          </Tip>
        </SectionCard>

        {/* ================================================================ */}
        {/* Danger Zone Section */}
        {/* ================================================================ */}
        <SectionCard
          icon={<ExclamationTriangleIcon className="w-5 h-5 text-accent-red" />}
          title="Danger Zone"
          description="Irreversible actions for your account"
          danger
        >
          <SettingRow
            label="Deactivate account"
            description="Temporarily hide your profile and pause all activity"
          >
            <button
              onClick={() => setDeactivateModalOpen(true)}
              className="btn-secondary text-body-small text-accent-yellow border-accent-yellow/50 hover:bg-accent-yellow/10"
            >
              Deactivate
            </button>
          </SettingRow>

          <SettingRow
            label="Delete account"
            description="Permanently delete your account and all data"
            last
          >
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="btn-secondary text-body-small text-accent-red border-accent-red/50 hover:bg-accent-red/10 inline-flex items-center gap-1"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </SettingRow>
        </SectionCard>
      </div>

      {/* ================================================================ */}
      {/* Change Email Modal */}
      {/* ================================================================ */}
      <Modal
        isOpen={changeEmailModalOpen}
        onClose={() => {
          setChangeEmailModalOpen(false)
          setNewEmail('')
          setCurrentPasswordForEmail('')
        }}
        title="Change Email Address"
      >
        <div className="space-y-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Current email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="input w-full bg-bg-secondary text-text-tertiary"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              New email address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Current password
            </label>
            <input
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              placeholder="Enter your password"
              className="input w-full"
            />
          </div>
          <p className="text-body-small text-text-secondary">
            We'll send a verification email to your new address.
          </p>
          <div className="flex justify-end gap-sm pt-md">
            <button
              onClick={() => {
                setChangeEmailModalOpen(false)
                setNewEmail('')
                setCurrentPasswordForEmail('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeEmail}
              disabled={!newEmail || !currentPasswordForEmail}
              className="btn-primary"
            >
              Update Email
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* Change Password Modal */}
      {/* ================================================================ */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => {
          setChangePasswordModalOpen(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        }}
        title="Change Password"
      >
        <div className="space-y-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              New password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="input w-full"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-body-small text-accent-red mt-xs">
                Passwords don't match
              </p>
            )}
          </div>
          <div className="flex justify-end gap-sm pt-md">
            <button
              onClick={() => {
                setChangePasswordModalOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
              className="btn-primary"
            >
              Update Password
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* Deactivate Account Modal */}
      {/* ================================================================ */}
      <Modal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
        title="Deactivate Account"
      >
        <div className="space-y-md">
          <div className="p-md bg-accent-yellow/10 rounded-xl">
            <p className="text-body text-text-primary font-medium mb-xs">
              What happens when you deactivate?
            </p>
            <ul className="text-body-small text-text-secondary space-y-xs">
              <li>• Your profile will be hidden from employers</li>
              <li>• Auto-apply will be paused</li>
              <li>• You can reactivate anytime by logging in</li>
              <li>• Your data will be preserved</li>
            </ul>
          </div>
          <div className="flex justify-end gap-sm pt-md">
            <button
              onClick={() => setDeactivateModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              className="btn-primary bg-accent-yellow hover:bg-accent-yellow/80 text-black"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* Delete Account Modal */}
      {/* ================================================================ */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteConfirmText('')
        }}
        title="Delete Account"
      >
        <div className="space-y-md">
          <div className="p-md bg-accent-red/10 rounded-xl">
            <p className="text-body text-accent-red font-medium mb-xs">
              This action cannot be undone
            </p>
            <ul className="text-body-small text-text-secondary space-y-xs">
              <li>• All your data will be permanently deleted</li>
              <li>• Your applications will be withdrawn</li>
              <li>• Your profile will be removed from search</li>
              <li>• You will lose access to all conversations</li>
            </ul>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="input w-full"
            />
          </div>
          <div className="flex justify-end gap-sm pt-md">
            <button
              onClick={() => {
                setDeleteModalOpen(false)
                setDeleteConfirmText('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteConfirmText !== 'DELETE'}
              className="btn-primary bg-accent-red hover:bg-accent-red/80"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================================================
// Main Export
// ============================================================================

export default function Settings() {
  return (
    <ProtectedPage
      preview={<SettingsPreview />}
      promptTitle="Sign in to access Settings"
      promptDescription="Manage your account, notifications, and preferences."
    >
      <SettingsContent />
    </ProtectedPage>
  )
}
