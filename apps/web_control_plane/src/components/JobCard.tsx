import { BuildingOfficeIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'
import ScoreBadge from './ScoreBadge'
import DecisionBadge from './DecisionBadge'
import type { Job } from '../types'

interface Props {
  job: Job
  onApply: (jobId: string) => void
  applying?: boolean
}

export default function JobCard({ job, onApply, applying }: Props) {
  return (
    <div className="relative bg-white rounded-lg shadow-soft border border-slate-200 p-6 hover:shadow-medium transition-shadow">
      {/* Score badge floats OUTSIDE on LEFT */}
      {job.authenticity_score !== null && job.authenticity_score !== undefined && (
        <ScoreBadge 
          score={job.authenticity_score} 
          className="absolute -left-6 top-6" 
        />
      )}
      
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 pr-8">
          {job.title}
        </h3>
        
        {/* Company & Location */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <BuildingOfficeIcon className="w-4 h-4" />
            <span>{job.company_name}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.posted_date && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(job.posted_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          {job.decision_summary && (
            <DecisionBadge decision={job.decision_summary.decision} />
          )}
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {job.platform}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 transition"
          >
            View Posting →
          </a>
          <button
            onClick={() => onApply(job.job_id)}
            disabled={applying}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition"
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}

