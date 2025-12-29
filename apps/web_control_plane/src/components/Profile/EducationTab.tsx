import { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  MapPinIcon,
  CalendarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'

// ============================================================================
// Types
// ============================================================================

interface Education {
  id: string
  school_name: string
  degree: string
  field_of_study: string
  location: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  gpa: string
  honors: string
  relevant_coursework: string
  activities: string
}

// ============================================================================
// Constants
// ============================================================================

const DEGREES = [
  { value: 'high-school', label: 'High School Diploma' },
  { value: 'associate', label: "Associate's Degree" },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'certificate', label: 'Certificate / Bootcamp' },
  { value: 'other', label: 'Other' },
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

const YEARS = Array.from({ length: 60 }, (_, i) => {
  const year = new Date().getFullYear() + 5 - i // Future years for expected graduation
  return { value: year.toString(), label: year.toString() }
})

// ============================================================================
// Empty Education Template
// ============================================================================

const emptyEducation: Omit<Education, 'id'> = {
  school_name: '',
  degree: 'bachelor',
  field_of_study: '',
  location: '',
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  is_current: false,
  gpa: '',
  honors: '',
  relevant_coursework: '',
  activities: '',
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
}

function EducationCard({ education, onEdit, onDelete }: EducationCardProps) {
  const getDegreeLabel = (value: string) => {
    return DEGREES.find((d) => d.value === value)?.label || value
  }

  const getMonthLabel = (value: string) => {
    return MONTHS.find((m) => m.value === value)?.label?.slice(0, 3) || value
  }

  const formatDateRange = () => {
    const start = education.start_year
      ? `${getMonthLabel(education.start_month)} ${education.start_year}`
      : ''
    if (education.is_current) {
      return start ? `${start} - Present` : 'Present'
    }
    const end = education.end_year
      ? `${getMonthLabel(education.end_month)} ${education.end_year}`
      : ''
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
              {getDegreeLabel(education.degree)}
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
            {education.relevant_coursework && (
              <p className="text-body-small text-text-tertiary mt-sm line-clamp-2">
                Coursework: {education.relevant_coursework}
              </p>
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
// Education Form Component
// ============================================================================

interface EducationFormProps {
  initialData: Omit<Education, 'id'>
  onSave: (data: Omit<Education, 'id'>) => void
  onCancel: () => void
  isEditing: boolean
}

function EducationForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
}: EducationFormProps) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (field: string, value: string | boolean) => {
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
              Degree <span className="text-accent-red">*</span>
            </label>
            <select
              value={formData.degree}
              onChange={(e) => updateField('degree', e.target.value)}
              className="input w-full"
              required
            >
              {DEGREES.map((degree) => (
                <option key={degree.value} value={degree.value}>
                  {degree.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Field of Study <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.field_of_study}
              onChange={(e) => updateField('field_of_study', e.target.value)}
              placeholder="Computer Science"
              className="input w-full"
              required
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
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
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
                value={formData.start_month}
                onChange={(e) => updateField('start_month', e.target.value)}
                className="input flex-1"
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
                value={formData.end_month}
                onChange={(e) => updateField('end_month', e.target.value)}
                className="input flex-1"
                disabled={formData.is_current}
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
                  updateField('end_month', '')
                  updateField('end_year', '')
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
              value={formData.gpa}
              onChange={(e) => updateField('gpa', e.target.value)}
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
              value={formData.honors}
              onChange={(e) => updateField('honors', e.target.value)}
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
            value={formData.relevant_coursework}
            onChange={(e) => updateField('relevant_coursework', e.target.value)}
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
            value={formData.activities}
            onChange={(e) => updateField('activities', e.target.value)}
            placeholder="Computer Science Club, Hackathon Team, Student Government..."
            rows={3}
            className="input w-full resize-y min-h-[80px]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {isEditing ? 'Save Changes' : 'Add Education'}
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
  const [educations, setEducations] = useState<Education[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] =
    useState<Omit<Education, 'id'>>(emptyEducation)

  const handleAdd = () => {
    setEditingId(null)
    setFormData(emptyEducation)
    setIsFormOpen(true)
  }

  const handleEdit = (education: Education) => {
    setEditingId(education.id)
    setFormData(education)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData(emptyEducation)
  }

  const handleSave = (data: Omit<Education, 'id'>) => {
    if (editingId) {
      // Update existing
      setEducations((prev) =>
        prev.map((edu) =>
          edu.id === editingId ? { ...data, id: editingId } : edu
        )
      )
    } else {
      // Add new
      const newEducation: Education = {
        ...data,
        id: Date.now().toString(),
      }
      setEducations((prev) => [newEducation, ...prev])
    }
    handleCancel()
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this education?')) {
      setEducations((prev) => prev.filter((edu) => edu.id !== id))
    }
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

      {/* Form */}
      {isFormOpen && (
        <div className="mb-xl">
          <EducationForm
            initialData={formData}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={!!editingId}
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
