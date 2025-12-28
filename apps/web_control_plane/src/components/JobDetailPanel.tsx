import type { Job } from '../types'
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import ScoreBadge from './ScoreBadge'
import DecisionBadge from './DecisionBadge'

interface JobDetailPanelProps {
  job: Job | null
  onApply: (job: Job) => void
  onHide: (job: Job) => void
}

export default function JobDetailPanel({ job, onApply, onHide }: JobDetailPanelProps) {
  if (!job) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary rounded-lg border border-border-light">
        <div className="text-center">
          <p className="text-body text-text-secondary">Select a job to view details</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="h-full bg-bg-primary rounded-lg border border-border-light overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-lg border-b border-border-light">
        <div className="flex items-start justify-between mb-sm">
          <div className="flex items-center gap-sm">
            {job.authenticity_score !== undefined && job.authenticity_score !== null && (
              <ScoreBadge score={job.authenticity_score} />
            )}
            {job.decision_summary && (
              <DecisionBadge decision={job.decision_summary.decision} />
            )}
          </div>
          <span className="text-body-small text-text-tertiary">
            {job.platform || 'Unknown source'}
          </span>
        </div>

        <h2 className="text-section-title text-text-primary mb-sm">{job.title}</h2>

        <div className="flex flex-wrap gap-lg text-body-small text-text-secondary">
          <span className="flex items-center gap-xs">
            <BuildingOfficeIcon className="w-4 h-4" />
            {job.company_name || 'Unknown company'}
          </span>
          <span className="flex items-center gap-xs">
            <MapPinIcon className="w-4 h-4" />
            {job.location || 'Unknown location'}
          </span>
          <span className="flex items-center gap-xs">
            <CalendarIcon className="w-4 h-4" />
            {formatDate(job.posted_date)}
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-lg">
        {/* Job Info */}
        <div className="mb-lg">
          <h3 className="text-card-title text-text-primary mb-sm">About this role</h3>
          <div className="space-y-sm text-body text-text-secondary">
            <p>
              <strong>Platform:</strong> {job.platform}
            </p>
            {job.authenticity_level && (
              <p>
                <strong>Authenticity Level:</strong> {job.authenticity_level}
              </p>
            )}
            {job.decision_summary && (
              <p>
                <strong>AI Recommendation:</strong>{' '}
                <span className={
                  job.decision_summary.decision === 'recommend' ? 'text-accent-green' :
                  job.decision_summary.decision === 'caution' ? 'text-accent-orange' :
                  'text-accent-red'
                }>
                  {job.decision_summary.decision.charAt(0).toUpperCase() + job.decision_summary.decision.slice(1)}
                </span>
                {' '}(Score: {job.decision_summary.score})
              </p>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mb-lg">
          <h3 className="text-card-title text-text-primary mb-sm">Details</h3>
          <div className="text-body text-text-secondary">
            <p>Click "Apply" to view the full job description and apply on the company's website.</p>
          </div>
        </div>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="p-lg border-t border-border-light bg-bg-primary">
        <div className="flex gap-sm">
          <button
            onClick={() => onApply(job)}
            className="btn-primary flex-1 flex items-center justify-center gap-xs"
          >
            Apply
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onHide(job)}
            className="btn-secondary px-sm"
            title="Hide this job"
          >
            <EyeSlashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
