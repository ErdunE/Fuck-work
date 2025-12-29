import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedPage from '../components/ProtectedPage'
import ScoreBadge from '../components/ScoreBadge'
import api from '../services/api'
import type { Job, ApplyTask } from '../types'
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

// 获取问候语
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// 格式化相对时间
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

// 统计卡片组件
interface StatCardProps {
  icon: React.ElementType
  iconBgColor: string
  iconColor: string
  label: string
  value: string | number
  action?: {
    label: string
    to: string
  }
}

function StatCard({ icon: Icon, iconBgColor, iconColor, label, value, action }: StatCardProps) {
  return (
    <div className="card p-lg flex flex-col">
      <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center mb-md`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-body-small text-text-secondary mb-xs">{label}</p>
      <p className="text-page-title text-text-primary mb-auto">{value}</p>
      {action && (
        <Link
          to={action.to}
          className="text-body-small text-accent-blue hover:underline mt-md inline-flex items-center gap-1"
        >
          {action.label}
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

// 工作卡片（精简版）
interface JobPickCardProps {
  job: Job
}

function JobPickCard({ job }: JobPickCardProps) {
  return (
    <Link
      to={`/jobs?id=${job.id}`}
      className="flex items-center gap-md p-md rounded-xl hover:bg-bg-secondary transition-colors"
    >
      {job.authenticity_score !== undefined && job.authenticity_score !== null && (
        <ScoreBadge score={job.authenticity_score} size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-body text-text-primary truncate">{job.title}</p>
        <div className="flex items-center gap-sm text-body-small text-text-secondary">
          <span className="flex items-center gap-1">
            <BuildingOfficeIcon className="w-3.5 h-3.5" />
            {job.company_name}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              {job.location}
            </span>
          )}
        </div>
      </div>
      <ArrowRightIcon className="w-4 h-4 text-text-tertiary" />
    </Link>
  )
}

// 活动卡片
interface ActivityCardProps {
  application: ApplyTask
}

function ActivityCard({ application }: ActivityCardProps) {
  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    pending: { color: 'text-accent-blue', bgColor: 'bg-accent-blue', label: 'Pending' },
    in_progress: { color: 'text-accent-orange', bgColor: 'bg-accent-orange', label: 'In Progress' },
    completed: { color: 'text-accent-green', bgColor: 'bg-accent-green', label: 'Completed' },
    failed: { color: 'text-accent-red', bgColor: 'bg-accent-red', label: 'Failed' },
    blocked: { color: 'text-accent-red', bgColor: 'bg-accent-red', label: 'Blocked' },
  }

  const status = application.status?.toLowerCase() || 'pending'
  const config = statusConfig[status] || statusConfig.pending
  const company = application.task_metadata?.company || application.company || 'Unknown'
  const title = application.task_metadata?.title || 'Job Application'

  return (
    <div className="flex items-center gap-md p-md rounded-xl hover:bg-bg-secondary transition-colors">
      <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm">
          <span className={`text-label ${config.color}`}>{config.label}</span>
          <span className="text-body text-text-primary truncate">{company}</span>
        </div>
        <p className="text-body-small text-text-secondary truncate">{title}</p>
      </div>
      <span className="text-label text-text-tertiary whitespace-nowrap">
        {formatRelativeTime(application.created_at || new Date().toISOString())}
      </span>
    </div>
  )
}

// Dashboard 预览内容（未登录时显示）
function DashboardPreview() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-page-title text-text-primary mb-xs">
          Good morning! 👋
        </h1>
        <p className="text-body text-text-secondary">
          Here's your job search overview
        </p>
      </div>

      {/* Stats Grid - Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-lg">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary mb-md" />
            <div className="h-4 bg-bg-tertiary rounded w-2/3 mb-xs" />
            <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Top Picks - Placeholder */}
      <div className="mb-2xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-section-title text-text-primary">Today's Top Picks</h2>
          <div className="h-4 bg-bg-tertiary rounded w-20" />
        </div>
        <div className="card divide-y divide-border-light">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-md flex items-center gap-md">
              <div className="w-8 h-8 rounded-full bg-bg-tertiary" />
              <div className="flex-1">
                <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-sm" />
                <div className="h-3 bg-bg-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-section-title text-text-primary">Recent Activity</h2>
          <div className="h-4 bg-bg-tertiary rounded w-20" />
        </div>
        <div className="card divide-y divide-border-light">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-md flex items-center gap-md">
              <div className="w-2 h-2 rounded-full bg-bg-tertiary" />
              <div className="flex-1">
                <div className="h-4 bg-bg-tertiary rounded w-2/3 mb-sm" />
                <div className="h-3 bg-bg-tertiary rounded w-1/3" />
              </div>
              <div className="h-3 bg-bg-tertiary rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Dashboard 实际内容
function DashboardContent() {
  const { user } = useAuth()
  const [topJobs, setTopJobs] = useState<Job[]>([])
  const [recentApplications, setRecentApplications] = useState<ApplyTask[]>([])
  const [stats, setStats] = useState({
    todayMatches: 10,
    appliedThisWeek: 0,
    timeSavedHours: 0,
    profileStrength: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取推荐工作 (使用 searchJobs)
        const jobsResponse = await api.searchJobs({}, 5, 0, 'newest')
        setTopJobs(jobsResponse.jobs?.slice(0, 5) || [])

        // 获取最近投递
        const applicationsResponse = await api.getApplyTasks()
        const applications = applicationsResponse.tasks || []
        setRecentApplications(applications.slice(0, 5))

        // 计算统计数据
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thisWeekApplications = applications.filter((app: ApplyTask) => {
          const appDate = new Date(app.created_at || 0)
          return appDate >= weekAgo
        })

        // 每次投递节省 15 分钟
        const totalMinutesSaved = applications.length * 15
        const hoursSaved = Math.round(totalMinutesSaved / 60)

        // 简历完整度（简化计算）
        let profileStrength = 50 // 基础分
        if (user?.email) profileStrength += 25
        // TODO: 根据实际 profile 数据计算

        setStats({
          todayMatches: 10,
          appliedThisWeek: thisWeekApplications.length,
          timeSavedHours: hoursSaved,
          profileStrength: Math.min(profileStrength, 100),
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  // 获取用户名（从 email 提取）
  const userName = user?.email?.split('@')[0] || 'there'
  const greeting = getGreeting()

  if (isLoading) {
    return <DashboardPreview />
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-xl">
        <h1 className="text-page-title text-text-primary mb-xs">
          {greeting}, {userName}! 👋
        </h1>
        <p className="text-body text-text-secondary">
          Here's your job search overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-2xl">
        <StatCard
          icon={SparklesIcon}
          iconBgColor="bg-accent-blue/10"
          iconColor="text-accent-blue"
          label="Today's Matches"
          value={stats.todayMatches}
          action={{ label: 'View', to: '/match' }}
        />
        <StatCard
          icon={PaperAirplaneIcon}
          iconBgColor="bg-accent-green/10"
          iconColor="text-accent-green"
          label="Applied This Week"
          value={stats.appliedThisWeek}
        />
        <StatCard
          icon={ClockIcon}
          iconBgColor="bg-accent-orange/10"
          iconColor="text-accent-orange"
          label="Time Saved"
          value={`${stats.timeSavedHours} hrs`}
        />
        <StatCard
          icon={UserCircleIcon}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          label="Profile Strength"
          value={`${stats.profileStrength}%`}
          action={{ label: 'Complete', to: '/profile' }}
        />
      </div>

      {/* Today's Top Picks */}
      <div className="mb-2xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-section-title text-text-primary">Today's Top Picks</h2>
          <Link
            to="/match"
            className="text-body-small text-accent-blue hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
        <div className="card divide-y divide-border-light">
          {topJobs.length > 0 ? (
            topJobs.map((job) => (
              <JobPickCard key={job.id} job={job} />
            ))
          ) : (
            <div className="p-lg text-center">
              <BriefcaseIcon className="w-12 h-12 text-text-tertiary mx-auto mb-md" />
              <p className="text-body text-text-secondary mb-sm">No job recommendations yet</p>
              <Link to="/profile" className="text-body-small text-accent-blue hover:underline">
                Complete your profile to get personalized matches
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-section-title text-text-primary">Recent Activity</h2>
          <Link
            to="/applications"
            className="text-body-small text-accent-blue hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>
        <div className="card divide-y divide-border-light">
          {recentApplications.length > 0 ? (
            recentApplications.map((application) => (
              <ActivityCard key={application.id} application={application} />
            ))
          ) : (
            <div className="p-lg text-center">
              <PaperAirplaneIcon className="w-12 h-12 text-text-tertiary mx-auto mb-md" />
              <p className="text-body text-text-secondary mb-sm">No applications yet</p>
              <Link to="/jobs" className="text-body-small text-accent-blue hover:underline">
                Browse jobs and start applying
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 导出 Dashboard 页面
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
