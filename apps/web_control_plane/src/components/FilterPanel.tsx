import { Disclosure } from '@headlessui/react'
import { 
  ChevronDownIcon, 
  FunnelIcon, 
  BriefcaseIcon, 
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

export interface JobFilters {
  // Existing filters
  min_score?: number
  max_score?: number
  job_level?: string[]
  employment_type?: string[]
  work_mode?: string[]
  visa_signal?: string[]
  states?: string[]
  country?: string
  min_salary?: number
  max_salary?: number
  platforms?: string[]
  posted_days_ago?: number
  
  // Tier 2: Experience
  min_experience_years?: number
  max_experience_years?: number
  has_salary_info?: boolean
  salary_interval?: string[]
  
  // Tier 3: Computed
  has_red_flags?: boolean
  max_red_flags?: number
  min_positive_signals?: number
  
  // Tier 4: Advanced
  exclude_companies?: string[]
  include_companies_only?: string[]
  keywords_in_description?: string[]
  exclude_keywords?: string[]
}

interface Props {
  filters: JobFilters
  onChange: (filters: JobFilters) => void
  onClear: () => void
}

export default function FilterPanel({ filters, onChange, onClear }: Props) {
  const updateFilter = (key: keyof JobFilters, value: any) => {
    onChange({ ...filters, [key]: value })
  }
  
  const toggleArrayValue = (key: keyof JobFilters, value: string) => {
    const current = (filters[key] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: updated.length > 0 ? updated : undefined })
  }
  
  const hasActiveFilters = Object.keys(filters).length > 0
  
  return (
    <div className="w-70 bg-white rounded-lg shadow-soft border border-slate-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900">Filters</h3>
          {hasActiveFilters && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-slate-600 hover:text-slate-900 transition"
            aria-label="Clear all filters"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="divide-y divide-slate-200">
        {/* Basic Filters */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">Basic</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-3 space-y-4">
                {/* Score Range */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Authenticity Score</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_score || ''}
                      onChange={(e) => updateFilter('min_score', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0"
                      max="100"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_score || ''}
                      onChange={(e) => updateFilter('max_score', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                {/* Job Level */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Job Level</label>
                  <div className="space-y-2">
                    {['intern', 'new_grad', 'junior', 'mid', 'senior', 'staff'].map((level) => (
                      <label key={level} className="flex items-center text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={(filters.job_level || []).includes(level)}
                          onChange={() => toggleArrayValue('job_level', level)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2"
                        />
                        <span className="capitalize">{level.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Work Mode */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Work Mode</label>
                  <div className="space-y-2">
                    {['remote', 'hybrid', 'onsite'].map((mode) => (
                      <label key={mode} className="flex items-center text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={(filters.work_mode || []).includes(mode)}
                          onChange={() => toggleArrayValue('work_mode', mode)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2"
                        />
                        <span className="capitalize">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        
        {/* Tier 2: Salary & Compensation */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">Salary & Compensation</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-3 space-y-4">
                {/* Has Salary Info */}
                <label className="flex items-center text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.has_salary_info || false}
                    onChange={(e) => updateFilter('has_salary_info', e.target.checked ? true : undefined)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  Salary Disclosed
                </label>
                
                {/* Salary Range */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Salary Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_salary || ''}
                      onChange={(e) => updateFilter('min_salary', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_salary || ''}
                      onChange={(e) => updateFilter('max_salary', e.target.value ? Number(e.target.value) : undefined)}
                      className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Salary Interval */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Salary Interval</label>
                  <select
                    value={(filters.salary_interval || [])[0] || ''}
                    onChange={(e) => updateFilter('salary_interval', e.target.value ? [e.target.value] : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Any</option>
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        
        {/* Tier 3: Quality & Timing */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">Quality & Timing</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-3 space-y-4">
                {/* Posted Within */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Posted Within</label>
                  <select
                    value={filters.posted_days_ago ?? ''}
                    onChange={(e) => updateFilter('posted_days_ago', e.target.value ? Number(e.target.value) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Any time</option>
                    <option value="1">Last 24 hours</option>
                    <option value="3">Last 3 days</option>
                    <option value="7">Last week</option>
                    <option value="14">Last 2 weeks</option>
                    <option value="30">Last month</option>
                  </select>
                </div>
                
                {/* Has Red Flags */}
                <label className="flex items-center text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.has_red_flags === false}
                    onChange={(e) => updateFilter('has_red_flags', e.target.checked ? false : undefined)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  No Red Flags
                </label>
                
                {/* Max Red Flags */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Max Red Flags</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={filters.max_red_flags || ''}
                    onChange={(e) => updateFilter('max_red_flags', e.target.value ? Number(e.target.value) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        
        {/* Tier 4: Advanced */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between items-center px-4 py-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">Advanced</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 py-3 space-y-4">
                {/* Include Companies Only */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Include Companies Only</label>
                  <input
                    type="text"
                    placeholder="Stripe, OpenAI, Anthropic"
                    value={(filters.include_companies_only || []).join(', ')}
                    onChange={(e) => updateFilter('include_companies_only', e.target.value ? e.target.value.split(',').map(k => k.trim()).filter(k => k) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                {/* Exclude Companies */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Exclude Companies</label>
                  <input
                    type="text"
                    placeholder="Google, Meta, Amazon"
                    value={(filters.exclude_companies || []).join(', ')}
                    onChange={(e) => updateFilter('exclude_companies', e.target.value ? e.target.value.split(',').map(k => k.trim()).filter(k => k) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                {/* Required Keywords */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Required Keywords</label>
                  <input
                    type="text"
                    placeholder="Python, React"
                    value={(filters.keywords_in_description || []).join(', ')}
                    onChange={(e) => updateFilter('keywords_in_description', e.target.value ? e.target.value.split(',').map(k => k.trim()).filter(k => k) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                {/* Exclude Keywords */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Exclude Keywords</label>
                  <input
                    type="text"
                    placeholder="staffing, agency"
                    value={(filters.exclude_keywords || []).join(', ')}
                    onChange={(e) => updateFilter('exclude_keywords', e.target.value ? e.target.value.split(',').map(k => k.trim()).filter(k => k) : undefined)}
                    className="block w-full rounded-md border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  )
}

