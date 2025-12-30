import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  MapPinIcon,
  CalendarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import profileApi from '../../services/profileApi'
import type { Education, EducationFormData } from '../../types/profile'
import { MONTHS, DEGREE_TYPES } from '../../types/profile'

// ============================================================================
// Constants
// ============================================================================

const MONTH_OPTIONS = MONTHS.map((m) => ({ value: m, label: m }))

const DEGREE_OPTIONS = DEGREE_TYPES.map((d) => ({ value: d, label: d }))

const YEARS = Array.from({ length: 60 }, (_, i) => {
  const year = new Date().getFullYear() + 5 - i // Future years for expected graduation
  return { value: year, label: year.toString() }
})

// ============================================================================
// Empty Education Template
// ============================================================================

const emptyEducation: EducationFormData = {
  school_name: '',
  degree: "Bachelor's Degree",
  field_of_study: '',
  location: null,
  start_month: null,
  start_year: null,
  end_month: null,
  end_year: null,
  is_current: false,
  gpa: null,
  honors: null,
  coursework: null,
  activities: null,
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
// Education Card Component
// ============================================================================

interface EducationCardProps {
  education: Education
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

function EducationCard({
  education,
  onEdit,
  onDelete,
  isDeleting,
}: EducationCardProps) {
  const formatDateRange = () => {
    const startMonth = education.start_month?.slice(0, 3) || ''
    const start = education.start_year
      ? `${startMonth} ${education.start_year}`
      : ''
    if (education.is_current) {
      return start ? `${start} - Present` : 'Present'
    }
    const endMonth = education.end_month?.slice(0, 3) || ''
    const end = education.end_year ? `${endMonth} ${education.end_year}` : ''
    if (start && end) return `${start} - ${end}`
    if (end) return `Expected ${end}`
    return start
  }

  return (
    <div className="border border-border-light rounded-xl p-lg hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        {/* Left: School Icon + Info */}
        <div className="flex gap-md flex-1 min-w-0">
          {/* School Icon */}
          <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <AcademicCapIcon className="w-6 h-6 text-text-tertiary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* School Name */}
            <h4 className="text-body text-text-primary font-semibold">
              {education.school_name}
            </h4>

            {/* Degree + Field */}
            <p className="text-body-small text-text-secondary mt-0.5">
              {education.degree}
              {education.field_of_study && ` in ${education.field_of_study}`}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {/* Location */}
              {education.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {education.location}
                </span>
              )}

              {/* Date Range */}
              {formatDateRange() && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDateRange()}
                </span>
              )}

              {/* GPA */}
              {education.gpa && <span>GPA: {education.gpa}</span>}
            </div>

            {/* Honors */}
            {education.honors && (
              <p className="text-body-small text-text-secondary mt-sm">
                {education.honors}
              </p>
            )}

            {/* Relevant Coursework */}
            {education.coursework && (
              <p className="text-body-small text-text-tertiary mt-sm line-clamp-2">
                Coursework: {education.coursework}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
            title="Edit"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
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
// Education Form Component
// ============================================================================

interface EducationFormProps {
  initialData: EducationFormData
  onSave: (data: EducationFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}

function EducationForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: EducationFormProps) {
  const [formData, setFormData] = useState<EducationFormData>(initialData)

  const updateField = (
    field: keyof EducationFormData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-secondary rounded-xl p-lg">
      <h3 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Education' : 'Add Education'}
      </h3>

      <div className="space-y-md">
        {/* Row 1: School Name */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            School Name <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={formData.school_name}
            onChange={(e) => updateField('school_name', e.target.value)}
            placeholder="Stanford University"
            className="input w-full"
            required
          />
        </div>

        {/* Row 2: Degree + Field of Study */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Degree
            </label>
            <select
              value={formData.degree || ''}
              onChange={(e) => updateField('degree', e.target.value || null)}
              className="input w-full"
            >
              <option value="">Select degree</option>
              {DEGREE_OPTIONS.map((degree) => (
                <option key={degree.value} value={degree.value}>
                  {degree.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Field of Study
            </label>
            <input
              type="text"
              value={formData.field_of_study || ''}
              onChange={(e) => updateField('field_of_study', e.target.value || null)}
              placeholder="Computer Science"
              className="input w-full"
            />
          </div>
        </div>

        {/* Row 3: Location */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Location <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => updateField('location', e.target.value || null)}
            placeholder="Stanford, CA"
            className="input w-full"
          />
        </div>

        {/* Row 4: Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Start Date */}
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Start Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.start_month || ''}
                onChange={(e) => updateField('start_month', e.target.value || null)}
                className="input flex-1"
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.start_year || ''}
                onChange={(e) =>
                  updateField(
                    'start_year',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="input w-28"
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
              End Date (or Expected){' '}
              <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.end_month || ''}
                onChange={(e) => updateField('end_month', e.target.value || null)}
                className="input flex-1"
                disabled={formData.is_current}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.end_year || ''}
                onChange={(e) =>
                  updateField(
                    'end_year',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="input w-28"
                disabled={formData.is_current}
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

        {/* Currently Studying Checkbox */}
        <div>
          <label className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => {
                updateField('is_current', e.target.checked)
                if (e.target.checked) {
                  updateField('end_month', null)
                  updateField('end_year', null)
                }
              }}
              className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-body-small text-text-primary">
              I am currently studying here
            </span>
          </label>
        </div>

        {/* Row 5: GPA + Honors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              GPA <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.gpa || ''}
              onChange={(e) => updateField('gpa', e.target.value || null)}
              placeholder="3.8/4.0"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Honors / Awards <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.honors || ''}
              onChange={(e) => updateField('honors', e.target.value || null)}
              placeholder="Cum Laude, Dean's List"
              className="input w-full"
            />
          </div>
        </div>

        {/* Row 6: Relevant Coursework */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Relevant Coursework{' '}
            <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.coursework || ''}
            onChange={(e) => updateField('coursework', e.target.value || null)}
            placeholder="Data Structures, Algorithms, Machine Learning, Database Systems..."
            rows={3}
            className="input w-full resize-y min-h-[80px]"
          />
        </div>

        {/* Row 7: Activities */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Activities & Societies{' '}
            <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.activities || ''}
            onChange={(e) => updateField('activities', e.target.value || null)}
            placeholder="Computer Science Club, Hackathon Team, Student Government..."
            rows={3}
            className="input w-full resize-y min-h-[80px]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Education'}
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
        <AcademicCapIcon className="w-8 h-8 text-text-tertiary" />
      </div>
      <p className="text-body text-text-secondary mb-xs">
        No education added yet
      </p>
      <p className="text-body-small text-text-tertiary mb-lg">
        Add your educational background and academic achievements
      </p>
      <button onClick={onAdd} className="btn-secondary">
        Add Your First Education
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function EducationTab() {
  // State
  const [educations, setEducations] = useState<Education[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<EducationFormData>(emptyEducation)

  // Load educations from API
  const loadEducations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await profileApi.getEducation()
      setEducations(response.education || [])
    } catch (err) {
      console.error('Failed to load educations:', err)
      setError('Failed to load education. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEducations()
  }, [loadEducations])

  const handleAdd = () => {
    setEditingId(null)
    setFormData(emptyEducation)
    setIsFormOpen(true)
  }

  const handleEdit = (education: Education) => {
    setEditingId(education.id)
    // Convert Education to EducationFormData (remove id)
    const { id, ...formData } = education
    setFormData(formData)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(emptyEducation)
  }

  const handleSave = async (data: EducationFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingId) {
        // Update existing
        await profileApi.updateEducation(editingId, data)
      } else {
        // Create new
        await profileApi.createEducation(data)
      }

      // Reload list
      await loadEducations()
      handleCancel()
    } catch (err) {
      console.error('Failed to save education:', err)
      setError('Failed to save education. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education?')) {
      return
    }

    try {
      setError(null)
      await profileApi.deleteEducation(id)
      setEducations((prev) => prev.filter((edu) => edu.id !== id))
    } catch (err) {
      console.error('Failed to delete education:', err)
      setError('Failed to delete education. Please try again.')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-32 bg-bg-tertiary rounded mt-xl" />
          <div className="h-32 bg-bg-tertiary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-xl">
        <div>
          <h2 className="text-section-title text-text-primary">Education</h2>
          <p className="text-body-small text-text-secondary mt-xs">
            Add your educational background and academic achievements
          </p>
        </div>
        {!isFormOpen && educations.length > 0 && (
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            Add Education
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-lg p-md bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <p className="text-body-small text-accent-red">{error}</p>
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="mb-xl">
          <EducationForm
            initialData={formData}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={!!editingId}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Education List or Empty State */}
      {educations.length > 0 ? (
        <div className="space-y-md">
          {educations.map((education) => (
            <EducationCard
              key={education.id}
              education={education}
              onEdit={() => handleEdit(education)}
              onDelete={() => handleDelete(education.id)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : !isFormOpen ? (
        <EmptyState onAdd={handleAdd} />
      ) : null}

      {/* Tip */}
      {!isFormOpen && (
        <Tip>
          List your most recent education first. Include relevant coursework,
          honors, and extracurricular activities that demonstrate skills
          relevant to your target roles.
        </Tip>
      )}
    </div>
  )
}