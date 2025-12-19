import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Job } from '../types'
import FilterPanel, { type JobFilters } from '../components/FilterPanel'
import SearchBar from '../components/SearchBar'
import SortDropdown from '../components/SortDropdown'
import JobCard from '../components/JobCard'
import Pagination from '../components/Pagination'

export default function Jobs() {
  // State
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  // Filter & Search
  const [filters, setFilters] = useState<JobFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // UI State
  const [creatingTask, setCreatingTask] = useState<string | null>(null)

  // Load jobs whenever filters, search, sort, or page changes
  useEffect(() => {
    loadJobs()
  }, [filters, searchQuery, sortBy, currentPage])

  const loadJobsWithFilters = async (currentFilters: JobFilters) => {
    setLoading(true)
    setMessage('')
    try {
      // Combine filters with search
      const searchFilters = { ...currentFilters }

      console.log('🚀 loadJobs called')  
      console.log('🚀 Current filters:', currentFilters)  
      console.log('🚀 Search filters:', searchFilters)  
      
      // If there's a search query, add it as keywords
      if (searchQuery.trim()) {
        searchFilters.keywords_in_description = [searchQuery.trim()]
      }
      
      const offset = (currentPage - 1) * itemsPerPage
      const response = await api.searchJobs(searchFilters, itemsPerPage, offset, sortBy)
      
      setJobs(response.jobs)
      setTotal(response.total)
    } catch (error: any) {
      console.error('Failed to load jobs:', error)
      setMessage(error.response?.data?.detail || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const loadJobs = () => loadJobsWithFilters(filters)

  const handleFilterChange = (newFilters: JobFilters) => {
    console.log('🔍 Filter changed:', newFilters)
    console.log('🔍 Old filters:', filters)
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    
    // Load jobs immediately with new filters, bypassing async state update
    loadJobsWithFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
    loadJobs()
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartApply = async (job_id: string) => {
    setCreatingTask(job_id)
    setMessage('')
    try {
      const result = await api.createApplyTask(job_id)
      setMessage(result.message || 'Task created successfully')
      await loadJobs()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to create task')
    } finally {
      setCreatingTask(null)
    }
  }

  const totalPages = Math.ceil(total / itemsPerPage)
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim() !== ''

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <p className="mt-1 text-sm text-slate-600">Discover verified opportunities</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${
          message.toLowerCase().includes('success') || message.toLowerCase().includes('created')
            ? 'bg-success-50 text-success-700 border border-success-200'
            : 'bg-danger-50 text-danger-700 border border-danger-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-6">
        {/* FilterPanel: 280px */}
        <div className="flex-shrink-0">
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search + Sort Bar */}
          <div className="flex gap-4 mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by keyword..."
            />
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              {loading ? 'Loading...' : `${total} jobs found`}
            </p>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-soft p-12 text-center border border-slate-200">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-soft p-12 text-center border border-slate-200">
              <p className="text-sm text-slate-600">
                {hasActiveFilters
                  ? 'No jobs found matching your filters. Try adjusting your criteria.'
                  : 'No jobs available yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleStartApply}
                  applying={creatingTask === job.job_id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6">
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
      </div>
    </div>
  )
}

