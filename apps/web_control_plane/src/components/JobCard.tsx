import { BuildingOfficeIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'
import ScoreBadge from './ScoreBadge'
import DecisionBadge from './DecisionBadge'
import type { Job } from '../types'

interface Props {
  job: Job
  onApply: (jobId: string) => void
  applying?: boolean
  compact?: boolean
}

export default function JobCard({ job, onApply, applying, compact = false }: Props) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (compact) {
    const isHighScore = job.authenticity_score !== null &&
                        job.authenticity_score !== undefined &&
                        job.authenticity_score >= 90

    const cardContent = (
      <div className="flex items-start gap-sm">
        {job.authenticity_score !== null && job.authenticity_score !== undefined && (
          <ScoreBadge score={job.authenticity_score} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-card-title text-text-primary truncate">{job.title}</h3>
          <p className="text-body-small text-text-secondary truncate">
            {job.company_name}
            {job.location && ` · ${job.location}`}
          </p>
          <div className="flex items-center gap-xs mt-xs">
            {job.decision_summary && (
              <DecisionBadge decision={job.decision_summary.decision} />
            )}
            <span className="text-label text-text-tertiary bg-bg-tertiary px-xs py-[2px] rounded">
              {job.platform}
            </span>
          </div>
        </div>
      </div>
    )

    if (isHighScore) {
      return (
        <div className="ai-glow-border">
          <div className="card p-md">
            {cardContent}
          </div>
        </div>
      )
    }

    return (
      <div className="card p-md hover:shadow-card-hover transition-shadow">
        {cardContent}
      </div>
    )
  }

  return (
    <div className="card p-lg hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-md">
        {job.authenticity_score !== null && job.authenticity_score !== undefined && (
          <ScoreBadge score={job.authenticity_score} />
        )}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-card-title text-text-primary mb-xs">{job.title}</h3>

          {/* Company & Location */}
          <div className="flex items-center gap-md text-body-small text-text-secondary mb-sm">
            <div className="flex items-center gap-xs">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span>{job.company_name}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-xs">
                <MapPinIcon className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.posted_date && (
              <div className="flex items-center gap-xs">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(job.posted_date)}</span>
              </div>
            )}
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-xs flex-wrap mb-md">
            {job.decision_summary && (
              <DecisionBadge decision={job.decision_summary.decision} />
            )}
            <span className="text-label text-text-tertiary bg-bg-tertiary px-sm py-xs rounded">
              {job.platform}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-sm border-t border-border-light">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-small text-accent-blue hover:text-accent-blue-hover transition-colors"
            >
              View Posting →
            </a>
            <button
              onClick={() => onApply(job.job_id)}
              disabled={applying}
              className="btn-primary px-md py-xs h-auto text-body-small"
            >
              {applying ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
