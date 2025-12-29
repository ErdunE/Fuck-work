import { Link } from 'react-router-dom'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface AuthPromptOverlayProps {
  title?: string
  description?: string
}

export default function AuthPromptOverlay({
  title = 'Sign in to continue',
  description = 'Create an account or sign in to access this feature and supercharge your job search.'
}: AuthPromptOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* 模糊背景层 */}
      <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm" />

      {/* 提示卡片 */}
      <div className="relative z-10 bg-bg-primary rounded-2xl shadow-dropdown border border-border-light p-xl max-w-[400px] mx-sm text-center">
        {/* 图标 */}
        <div className="w-[64px] h-[64px] rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-lg">
          <LockClosedIcon className="w-8 h-8 text-accent-blue" />
        </div>

        {/* 标题 */}
        <h2 className="text-section-title text-text-primary mb-sm">
          {title}
        </h2>

        {/* 描述 */}
        <p className="text-body text-text-secondary mb-lg">
          {description}
        </p>

        {/* 按钮 */}
        <div className="space-y-sm">
          <Link to="/login" className="btn-primary w-full">
            Sign In
          </Link>
          <Link to="/login" className="btn-secondary w-full">
            Create Account
          </Link>
        </div>

        {/* 底部提示 */}
        <p className="text-body-small text-text-tertiary mt-lg">
          Free to use • No credit card required
        </p>
      </div>
    </div>
  )
}
