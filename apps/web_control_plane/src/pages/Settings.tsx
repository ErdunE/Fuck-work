import ProtectedPage from '../components/ProtectedPage'

// Settings 预览内容
function SettingsPreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Settings</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your account settings</p>

      <div className="max-w-[600px]">
        <div className="card p-lg mb-lg">
          <h2 className="text-card-title text-text-primary mb-md">Account</h2>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-bg-tertiary rounded w-1/4" />
              <div className="h-8 bg-bg-tertiary rounded w-24" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-bg-tertiary rounded w-1/3" />
              <div className="h-8 bg-bg-tertiary rounded w-24" />
            </div>
          </div>
        </div>

        <div className="card p-lg">
          <h2 className="text-card-title text-text-primary mb-md">Notifications</h2>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-bg-tertiary rounded w-1/2" />
              <div className="h-6 w-12 bg-bg-tertiary rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-bg-tertiary rounded w-1/3" />
              <div className="h-6 w-12 bg-bg-tertiary rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings 实际内容
function SettingsContent() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Settings</h1>
      <p className="text-body text-text-secondary mb-lg">Manage your account settings</p>

      <div className="max-w-[600px]">
        {/* Account Section */}
        <div className="card p-lg mb-lg">
          <h2 className="text-card-title text-text-primary mb-md">Account</h2>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text-primary">Email</p>
                <p className="text-body-small text-text-secondary">user@example.com</p>
              </div>
              <button className="btn-secondary text-body-small">Change</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text-primary">Password</p>
                <p className="text-body-small text-text-secondary">••••••••</p>
              </div>
              <button className="btn-secondary text-body-small">Change</button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card p-lg mb-lg">
          <h2 className="text-card-title text-text-primary mb-md">Notifications</h2>
          <div className="space-y-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text-primary">Email notifications</p>
                <p className="text-body-small text-text-secondary">Receive updates about your applications</p>
              </div>
              <button className="w-12 h-6 bg-accent-blue rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text-primary">Weekly digest</p>
                <p className="text-body-small text-text-secondary">Get a summary of new job matches</p>
              </div>
              <button className="w-12 h-6 bg-bg-tertiary rounded-full relative">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-lg border-accent-red/20">
          <h2 className="text-card-title text-accent-red mb-md">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-text-primary">Delete account</p>
              <p className="text-body-small text-text-secondary">Permanently delete your account and data</p>
            </div>
            <button className="btn-secondary text-accent-red border-accent-red/50 hover:bg-accent-red/10 text-body-small">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
