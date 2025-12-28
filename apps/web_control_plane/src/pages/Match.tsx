import ProtectedPage from '../components/ProtectedPage'

// Match 预览内容
function MatchPreview() {
  return (
    <div className="page-container">
      <div className="text-center mb-xl">
        <h1 className="text-page-title text-text-primary mb-sm">Today's Top Matches</h1>
        <p className="text-body text-text-secondary">10 jobs matched to your profile</p>
      </div>

      {/* 假的刷卡界面 */}
      <div className="max-w-[500px] mx-auto">
        <div className="card p-xl text-center">
          <div className="w-16 h-16 bg-bg-tertiary rounded-full mx-auto mb-md" />
          <div className="h-6 bg-bg-tertiary rounded w-3/4 mx-auto mb-sm" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2 mx-auto mb-md" />
          <div className="h-4 bg-bg-tertiary rounded w-2/3 mx-auto" />
        </div>

        {/* 假按钮 */}
        <div className="flex justify-center gap-xl mt-lg">
          <div className="w-16 h-16 bg-bg-tertiary rounded-full" />
          <div className="w-16 h-16 bg-bg-tertiary rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Match 实际内容
function MatchContent() {
  return (
    <div className="page-container">
      <div className="text-center mb-xl">
        <h1 className="text-page-title text-text-primary mb-sm">Today's Top Matches</h1>
        <p className="text-body text-text-secondary">AI-powered job recommendations</p>
      </div>

      {/* TODO: 实际的 Match 内容，Phase 2 实现 */}
      <div className="card p-lg text-center max-w-[500px] mx-auto">
        <p className="text-body text-text-secondary">Match feature coming in Phase 2...</p>
      </div>
    </div>
  )
}

export default function Match() {
  return (
    <ProtectedPage
      preview={<MatchPreview />}
      promptTitle="Sign in to see your Matches"
      promptDescription="Get AI-powered job recommendations based on your skills, experience, and preferences."
    >
      <MatchContent />
    </ProtectedPage>
  )
}
