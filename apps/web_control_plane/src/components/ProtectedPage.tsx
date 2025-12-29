import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthPromptOverlay from './AuthPromptOverlay'

interface ProtectedPageProps {
  children: ReactNode
  /** 未登录时显示的预览内容（模糊背景） */
  preview?: ReactNode
  /** 登录提示的标题 */
  promptTitle?: string
  /** 登录提示的描述 */
  promptDescription?: string
}

export default function ProtectedPage({
  children,
  preview,
  promptTitle,
  promptDescription
}: ProtectedPageProps) {
  const { isAuthenticated, loading } = useAuth()

  // 加载中
  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-[48px] h-[48px] border-2 border-border-default border-t-accent-blue rounded-full animate-spin mx-auto mb-md" />
          <p className="text-body text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // 已登录 - 显示完整内容
  if (isAuthenticated) {
    return <>{children}</>
  }

  // 未登录 - 显示预览内容 + 登录提示覆盖层
  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* 预览内容（如果提供） */}
      {preview && (
        <div className="pointer-events-none select-none">
          {preview}
        </div>
      )}

      {/* 登录提示覆盖层 */}
      <AuthPromptOverlay
        title={promptTitle}
        description={promptDescription}
      />
    </div>
  )
}
