import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ProtectedPage from '../components/ProtectedPage'
import api from '../services/api'
import type { ApplyTask } from '../types'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  ArchiveBoxIcon,
  BriefcaseIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

// 状态配置
const STATUS_CONFIG = {
  applied: {
    label: 'Applied',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    dotColor: 'bg-accent-blue',
  },
  pending: {
    label: 'Pending',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    dotColor: 'bg-accent-blue',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    dotColor: 'bg-accent-orange',
  },
  interview: {
    label: 'Interview',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    dotColor: 'bg-accent-green',
  },
  completed: {
    label: 'Completed',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    dotColor: 'bg-accent-green',
  },
  offer: {
    label: 'Offer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    dotColor: 'bg-purple-600',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10',
    dotColor: 'bg-accent-red',
  },
  failed: {
    label: 'Failed',
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10',
    dotColor: 'bg-accent-red',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-accent-red',
    bgColor: 'bg-accent-red/10',
    dotColor: 'bg-accent-red',
  },
  hidden: {
    label: 'Hidden',
    color: 'text-text-secondary',
    bgColor: 'bg-bg-tertiary',
    dotColor: 'bg-text-tertiary',
  },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

// 筛选 Tab 配置
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'hidden', label: 'Hidden' },
] as const

// 排序选项
const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'company-az', label: 'Company A-Z' },
  { key: 'company-za', label: 'Company Z-A' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// 获取状态配置
function getStatusConfig(status?: string) {
  const key = (status?.toLowerCase() || 'applied') as StatusKey
  return STATUS_CONFIG[key] || STATUS_CONFIG.applied
}

// 状态下拉选择组件
interface StatusSelectProps {
  currentStatus: string
  onStatusChange: (newStatus: string) => void
}

function StatusSelect({ currentStatus, onStatusChange }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = getStatusConfig(currentStatus)

  const statusOptions = [
    { key: 'applied', label: 'Applied' },
    { key: 'interview', label: 'Interview' },
    { key: 'offer', label: 'Offer' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'hidden', label: 'Hidden' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-sm py-xs rounded-full ${config.bgColor} ${config.color} text-body-small`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        {config.label}
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 bg-bg-primary rounded-lg shadow-dropdown border border-border-light py-1 z-20 min-w-[140px]">
            {statusOptions.map((option) => {
              const optConfig = getStatusConfig(option.key)
              const isSelected = option.key === currentStatus.toLowerCase()
              return (
                <button
                  key={option.key}
                  onClick={() => {
                    onStatusChange(option.key)
                    setIsOpen(false)
                  }}
                  className="w-full px-sm py-xs text-left text-body-small hover:bg-bg-secondary flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${optConfig.dotColor}`} />
                  <span className={optConfig.color}>{option.label}</span>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 ml-auto text-accent-blue" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// 排序下拉组件
interface SortSelectProps {
  value: SortKey
  onChange: (value: SortKey) => void
}

function SortSelect({ value, onChange }: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentOption = SORT_OPTIONS.find((opt) => opt.key === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-sm py-xs rounded-lg border border-border-default text-body-small text-text-secondary hover:border-border-dark"
      >
        Sort: {currentOption?.label}
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-bg-primary rounded-lg shadow-dropdown border border-border-light py-1 z-20 min-w-[160px]">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onChange(option.key)
                  setIsOpen(false)
                }}
                className="w-full px-sm py-xs text-left text-body-small hover:bg-bg-secondary flex items-center justify-between"
              >
                {option.label}
                {option.key === value && (
                  <CheckIcon className="w-4 h-4 text-accent-blue" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 单个投递记录卡片
interface ApplicationCardProps {
  application: ApplyTask
  onStatusChange: (id: number, newStatus: string) => void
  onArchive: (id: number) => void
}

function ApplicationCard({
  application,
  onStatusChange,
  onArchive,
}: ApplicationCardProps) {
  const status = application.status || 'applied'

  // 从 task_metadata 获取工作信息
  const jobTitle = application.task_metadata?.title || 'Unknown Position'
  const company =
    application.task_metadata?.company || application.company || 'Unknown Company'
  const location = application.task_metadata?.location || ''
  const jobUrl = application.task_metadata?.url || ''
  const appliedDate = formatDate(application.created_at)

  return (
    <div className="card p-lg hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-md">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          {/* Company & Date */}
          <div className="flex items-center gap-sm mb-xs">
            <div className="flex items-center gap-1 text-body-small text-text-secondary">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span className="font-medium">{company}</span>
            </div>
            {appliedDate && (
              <div className="flex items-center gap-1 text-label text-text-tertiary">
                <CalendarIcon className="w-3.5 h-3.5" />
                {appliedDate}
              </div>
            )}
          </div>

          {/* Job Title */}
          <h3 className="text-card-title text-text-primary mb-xs truncate">
            {jobTitle}
          </h3>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 text-body-small text-text-secondary">
              <MapPinIcon className="w-4 h-4" />
              {location}
            </div>
          )}
        </div>

        {/* Right: Status & Actions */}
        <div className="flex flex-col items-end gap-sm">
          {/* Status Dropdown */}
          <StatusSelect
            currentStatus={status}
            onStatusChange={(newStatus) => onStatusChange(application.id, newStatus)}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-sm">
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-body-small text-accent-blue hover:underline"
              >
                View Job
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => onArchive(application.id)}
              className="flex items-center gap-1 text-body-small text-text-secondary hover:text-text-primary"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Applications 预览内容（未登录时显示）
function ApplicationsPreview() {
  return (
    <div className="page-container">
      <h1 className="text-page-title text-text-primary mb-xs">Applications</h1>
      <p className="text-body text-text-secondary mb-lg">
        Track your job applications
      </p>

      {/* Filter Tabs Placeholder */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {FILTER_TABS.map((tab, index) => (
          <div
            key={tab.key}
            className={`px-md py-xs rounded-full ${
              index === 0 ? 'bg-bg-tertiary' : 'bg-border-light'
            }`}
          >
            <span className="text-body-small text-text-secondary">{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Sort Placeholder */}
      <div className="flex items-center justify-between gap-md mb-lg">
        <div className="flex-1 max-w-md h-10 bg-bg-tertiary rounded-xl" />
        <div className="h-10 w-32 bg-bg-tertiary rounded-lg" />
      </div>

      {/* Cards Placeholder */}
      <div className="space-y-md">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-sm" />
                <div className="h-5 bg-bg-tertiary rounded w-2/3 mb-sm" />
                <div className="h-4 bg-bg-tertiary rounded w-1/4" />
              </div>
              <div className="flex flex-col items-end gap-sm">
                <div className="h-7 w-24 bg-bg-tertiary rounded-full" />
                <div className="h-4 w-20 bg-bg-tertiary rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Applications 实际内容
function ApplicationsContent() {
  const [applications, setApplications] = useState<ApplyTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  // 加载投递记录
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.getApplyTasks()
        setApplications(response.tasks || [])
      } catch (error) {
        console.error('Failed to fetch applications:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApplications()
  }, [])

  // 统计各状态数量
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length }
    applications.forEach((app) => {
      const status = (app.status || 'applied').toLowerCase()
      // 映射状态到筛选 Tab
      let filterKey = status
      if (['pending', 'in_progress', 'completed'].includes(status)) {
        filterKey = 'applied'
      }
      if (['failed', 'blocked'].includes(status)) {
        filterKey = 'rejected'
      }
      counts[filterKey] = (counts[filterKey] || 0) + 1
    })
    return counts
  }, [applications])

  // 筛选和排序
  const filteredApplications = useMemo(() => {
    let result = [...applications]

    // 按状态筛选
    if (activeFilter !== 'all') {
      result = result.filter((app) => {
        const status = (app.status || 'applied').toLowerCase()
        if (activeFilter === 'applied') {
          return ['applied', 'pending', 'in_progress', 'completed'].includes(status)
        }
        if (activeFilter === 'rejected') {
          return ['rejected', 'failed', 'blocked'].includes(status)
        }
        return status === activeFilter
      })
    }

    // 搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((app) => {
        const title = (app.task_metadata?.title || '').toLowerCase()
        const company = (
          app.task_metadata?.company ||
          app.company ||
          ''
        ).toLowerCase()
        return title.includes(query) || company.includes(query)
      })
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          )
        case 'company-az': {
          const companyA = (
            a.task_metadata?.company ||
            a.company ||
            ''
          ).toLowerCase()
          const companyB = (
            b.task_metadata?.company ||
            b.company ||
            ''
          ).toLowerCase()
          return companyA.localeCompare(companyB)
        }
        case 'company-za': {
          const companyA = (
            a.task_metadata?.company ||
            a.company ||
            ''
          ).toLowerCase()
          const companyB = (
            b.task_metadata?.company ||
            b.company ||
            ''
          ).toLowerCase()
          return companyB.localeCompare(companyA)
        }
        default:
          return 0
      }
    })

    return result
  }, [applications, activeFilter, searchQuery, sortBy])

  // 处理状态变更
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // TODO: 调用 API 更新状态
      // await api.updateApplyTaskStatus(id, newStatus)

      // 本地更新
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      )
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  // 处理归档
  const handleArchive = async (id: number) => {
    try {
      // TODO: 调用 API 归档
      // await api.archiveApplyTask(id)

      // 本地更新为 hidden
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'hidden' } : app))
      )
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }

  if (isLoading) {
    return <ApplicationsPreview />
  }

  return (
    <div className="page-container">
      {/* Header */}
      <h1 className="text-page-title text-text-primary mb-xs">Applications</h1>
      <p className="text-body text-text-secondary mb-lg">
        Track your job applications
      </p>

      {/* Filter Tabs */}
      <div className="flex gap-sm mb-lg flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0
          const isActive = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-md py-xs rounded-full text-body-small transition-colors ${
                isActive
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-border-default'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Search & Sort */}
      <div className="flex items-center justify-between gap-md mb-lg">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by company or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Sort */}
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-md">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="card p-xl text-center">
          <BriefcaseIcon className="w-12 h-12 text-text-tertiary mx-auto mb-md" />
          <h3 className="text-card-title text-text-primary mb-sm">
            {searchQuery
              ? 'No matching applications'
              : activeFilter === 'all'
                ? 'No applications yet'
                : `No ${activeFilter} applications`}
          </h3>
          <p className="text-body text-text-secondary mb-lg">
            {searchQuery
              ? 'Try a different search term'
              : activeFilter === 'all'
                ? 'Start applying to jobs to track them here'
                : 'Applications will appear here when their status changes'}
          </p>
          {activeFilter === 'all' && !searchQuery && (
            <Link to="/jobs" className="btn-primary">
              Browse Jobs
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// 导出 Applications 页面
export default function Applications() {
  return (
    <ProtectedPage
      preview={<ApplicationsPreview />}
      promptTitle="Sign in to track Applications"
      promptDescription="Keep track of all your job applications, interviews, and offers in one place."
    >
      <ApplicationsContent />
    </ProtectedPage>
  )
}
