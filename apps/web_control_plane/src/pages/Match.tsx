import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ProtectedPage from '../components/ProtectedPage'
import ScoreBadge from '../components/ScoreBadge'
import DecisionBadge from '../components/DecisionBadge'
import api from '../services/api'
import type { Job } from '../types'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
  BoltIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAltIcon,
  ClockIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'

// 格式化发布时间
function formatPostedTime(dateString?: string): string {
  if (!dateString) return 'Recently posted'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Posted just now'
  if (diffHours < 24) return `Posted -${diffHours} hours ago`
  if (diffDays === 1) return 'Posted yesterday'
  if (diffDays < 7) return `Posted ${diffDays} days ago`
  return `Posted ${date.toLocaleDateString()}`
}

// 格式化日期
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-CA') // YYYY/MM/DD format
}

// 进度指示器组件
interface ProgressDotsProps {
  total: number
  current: number
}

function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            index <= current ? 'bg-accent-blue' : 'bg-border-default'
          }`}
        />
      ))}
    </div>
  )
}

// Match 预览内容（未登录时显示）
function MatchPreview() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Progress Dots */}
      <div className="flex justify-center py-lg">
        <div className="flex items-center gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-bg-tertiary' : 'bg-border-light'}`}
            />
          ))}
        </div>
      </div>

      {/* Card Placeholder */}
      <div className="flex-1 flex items-center justify-center px-xl">
        <div className="w-full max-w-5xl card">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-lg border-b border-border-light">
            <div className="flex gap-md">
              <div className="h-8 w-20 bg-bg-tertiary rounded" />
              <div className="h-8 w-20 bg-bg-tertiary rounded" />
            </div>
            <div className="flex gap-sm">
              <div className="h-10 w-32 bg-bg-tertiary rounded" />
              <div className="h-10 w-20 bg-bg-tertiary rounded" />
              <div className="h-10 w-24 bg-bg-tertiary rounded-xl" />
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 divide-x divide-border-light">
            <div className="p-xl space-y-md">
              <div className="h-6 bg-bg-tertiary rounded w-1/4" />
              <div className="h-8 bg-bg-tertiary rounded w-3/4" />
              <div className="h-4 bg-bg-tertiary rounded w-1/3" />
              <div className="space-y-sm mt-lg">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-bg-tertiary rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 bg-bg-tertiary rounded w-1/4 mb-1" />
                      <div className="h-4 bg-bg-tertiary rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-xl space-y-md">
              <div className="h-6 bg-bg-tertiary rounded w-1/3" />
              <div className="bg-bg-secondary rounded-lg p-md space-y-sm">
                <div className="h-5 bg-bg-tertiary rounded w-1/2" />
                <div className="h-4 bg-bg-tertiary rounded w-full" />
                <div className="h-4 bg-bg-tertiary rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Match 实际内容
function MatchContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'company'>('overview')
  const [activeDetailTab, setActiveDetailTab] = useState<'summary' | 'full'>(
    'summary'
  )
  const [showHideMenu, setShowHideMenu] = useState(false)

  // 加载推荐工作
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.searchJobs({}, 10, 0, 'newest')
        setJobs(response.jobs?.slice(0, 10) || [])
      } catch (error) {
        console.error('Failed to fetch match jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const currentJob = jobs[currentIndex]
  const totalJobs = jobs.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalJobs - 1

  // 导航函数
  const goToPrevious = useCallback(() => {
    if (!isFirst) setCurrentIndex((prev) => prev - 1)
  }, [isFirst])

  const goToNext = useCallback(() => {
    if (!isLast) setCurrentIndex((prev) => prev + 1)
  }, [isLast])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  // 处理 Apply
  const handleApply = () => {
    if (currentJob?.url) {
      window.open(currentJob.url, '_blank')
    }
  }

  // 处理 Save（暂不实现）
  const handleSave = () => {
    alert('Save feature coming soon!')
  }

  // 处理 Already Applied
  const handleAlreadyApplied = () => {
    alert('Marked as already applied')
    goToNext()
  }

  // 处理 Hide
  const handleHide = () => {
    setShowHideMenu(false)
    if (!isLast) {
      const newJobs = [...jobs]
      newJobs.splice(currentIndex, 1)
      setJobs(newJobs)
    } else if (currentIndex > 0) {
      const newJobs = [...jobs]
      newJobs.splice(currentIndex, 1)
      setJobs(newJobs)
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // 加载中
  if (isLoading) {
    return <MatchPreview />
  }

  // 没有推荐工作
  if (jobs.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <BriefcaseIcon className="w-16 h-16 text-text-tertiary mx-auto mb-lg" />
          <h2 className="text-section-title text-text-primary mb-sm">
            No matches today
          </h2>
          <p className="text-body text-text-secondary mb-lg max-w-md">
            Complete your profile to get personalized job recommendations.
          </p>
          <Link to="/profile" className="btn-primary">
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  // 全部看完
  if (currentIndex >= totalJobs) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <CheckCircleSolidIcon className="w-16 h-16 text-accent-green mx-auto mb-lg" />
          <h2 className="text-section-title text-text-primary mb-sm">
            All caught up!
          </h2>
          <p className="text-body text-text-secondary mb-lg max-w-md">
            You've reviewed all your matches for today.
          </p>
          <Link to="/jobs" className="btn-primary">
            Browse More Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col relative">
      {/* 固定的左箭头 - 垂直居中 */}
      {!isFirst && (
        <button
          onClick={goToPrevious}
          className="fixed left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-lg hover:bg-accent-blue/90 transition-all hover:scale-105"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* 固定的右箭头 - 垂直居中 */}
      {!isLast && (
        <button
          onClick={goToNext}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-lg hover:bg-accent-blue/90 transition-all hover:scale-105"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Progress Dots */}
      <div className="flex justify-center py-lg">
        <ProgressDots total={totalJobs} current={currentIndex} />
      </div>

      {/* Main Card - 居中显示 */}
      <div className="flex-1 flex items-start justify-center px-24 pb-lg">
        <div className="w-full max-w-5xl card overflow-hidden">
          {/* 卡片顶部：Tab + Actions（在卡片内部） */}
          <div className="flex items-center justify-between px-lg py-md border-b border-border-light">
            {/* Left: Tabs */}
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-md py-xs text-body-small border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-text-primary text-text-primary font-medium'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`px-md py-xs text-body-small border-b-2 transition-colors ${
                  activeTab === 'company'
                    ? 'border-text-primary text-text-primary font-medium'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                Company
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-sm">
              <button
                onClick={handleAlreadyApplied}
                className="text-body-small text-accent-blue hover:underline"
              >
                Already Applied?
              </button>
              <button
                onClick={handleSave}
                className="btn-secondary h-10 px-md flex items-center gap-1"
              >
                <BookmarkIcon className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleApply}
                className="btn-primary h-10 px-md flex items-center gap-1"
              >
                <BoltIcon className="w-4 h-4" />
                Apply
              </button>
            </div>
          </div>

          {/* 卡片内容 */}
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-light">
              {/* Left Side - Job Info */}
              <div className="p-xl">
                {/* Platform Tag & Hide */}
                <div className="flex items-center justify-between mb-md">
                  <span className="px-sm py-xs rounded-full bg-accent-blue/10 text-accent-blue text-label">
                    {currentJob.platform || 'Job Board'}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowHideMenu(!showHideMenu)}
                      className="flex items-center gap-1 text-body-small text-text-secondary hover:text-text-primary"
                    >
                      Hide
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {showHideMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowHideMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-bg-primary rounded-lg shadow-dropdown border border-border-light py-1 z-20 min-w-[160px]">
                          <button
                            onClick={handleHide}
                            className="w-full px-md py-xs text-left text-body-small text-text-secondary hover:bg-bg-secondary"
                          >
                            Not interested
                          </button>
                          <button
                            onClick={() => {
                              handleAlreadyApplied()
                              setShowHideMenu(false)
                            }}
                            className="w-full px-md py-xs text-left text-body-small text-text-secondary hover:bg-bg-secondary"
                          >
                            Already applied
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-section-title text-text-primary mb-xs">
                  {currentJob.title}
                </h1>
                <p className="text-body-small text-text-secondary mb-lg">
                  {formatPostedTime(currentJob.posted_date)}
                </p>

                {/* Company */}
                <div className="flex items-center gap-md mb-lg pb-lg border-b border-border-light">
                  <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <div>
                    <p className="text-body text-text-primary font-medium">
                      {currentJob.company_name}
                    </p>
                    <p className="text-body-small text-text-secondary">
                      via {currentJob.platform || 'Job Board'}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-lg">
                  {/* Location */}
                  {currentJob.location && (
                    <div className="flex items-start gap-md">
                      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-label text-text-secondary">
                          Location
                        </p>
                        <p className="text-body text-text-primary">
                          {currentJob.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Posted Date */}
                  <div className="flex items-start gap-md">
                    <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-label text-text-secondary">Posted</p>
                      <p className="text-body text-text-primary">
                        {formatDate(currentJob.posted_date) || 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-start gap-md">
                    <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                      <GlobeAltIcon className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-label text-text-secondary">Source</p>
                      <p className="text-body text-text-primary">
                        {currentJob.platform || 'Job Board'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Original Link */}
                {currentJob.url && (
                  <a
                    href={currentJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-lg inline-flex items-center gap-1 text-body-small text-accent-blue hover:underline"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    View original posting
                  </a>
                )}
              </div>

              {/* Right Side - Match Info */}
              <div className="p-xl">
                {/* Detail Tabs */}
                <div className="flex mb-lg border-b border-border-light">
                  <button
                    onClick={() => setActiveDetailTab('summary')}
                    className={`px-md py-xs text-body-small transition-colors ${
                      activeDetailTab === 'summary'
                        ? 'border-b-2 border-text-primary text-text-primary font-medium -mb-px'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('full')}
                    className={`px-md py-xs text-body-small transition-colors ${
                      activeDetailTab === 'full'
                        ? 'border-b-2 border-text-primary text-text-primary font-medium -mb-px'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Full Job Posting
                  </button>
                </div>

                {activeDetailTab === 'summary' ? (
                  <>
                    {/* Why This Job is a Match */}
                    <div className="bg-bg-secondary rounded-xl p-md mb-lg">
                      <div className="flex items-start justify-between mb-sm">
                        <h3 className="text-card-title text-text-primary">
                          Why This Job is a Match
                        </h3>
                        <div className="flex items-center gap-1">
                          <span className="text-label text-text-secondary">
                            See more like this?
                          </span>
                          <button className="p-1 hover:bg-bg-tertiary rounded">
                            <HandThumbUpIcon className="w-5 h-5 text-text-secondary" />
                          </button>
                          <button className="p-1 hover:bg-bg-tertiary rounded">
                            <HandThumbDownIcon className="w-5 h-5 text-text-secondary" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-sm mb-md">
                        <div className="flex items-center gap-2">
                          <CheckCircleSolidIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                          <span className="text-body-small text-text-primary">
                            Job matches your search criteria
                          </span>
                        </div>
                        {currentJob.location && (
                          <div className="flex items-center gap-2">
                            <CheckCircleSolidIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                            <span className="text-body-small text-text-primary">
                              Location: {currentJob.location}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CheckCircleSolidIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                          <span className="text-body-small text-text-primary">
                            Source: {currentJob.platform || 'Verified'}
                          </span>
                        </div>
                        {currentJob.authenticity_level && (
                          <div className="flex items-center gap-2">
                            <CheckCircleSolidIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                            <span className="text-body-small text-text-primary">
                              Authenticity verified
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="text-body-small text-accent-blue hover:underline"
                      >
                        Change preferences →
                      </Link>
                    </div>

                    {/* Authenticity Score */}
                    {currentJob.authenticity_score !== undefined &&
                      currentJob.authenticity_score !== null && (
                        <div className="mb-lg">
                          <h3 className="text-card-title text-text-primary mb-sm">
                            Authenticity Score
                          </h3>
                          <div className="flex items-center gap-md">
                            <ScoreBadge
                              score={currentJob.authenticity_score}
                              size="md"
                            />
                            <span className="text-body-small text-text-secondary">
                              {currentJob.authenticity_level || 'unknown'}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* AI Recommendation */}
                    {currentJob.decision_summary && (
                      <div className="mb-lg">
                        <h3 className="text-card-title text-text-primary mb-sm">
                          AI Recommendation
                        </h3>
                        <div className="flex items-center gap-md">
                          <DecisionBadge
                            decision={currentJob.decision_summary.decision}
                          />
                          <span className="text-body-small text-text-secondary">
                            Match score:{' '}
                            {currentJob.decision_summary.score?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Full Job Posting Tab */
                  <div className="text-center py-xl">
                    <p className="text-body text-text-secondary mb-md">
                      Full job description not available.
                    </p>
                    <a
                      href={currentJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-1"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      View on {currentJob.platform || 'Job Site'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Company Tab */
            <div className="p-xl text-center min-h-[400px] flex flex-col items-center justify-center">
              <BuildingOfficeIcon className="w-12 h-12 text-text-tertiary mb-md" />
              <p className="text-body text-text-secondary mb-md">
                View company details on their website
              </p>
              {currentJob.url && (
                <a
                  href={currentJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-1"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Visit Company Page
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Hint */}
      <div className="text-center pb-md">
        <p className="text-label text-text-tertiary">
          Use ← → arrow keys to navigate
        </p>
      </div>
    </div>
  )
}

// 导出 Match 页面
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
