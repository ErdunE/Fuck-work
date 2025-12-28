import ProtectedPage from '../components/ProtectedPage'

// Dashboard 预览内容（未登录时显示，会被模糊）
function DashboardPreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Dashboard</h1>
      <p className="text-body text-text-secondary mb-xl">Your job search overview</p>

      {/* 假数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="card p-lg">
          <p className="text-body-small text-text-secondary mb-xs">Today's Matches</p>
          <p className="text-page-title text-text-primary">8</p>
        </div>
        <div className="card p-lg">
          <p className="text-body-small text-text-secondary mb-xs">Applications</p>
          <p className="text-page-title text-text-primary">24</p>
        </div>
        <div className="card p-lg">
          <p className="text-body-small text-text-secondary mb-xs">Interviews</p>
          <p className="text-page-title text-text-primary">3</p>
        </div>
      </div>

      {/* 假推荐工作 */}
      <h2 className="text-section-title text-text-primary mb-md">Recommended for you</h2>
      <div className="space-y-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-md">
            <div className="h-5 bg-bg-tertiary rounded w-3/4 mb-sm" />
            <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Dashboard 实际内容（登录后显示）
function DashboardContent() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-sm">Dashboard</h1>
      <p className="text-body text-text-secondary mb-xl">Your job search overview</p>

      {/* TODO: 实际的 Dashboard 内容，Phase 2 实现 */}
      <div className="card p-lg text-center">
        <p className="text-body text-text-secondary">Dashboard content coming in Phase 2...</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedPage
      preview={<DashboardPreview />}
      promptTitle="Sign in to view your Dashboard"
      promptDescription="Track your applications, see personalized job matches, and manage your job search all in one place."
    >
      <DashboardContent />
    </ProtectedPage>
  )
}
