import { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ============================================================================
// Types
// ============================================================================

interface Experience {
  id: string
  job_title: string
  company_name: string
  employment_type: string
  location_type: string
  location: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  description: string
  skills_used: string[]
}

// ============================================================================
// Constants
// ============================================================================

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
]

const LOCATION_TYPES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const YEARS = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i
  return { value: year.toString(), label: year.toString() }
})

const SKILL_SUGGESTIONS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Git',
  'Agile',
  'Scrum',
  'Project Management',
  'Team Leadership',
  'Communication',
  'Problem Solving',
  'Data Analysis',
  'Machine Learning',
]

// ============================================================================
// Empty Experience Template
// ============================================================================

const emptyExperience: Omit<Experience, 'id'> = {
  job_title: '',
  company_name: '',
  employment_type: 'full-time',
  location_type: 'on-site',
  location: '',
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  is_current: false,
  description: '',
  skills_used: [],
}

// ============================================================================
// Section Title Component
// ============================================================================

interface SectionTitleProps {
  children: React.ReactNode
  first?: boolean
}

function SectionTitle({ children, first = false }: SectionTitleProps) {
  return (
    <div
      className={`${first ? '' : 'mt-xl pt-xl border-t border-border-light'}`}
    >
      <h3 className="text-label text-text-tertiary uppercase tracking-wider mb-lg">
        {children}
      </h3>
    </div>
  )
}

// ============================================================================
// Tip Component
// ============================================================================

interface TipProps {
  children: React.ReactNode
}

function Tip({ children }: TipProps) {
  return (
    <div className="mt-lg flex items-start gap-sm p-md bg-accent-blue/5 rounded-xl">
      <LightBulbIcon className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
      <p className="text-body-small text-text-secondary">{children}</p>
    </div>
  )
}

// ============================================================================
// Tag Input Component
// ============================================================================

interface TagInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add skill...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  )

  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
      </label>
      <div className="input p-sm min-h-[48px] flex flex-wrap gap-sm">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-sm py-xs bg-accent-blue/10 text-accent-blue rounded-full text-label"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-accent-blue/20 rounded-full p-0.5"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="w-full border-0 p-0 focus:ring-0 text-body-small bg-transparent"
          />

          {showSuggestions &&
            filteredSuggestions.length > 0 &&
            inputValue && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-bg-primary rounded-lg shadow-dropdown border border-border-light py-1 z-10 max-h-48 overflow-y-auto">
                {filteredSuggestions.slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className="w-full px-sm py-xs text-left text-body-small text-text-secondary hover:bg-bg-secondary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>
      <p className="text-label text-text-tertiary mt-xs">
        Press Enter to add a skill
      </p>
    </div>
  )
}

// ============================================================================
// Experience Card Component
// ============================================================================

interface ExperienceCardProps {
  experience: Experience
  onEdit: () => void
  onDelete: () => void
}

function ExperienceCard({ experience, onEdit, onDelete }: ExperienceCardProps) {
  const getEmploymentTypeLabel = (value: string) => {
    return EMPLOYMENT_TYPES.find((t) => t.value === value)?.label || value
  }

  const getLocationTypeLabel = (value: string) => {
    return LOCATION_TYPES.find((t) => t.value === value)?.label || value
  }

  const getMonthLabel = (value: string) => {
    return MONTHS.find((m) => m.value === value)?.label?.slice(0, 3) || value
  }

  const formatDateRange = () => {
    const start = `${getMonthLabel(experience.start_month)} ${experience.start_year}`
    if (experience.is_current) {
      return `${start} - Present`
    }
    const end = `${getMonthLabel(experience.end_month)} ${experience.end_year}`
    return `${start} - ${end}`
  }

  return (
    <div className="border border-border-light rounded-xl p-lg hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        {/* Left: Company Icon + Info */}
        <div className="flex gap-md flex-1 min-w-0">
          {/* Company Icon */}
          <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon className="w-6 h-6 text-text-tertiary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Job Title */}
            <h4 className="text-body text-text-primary font-semibold">
              {experience.job_title}
            </h4>

            {/* Company Name */}
            <p className="text-body-small text-text-secondary mt-0.5">
              {experience.company_name}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {/* Employment Type */}
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="w-3.5 h-3.5" />
                {getEmploymentTypeLabel(experience.employment_type)}
              </span>

              {/* Location */}
              {experience.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {experience.location} ·{' '}
                  {getLocationTypeLabel(experience.location_type)}
                </span>
              )}

              {/* Date Range */}
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDateRange()}
              </span>
            </div>

            {/* Description */}
            {experience.description && (
              <p className="text-body-small text-text-secondary mt-md line-clamp-2">
                {experience.description}
              </p>
            )}

            {/* Skills */}
            {experience.skills_used.length > 0 && (
              <div className="flex flex-wrap gap-xs mt-md">
                {experience.skills_used.map((skill) => (
                  <span
                    key={skill}
                    className="px-sm py-xs bg-bg-tertiary text-text-secondary rounded-full text-label"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Experience Form Component
// ============================================================================

interface ExperienceFormProps {
  initialData: Omit<Experience, 'id'>
  onSave: (data: Omit<Experience, 'id'>) => void
  onCancel: () => void
  isEditing: boolean
}

function ExperienceForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
}: ExperienceFormProps) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-secondary rounded-xl p-lg">
      <h3 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Experience' : 'Add Experience'}
      </h3>

      <div className="space-y-md">
        {/* Row 1: Job Title + Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Job Title <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => updateField('job_title', e.target.value)}
              placeholder="Software Engineer"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Company Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
              placeholder="Google"
              className="input w-full"
              required
            />
          </div>
        </div>

        {/* Row 2: Employment Type + Location Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Employment Type <span className="text-accent-red">*</span>
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) => updateField('employment_type', e.target.value)}
              className="input w-full"
              required
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Location Type
            </label>
            <select
              value={formData.location_type}
              onChange={(e) => updateField('location_type', e.target.value)}
              className="input w-full"
            >
              {LOCATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Location */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="input w-full"
          />
        </div>

        {/* Row 4: Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Start Date */}
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Start Date <span className="text-accent-red">*</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.start_month}
                onChange={(e) => updateField('start_month', e.target.value)}
                className="input flex-1"
                required
              >
                <option value="">Month</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.start_year}
                onChange={(e) => updateField('start_year', e.target.value)}
                className="input w-28"
                required
              >
                <option value="">Year</option>
                {YEARS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              End Date{' '}
              {!formData.is_current && <span className="text-accent-red">*</span>}
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.end_month}
                onChange={(e) => updateField('end_month', e.target.value)}
                className="input flex-1"
                disabled={formData.is_current}
                required={!formData.is_current}
              >
                <option value="">Month</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.end_year}
                onChange={(e) => updateField('end_year', e.target.value)}
                className="input w-28"
                disabled={formData.is_current}
                required={!formData.is_current}
              >
                <option value="">Year</option>
                {YEARS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Currently Working Checkbox */}
        <div>
          <label className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => {
                updateField('is_current', e.target.checked)
                if (e.target.checked) {
                  updateField('end_month', '')
                  updateField('end_year', '')
                }
              }}
              className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-body-small text-text-primary">
              I currently work here
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your responsibilities, achievements, and impact..."
            rows={4}
            className="input w-full resize-y min-h-[100px]"
          />
        </div>

        {/* Skills Used */}
        <TagInput
          label="Skills Used"
          value={formData.skills_used}
          onChange={(value) => updateField('skills_used', value)}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="Add skills you used in this role..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {isEditing ? 'Save Changes' : 'Add Experience'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  onAdd: () => void
}

function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-xl">
      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-md">
        <BriefcaseIcon className="w-8 h-8 text-text-tertiary" />
      </div>
      <p className="text-body text-text-secondary mb-xs">
        No work experience added yet
      </p>
      <p className="text-body-small text-text-tertiary mb-lg">
        Add your work history to showcase your career progression
      </p>
      <button onClick={onAdd} className="btn-secondary">
        Add Your First Experience
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function ExperienceTab() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] =
    useState<Omit<Experience, 'id'>>(emptyExperience)

  const handleAdd = () => {
    setEditingId(null)
    setFormData(emptyExperience)
    setIsFormOpen(true)
  }

  const handleEdit = (experience: Experience) => {
    setEditingId(experience.id)
    setFormData(experience)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(emptyExperience)
  }

  const handleSave = (data: Omit<Experience, 'id'>) => {
    if (editingId) {
      // Update existing
      setExperiences((prev) =>
        prev.map((exp) =>
          exp.id === editingId ? { ...data, id: editingId } : exp
        )
      )
    } else {
      // Add new
      const newExperience: Experience = {
        ...data,
        id: Date.now().toString(),
      }
      setExperiences((prev) => [newExperience, ...prev])
    }
    handleCancel()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      setExperiences((prev) => prev.filter((exp) => exp.id !== id))
    }
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-xl">
        <div>
          <h2 className="text-section-title text-text-primary">
            Work Experience
          </h2>
          <p className="text-body-small text-text-secondary mt-xs">
            Add your work history to showcase your career progression
          </p>
        </div>
        {!isFormOpen && experiences.length > 0 && (
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Add Experience
          </button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="mb-xl">
          <ExperienceForm
            initialData={formData}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={!!editingId}
          />
        </div>
      )}

      {/* Experience List or Empty State */}
      {experiences.length > 0 ? (
        <>
          <SectionTitle first>EXPERIENCE</SectionTitle>
          <div className="space-y-md">
            {experiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                onEdit={() => handleEdit(experience)}
                onDelete={() => handleDelete(experience.id)}
              />
            ))}
          </div>
        </>
      ) : !isFormOpen ? (
        <EmptyState onAdd={handleAdd} />
      ) : null}

      {/* Tip */}
      {!isFormOpen && (
        <Tip>
          List your most recent and relevant work experiences first. Include
          specific achievements and metrics when possible (e.g., "Increased
          sales by 25%" or "Led a team of 5 engineers").
        </Tip>
      )}
    </div>
  )
}
