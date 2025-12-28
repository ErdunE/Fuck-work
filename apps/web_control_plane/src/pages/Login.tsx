import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getLoginUrl, getSignupUrl } from '../config/cognito'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  // 如果已登录，重定向到之前的页面或 dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleLogin = () => {
    window.location.href = getLoginUrl()
  }

  const handleCreateAccount = () => {
    window.location.href = getSignupUrl()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-[48px] h-[48px] border-2 border-border-default border-t-accent-blue rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* 顶部 Logo */}
      <div className="h-nav flex items-center px-2xl">
        <div className="flex items-center gap-xs">
          <span className="text-[24px]">🚀</span>
          <span className="text-card-title text-text-primary">FuckWork</span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex items-center justify-center px-sm">
        <div className="w-full max-w-[400px] text-center">
          {/* 标题 */}
          <h1 className="text-page-title text-text-primary mb-sm">
            Welcome to FuckWork
          </h1>
          <p className="text-body text-text-secondary mb-xl">
            Automate your job applications with AI-powered tools.
          </p>

          {/* 登录按钮 */}
          <div className="space-y-sm">
            <button
              onClick={handleLogin}
              className="btn-primary w-full"
            >
              Sign In
            </button>

            <button
              onClick={handleCreateAccount}
              className="btn-secondary w-full"
            >
              Create Account
            </button>
          </div>

          {/* 底部说明 */}
          <p className="text-body-small text-text-tertiary mt-xl">
            Secure authentication powered by AWS Cognito
          </p>
        </div>
      </div>
    </div>
  )
}
