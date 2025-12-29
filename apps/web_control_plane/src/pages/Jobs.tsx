import { useEffect, useState } from 'react'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api'
import type { Job } from '../types'
import JobCard from '../components/JobCard'
import JobDetailPanel from '../components/JobDetailPanel'
import FilterDialog, { type FilterState } from '../components/FilterDialog'
import Pagination from '../components/Pagination'

const defaultFilters: FilterState = {
  jobLevels: [],
  workModes: [],
  salaryMin: null,
  salaryMax: null,
  salaryDisclosed: false,
  postedWithin: null,
}

export default function Jobs() {
  // State
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Load jobs
  useEffect(() => {
    loadJobs()
  }, [currentPage])

  const loadJobs = async () => {
    setLoading(true)
    try {
      // Build search filters from FilterState
      const searchFilters: Record<string, unknown> = {}

      if (searchQuery.trim()) {
        searchFilters.keywords_in_description = [searchQuery.trim()]
      }

      if (filters.jobLevels.length > 0) {
        searchFilters.job_levels = filters.jobLevels
      }

      if (filters.workModes.length > 0) {
        searchFilters.work_modes = filters.workModes
      }

      if (filters.salaryMin !== null) {
        searchFilters.salary_min = filters.salaryMin
      }

      if (filters.salaryMax !== null) {
        searchFilters.salary_max = filters.salaryMax
      }

      if (filters.salaryDisclosed) {
        searchFilters.salary_disclosed = true
      }

      if (filters.postedWithin) {
        searchFilters.posted_within = filters.postedWithin
      }

      const offset = (currentPage - 1) * itemsPerPage
      const response = await api.searchJobs(searchFilters, itemsPerPage, offset, 'newest')

      setJobs(response.jobs)
      setTotal(response.total)

      // Select first job if none selected
      if (response.jobs.length > 0 && !selectedJob) {
        setSelectedJob(response.jobs[0])
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadJobs()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
    // Trigger reload after state update
    setTimeout(() => loadJobs(), 0)
  }

  const handleRemoveFilter = (type: string, value?: string) => {
    const newFilters = { ...filters }

    switch (type) {
      case 'jobLevel':
        newFilters.jobLevels = filters.jobLevels.filter((l) => l !== value)
        break
      case 'workMode':
        newFilters.workModes = filters.workModes.filter((m) => m !== value)
        break
      case 'salary':
        newFilters.salaryMin = null
        newFilters.salaryMax = null
        newFilters.salaryDisclosed = false
        break
      case 'postedWithin':
        newFilters.postedWithin = null
        break
    }

    setFilters(newFilters)
    setCurrentPage(1)
    setTimeout(() => loadJobs(), 0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedJob(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleApply = (job: Job) => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleHide = (job: Job) => {
    // Remove from local list for now
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
    if (selectedJob?.id === job.id) {
      setSelectedJob(null)
    }
  }

  const totalPages = Math.ceil(total / itemsPerPage)

  // Build active filter tags
  const activeFilterTags: { type: string; label: string; value?: string }[] = []

  filters.jobLevels.forEach((level) => {
    activeFilterTags.push({ type: 'jobLevel', label: level, value: level })
  })

  filters.workModes.forEach((mode) => {
    activeFilterTags.push({ type: 'workMode', label: mode, value: mode })
  })

  if (filters.salaryMin !== null || filters.salaryMax !== null || filters.salaryDisclosed) {
    let salaryLabel = 'Salary: '
    if (filters.salaryMin && filters.salaryMax) {
      salaryLabel += `$${filters.salaryMin.toLocaleString()} - $${filters.salaryMax.toLocaleString()}`
    } else if (filters.salaryMin) {
      salaryLabel += `>$${filters.salaryMin.toLocaleString()}`
    } else if (filters.salaryMax) {
      salaryLabel += `<$${filters.salaryMax.toLocaleString()}`
    }
    if (filters.salaryDisclosed) {
      salaryLabel += salaryLabel === 'Salary: ' ? 'Disclosed only' : ' (Disclosed)'
    }
    activeFilterTags.push({ type: 'salary', label: salaryLabel })
  }

  if (filters.postedWithin) {
    const labels: Record<string, string> = {
      '24h': 'Past 24 hours',
      '7d': 'Past week',
      '30d': 'Past month',
    }
    activeFilterTags.push({ type: 'postedWithin', label: labels[filters.postedWithin] || filters.postedWithin })
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="text-page-title text-text-primary">Jobs</h1>
        <p className="text-body text-text-secondary mt-xs">
          Discover verified opportunities
        </p>
      </div>

      {/* Search Bar + Filter Button */}
      <div className="flex gap-sm mb-md">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-sm top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs by title, company, or keyword..."
            className="input pl-xl"
          />
        </div>
        <button
          onClick={() => setIsFilterDialogOpen(true)}
          className="btn-secondary flex items-center gap-xs"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          Filters
          {activeFilterTags.length > 0 && (
            <span className="ml-xs w-5 h-5 rounded-full bg-accent-blue text-white text-label flex items-center justify-center">
              {activeFilterTags.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Tags */}
      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap gap-xs mb-md">
          {activeFilterTags.map((tag, index) => (
            <span
              key={`${tag.type}-${tag.value || index}`}
              className="inline-flex items-center gap-xs px-sm py-xs bg-bg-tertiary text-text-secondary text-body-small rounded-full"
            >
              {tag.label}
              <button
                onClick={() => handleRemoveFilter(tag.type, tag.value)}
                className="hover:text-text-primary"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-body-small text-text-secondary mb-md">
        {loading ? 'Loading...' : `${total} jobs found`}
      </p>

      {/* Main Content - Split View */}
      <div className="flex gap-lg" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
        {/* Left Panel - Job List */}
        <div className="w-[400px] flex-shrink-0 overflow-y-auto p-xs -m-xs">
          {loading ? (
            <div className="card p-lg text-center">
              <div className="animate-pulse space-y-sm">
                <div className="h-4 bg-bg-tertiary rounded w-3/4 mx-auto" />
                <div className="h-4 bg-bg-tertiary rounded w-1/2 mx-auto" />
              </div>
              <p className="text-body-small text-text-tertiary mt-md">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-lg text-center">
              <p className="text-body text-text-secondary">
                {activeFilterTags.length > 0
                  ? 'No jobs found matching your filters.'
                  : 'No jobs available yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`cursor-pointer transition-all duration-fast ${
                    selectedJob?.id === job.id
                      ? 'ring-2 ring-accent-blue rounded-lg'
                      : ''
                  }`}
                >
                  <JobCard
                    job={job}
                    onApply={() => handleApply(job)}
                    applying={false}
                    compact
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-lg">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Job Detail */}
        <div className="flex-1 min-w-0">
          <JobDetailPanel
            job={selectedJob}
            onApply={handleApply}
            onHide={handleHide}
          />
        </div>
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </div>
  )
}
