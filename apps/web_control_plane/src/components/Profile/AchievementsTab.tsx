import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  RocketLaunchIcon,
  DocumentCheckIcon,
  TrophyIcon,
  NewspaperIcon,
  HeartIcon,
  LinkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import profileApi from '../../services/profileApi'
import type {
  Project,
  ProjectFormData,
  Certification,
  CertificationFormData,
  Award,
  AwardFormData,
  Publication,
  PublicationFormData,
  Volunteering,
  VolunteeringFormData,
} from '../../types/profile'
import { MONTHS, VOLUNTEERING_CAUSES } from '../../types/profile'

// ============================================================================
// Constants
// ============================================================================

const MONTH_OPTIONS = MONTHS.map((m) => ({ value: m, label: m }))

const YEARS = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() + 5 - i
  return { value: year, label: year.toString() }
})

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateRange = (
  startMonth: string | null,
  startYear: number | null,
  endMonth: string | null,
  endYear: number | null,
  isCurrent: boolean
) => {
  const startM = startMonth?.slice(0, 3) || ''
  const start = startYear ? `${startM} ${startYear}` : ''
  if (isCurrent) return start ? `${start} - Present` : 'Present'
  const endM = endMonth?.slice(0, 3) || ''
  const end = endYear ? `${endM} ${endYear}` : ''
  if (start && end) return `${start} - ${end}`
  return start || end
}

const formatDate = (month: string | null, year: number | null) => {
  if (!year) return ''
  const m = month?.slice(0, 3) || ''
  return m ? `${m} ${year}` : year.toString()
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
    <div className={`${first ? '' : 'mt-xl pt-xl border-t border-border-light'}`}>
      <h3 className="text-label text-text-tertiary uppercase tracking-wider mb-lg">
        {children}
      </h3>
    </div>
  )
}

// ============================================================================
// Tip Component
// ============================================================================

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-xl flex items-start gap-sm p-md bg-accent-blue/5 rounded-xl">
      <LightBulbIcon className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
      <p className="text-body-small text-text-secondary">{children}</p>
    </div>
  )
}

// ============================================================================
// Tag Input Component (for technologies)
// ============================================================================

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

function TagInput({ value, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
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
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] border-0 p-0 focus:ring-0 text-body-small bg-transparent"
      />
    </div>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode
  message: string
}

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-lg">
      <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mx-auto mb-sm">
        {icon}
      </div>
      <p className="text-body-small text-text-tertiary">{message}</p>
    </div>
  )
}

// ============================================================================
// Empty Form Data Templates
// ============================================================================

const emptyProject: ProjectFormData = {
  project_name: '',
  role: null,
  start_month: null,
  start_year: null,
  end_month: null,
  end_year: null,
  is_ongoing: false,
  project_url: null,
  repo_url: null,
  description: null,
  technologies: null,
}

const emptyCertification: CertificationFormData = {
  name: '',
  issuing_organization: null,
  issue_month: null,
  issue_year: null,
  expiration_month: null,
  expiration_year: null,
  no_expiration: true,
  credential_id: null,
  credential_url: null,
}

const emptyAward: AwardFormData = {
  title: '',
  issuer: null,
  received_month: null,
  received_year: null,
  description: null,
}

const emptyPublication: PublicationFormData = {
  title: '',
  publisher: null,
  publication_month: null,
  publication_year: null,
  url: null,
  authors: null,
  description: null,
}

const emptyVolunteering: VolunteeringFormData = {
  organization: '',
  role: null,
  cause: null,
  start_month: null,
  start_year: null,
  end_month: null,
  end_year: null,
  is_current: false,
  description: null,
}

// ============================================================================
// PROJECT COMPONENTS
// ============================================================================

function ProjectCard({
  project,
  onEdit,
  onDelete,
  isDeleting,
}: {
  project: Project
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <RocketLaunchIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">
              {project.project_name}
            </h4>
            {project.role && (
              <p className="text-body-small text-text-secondary mt-0.5">
                {project.role}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {(project.start_year || project.end_year) && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDateRange(
                    project.start_month,
                    project.start_year,
                    project.end_month,
                    project.end_year,
                    project.is_ongoing
                  )}
                </span>
              )}
              {project.project_url && (
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent-blue hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Project
                </a>
              )}
            </div>
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-xs mt-sm">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-sm py-xs bg-bg-tertiary text-text-secondary rounded-full text-label"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: {
  initialData: ProjectFormData
  onSave: (data: ProjectFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (
    field: keyof ProjectFormData,
    value: string | string[] | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="bg-bg-secondary rounded-xl p-lg"
    >
      <h4 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Project' : 'Add Project'}
      </h4>
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Project Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => updateField('project_name', e.target.value)}
              placeholder="E-commerce Platform"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Your Role <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => updateField('role', e.target.value || null)}
              placeholder="Lead Developer"
              className="input w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.start_year || ''}
                onChange={(e) =>
                  updateField('start_year', e.target.value ? parseInt(e.target.value) : null)
                }
                className="input w-28"
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              End Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.end_month || ''}
                onChange={(e) => updateField('end_month', e.target.value || null)}
                className="input flex-1"
                disabled={formData.is_ongoing}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.end_year || ''}
                onChange={(e) =>
                  updateField('end_year', e.target.value ? parseInt(e.target.value) : null)
                }
                className="input w-28"
                disabled={formData.is_ongoing}
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_ongoing}
            onChange={(e) => {
              updateField('is_ongoing', e.target.checked)
              if (e.target.checked) {
                updateField('end_month', null)
                updateField('end_year', null)
              }
            }}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">
            This project is ongoing
          </span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Project URL <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.project_url || ''}
              onChange={(e) => updateField('project_url', e.target.value || null)}
              placeholder="https://myproject.com"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Repository URL <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.repo_url || ''}
              onChange={(e) => updateField('repo_url', e.target.value || null)}
              placeholder="https://github.com/user/repo"
              className="input w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Description <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value || null)}
            placeholder="Describe the project, your contributions, and impact..."
            rows={3}
            className="input w-full resize-y"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Technologies Used <span className="text-text-tertiary">(optional)</span>
          </label>
          <TagInput
            value={formData.technologies || []}
            onChange={(v) => updateField('technologies', v.length > 0 ? v : null)}
            placeholder="Add technology and press Enter..."
          />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Project'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// CERTIFICATION COMPONENTS
// ============================================================================

function CertificationCard({
  cert,
  onEdit,
  onDelete,
  isDeleting,
}: {
  cert: Certification
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <DocumentCheckIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{cert.name}</h4>
            {cert.issuing_organization && (
              <p className="text-body-small text-text-secondary mt-0.5">
                {cert.issuing_organization}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {cert.issue_year && (
                <span>Issued {formatDate(cert.issue_month, cert.issue_year)}</span>
              )}
              {cert.no_expiration ? (
                <span className="text-accent-green">No Expiration</span>
              ) : (
                cert.expiration_year && (
                  <span>
                    Expires {formatDate(cert.expiration_month, cert.expiration_year)}
                  </span>
                )
              )}
              {cert.credential_url && (
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent-blue hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Verify
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CertificationForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: {
  initialData: CertificationFormData
  onSave: (data: CertificationFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (
    field: keyof CertificationFormData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="bg-bg-secondary rounded-xl p-lg"
    >
      <h4 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Certification' : 'Add Certification'}
      </h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Certification Name <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="AWS Solutions Architect"
            className="input w-full"
            required
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Issuing Organization
          </label>
          <input
            type="text"
            value={formData.issuing_organization || ''}
            onChange={(e) => updateField('issuing_organization', e.target.value || null)}
            placeholder="Amazon Web Services"
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Issue Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.issue_month || ''}
                onChange={(e) => updateField('issue_month', e.target.value || null)}
                className="input flex-1"
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.issue_year || ''}
                onChange={(e) =>
                  updateField('issue_year', e.target.value ? parseInt(e.target.value) : null)
                }
                className="input w-28"
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Expiration Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.expiration_month || ''}
                onChange={(e) => updateField('expiration_month', e.target.value || null)}
                className="input flex-1"
                disabled={formData.no_expiration}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.expiration_year || ''}
                onChange={(e) =>
                  updateField(
                    'expiration_year',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="input w-28"
                disabled={formData.no_expiration}
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.no_expiration}
            onChange={(e) => {
              updateField('no_expiration', e.target.checked)
              if (e.target.checked) {
                updateField('expiration_month', null)
                updateField('expiration_year', null)
              }
            }}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">
            This credential does not expire
          </span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Credential ID <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.credential_id || ''}
              onChange={(e) => updateField('credential_id', e.target.value || null)}
              placeholder="ABC123XYZ"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Credential URL <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.credential_url || ''}
              onChange={(e) => updateField('credential_url', e.target.value || null)}
              placeholder="https://verify.example.com/..."
              className="input w-full"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Certification'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// AWARD COMPONENTS
// ============================================================================

function AwardCard({
  award,
  onEdit,
  onDelete,
  isDeleting,
}: {
  award: Award
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <TrophyIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{award.title}</h4>
            {award.issuer && (
              <p className="text-body-small text-text-secondary mt-0.5">
                {award.issuer}
              </p>
            )}
            {award.received_year && (
              <p className="text-label text-text-tertiary mt-sm">
                {formatDate(award.received_month, award.received_year)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AwardForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: {
  initialData: AwardFormData
  onSave: (data: AwardFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (
    field: keyof AwardFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="bg-bg-secondary rounded-xl p-lg"
    >
      <h4 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Award' : 'Add Award'}
      </h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Award Name <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Employee of the Year"
            className="input w-full"
            required
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Issuing Organization <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.issuer || ''}
            onChange={(e) => updateField('issuer', e.target.value || null)}
            placeholder="Google"
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Date Received <span className="text-text-tertiary">(optional)</span>
          </label>
          <div className="flex gap-sm max-w-xs">
            <select
              value={formData.received_month || ''}
              onChange={(e) => updateField('received_month', e.target.value || null)}
              className="input flex-1"
            >
              <option value="">Month</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={formData.received_year || ''}
              onChange={(e) =>
                updateField('received_year', e.target.value ? parseInt(e.target.value) : null)
              }
              className="input w-28"
            >
              <option value="">Year</option>
              {YEARS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Description <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value || null)}
            placeholder="Describe the award and why you received it..."
            rows={3}
            className="input w-full resize-y"
          />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Award'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// PUBLICATION COMPONENTS
// ============================================================================

function PublicationCard({
  pub,
  onEdit,
  onDelete,
  isDeleting,
}: {
  pub: Publication
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <NewspaperIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{pub.title}</h4>
            {pub.publisher && (
              <p className="text-body-small text-text-secondary mt-0.5">
                {pub.publisher}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {pub.publication_year && (
                <span>{formatDate(pub.publication_month, pub.publication_year)}</span>
              )}
              {pub.url && (
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent-blue hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  View
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PublicationForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: {
  initialData: PublicationFormData
  onSave: (data: PublicationFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (
    field: keyof PublicationFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="bg-bg-secondary rounded-xl p-lg"
    >
      <h4 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Publication' : 'Add Publication'}
      </h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Title <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Machine Learning in Healthcare"
            className="input w-full"
            required
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Publisher / Journal <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.publisher || ''}
            onChange={(e) => updateField('publisher', e.target.value || null)}
            placeholder="Nature Medicine"
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Publication Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.publication_month || ''}
                onChange={(e) => updateField('publication_month', e.target.value || null)}
                className="input flex-1"
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.publication_year || ''}
                onChange={(e) =>
                  updateField(
                    'publication_year',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="input w-28"
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              URL <span className="text-text-tertiary">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => updateField('url', e.target.value || null)}
              placeholder="https://doi.org/..."
              className="input w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Authors <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.authors || ''}
            onChange={(e) => updateField('authors', e.target.value || null)}
            placeholder="John Doe, Jane Smith, et al."
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Description / Abstract <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value || null)}
            placeholder="Brief description or abstract..."
            rows={3}
            className="input w-full resize-y"
          />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Publication'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// VOLUNTEERING COMPONENTS
// ============================================================================

function VolunteeringCard({
  vol,
  onEdit,
  onDelete,
  isDeleting,
}: {
  vol: Volunteering
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <HeartIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{vol.role}</h4>
            <p className="text-body-small text-text-secondary mt-0.5">
              {vol.organization}
            </p>
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {vol.cause && (
                <span className="flex items-center gap-1">
                  <BuildingOfficeIcon className="w-3.5 h-3.5" />
                  {vol.cause}
                </span>
              )}
              {(vol.start_year || vol.end_year) && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDateRange(
                    vol.start_month,
                    vol.start_year,
                    vol.end_month,
                    vol.end_year,
                    vol.is_current
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button
            onClick={onEdit}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function VolunteeringForm({
  initialData,
  onSave,
  onCancel,
  isEditing,
  isSaving,
}: {
  initialData: VolunteeringFormData
  onSave: (data: VolunteeringFormData) => void
  onCancel: () => void
  isEditing: boolean
  isSaving?: boolean
}) {
  const [formData, setFormData] = useState(initialData)

  const updateField = (
    field: keyof VolunteeringFormData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="bg-bg-secondary rounded-xl p-lg"
    >
      <h4 className="text-card-title text-text-primary mb-lg">
        {isEditing ? 'Edit Volunteering' : 'Add Volunteering Experience'}
      </h4>
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Organization <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => updateField('organization', e.target.value)}
              placeholder="Red Cross"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Your Role
            </label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => updateField('role', e.target.value || null)}
              placeholder="Volunteer Coordinator"
              className="input w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Cause <span className="text-text-tertiary">(optional)</span>
          </label>
          <select
            value={formData.cause || ''}
            onChange={(e) => updateField('cause', e.target.value || null)}
            className="input w-full"
          >
            <option value="">Select a cause...</option>
            {VOLUNTEERING_CAUSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.start_year || ''}
                onChange={(e) =>
                  updateField('start_year', e.target.value ? parseInt(e.target.value) : null)
                }
                className="input w-28"
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              End Date <span className="text-text-tertiary">(optional)</span>
            </label>
            <div className="flex gap-sm">
              <select
                value={formData.end_month || ''}
                onChange={(e) => updateField('end_month', e.target.value || null)}
                className="input flex-1"
                disabled={formData.is_current}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.end_year || ''}
                onChange={(e) =>
                  updateField('end_year', e.target.value ? parseInt(e.target.value) : null)
                }
                className="input w-28"
                disabled={formData.is_current}
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
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
            I am currently volunteering here
          </span>
        </label>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Description <span className="text-text-tertiary">(optional)</span>
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value || null)}
            placeholder="Describe your volunteering activities and impact..."
            rows={3}
            className="input w-full resize-y"
          />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Volunteering'}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AchievementsTab() {
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data state
  const [projects, setProjects] = useState<Project[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [publications, setPublications] = useState<Publication[]>([])
  const [volunteerings, setVolunteerings] = useState<Volunteering[]>([])

  // Form state - Projects
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>(emptyProject)

  // Form state - Certifications
  const [certFormOpen, setCertFormOpen] = useState(false)
  const [editingCertId, setEditingCertId] = useState<number | null>(null)
  const [certFormData, setCertFormData] = useState<CertificationFormData>(emptyCertification)

  // Form state - Awards
  const [awardFormOpen, setAwardFormOpen] = useState(false)
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null)
  const [awardFormData, setAwardFormData] = useState<AwardFormData>(emptyAward)

  // Form state - Publications
  const [pubFormOpen, setPubFormOpen] = useState(false)
  const [editingPubId, setEditingPubId] = useState<number | null>(null)
  const [pubFormData, setPubFormData] = useState<PublicationFormData>(emptyPublication)

  // Form state - Volunteering
  const [volFormOpen, setVolFormOpen] = useState(false)
  const [editingVolId, setEditingVolId] = useState<number | null>(null)
  const [volFormData, setVolFormData] = useState<VolunteeringFormData>(emptyVolunteering)

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [projectsRes, certsRes, awardsRes, pubsRes, volsRes] = await Promise.all([
        profileApi.getProjects(),
        profileApi.getCertifications(),
        profileApi.getAwards(),
        profileApi.getPublications(),
        profileApi.getVolunteering(),
      ])

      setProjects(projectsRes.projects || [])
      setCertifications(certsRes.certifications || [])
      setAwards(awardsRes.awards || [])
      setPublications(pubsRes.publications || [])
      setVolunteerings(volsRes.volunteering || [])
    } catch (err) {
      console.error('Failed to load achievements:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ============================================================================
  // PROJECT HANDLERS
  // ============================================================================

  const handleAddProject = () => {
    setEditingProjectId(null)
    setProjectFormData(emptyProject)
    setProjectFormOpen(true)
  }

  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id)
    const { id, ...formData } = p
    setProjectFormData(formData)
    setProjectFormOpen(true)
  }

  const handleCancelProject = () => {
    setProjectFormOpen(false)
    setEditingProjectId(null)
    setProjectFormData(emptyProject)
  }

  const handleSaveProject = async (data: ProjectFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingProjectId) {
        await profileApi.updateProject(editingProjectId, data)
      } else {
        await profileApi.createProject(data)
      }

      await loadData()
      handleCancelProject()
    } catch (err) {
      console.error('Failed to save project:', err)
      setError('Failed to save project. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      setError(null)
      await profileApi.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Failed to delete project. Please try again.')
    }
  }

  // ============================================================================
  // CERTIFICATION HANDLERS
  // ============================================================================

  const handleAddCert = () => {
    setEditingCertId(null)
    setCertFormData(emptyCertification)
    setCertFormOpen(true)
  }

  const handleEditCert = (c: Certification) => {
    setEditingCertId(c.id)
    const { id, ...formData } = c
    setCertFormData(formData)
    setCertFormOpen(true)
  }

  const handleCancelCert = () => {
    setCertFormOpen(false)
    setEditingCertId(null)
    setCertFormData(emptyCertification)
  }

  const handleSaveCert = async (data: CertificationFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingCertId) {
        await profileApi.updateCertification(editingCertId, data)
      } else {
        await profileApi.createCertification(data)
      }

      await loadData()
      handleCancelCert()
    } catch (err) {
      console.error('Failed to save certification:', err)
      setError('Failed to save certification. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCert = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      setError(null)
      await profileApi.deleteCertification(id)
      setCertifications((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete certification:', err)
      setError('Failed to delete certification. Please try again.')
    }
  }

  // ============================================================================
  // AWARD HANDLERS
  // ============================================================================

  const handleAddAward = () => {
    setEditingAwardId(null)
    setAwardFormData(emptyAward)
    setAwardFormOpen(true)
  }

  const handleEditAward = (a: Award) => {
    setEditingAwardId(a.id)
    const { id, ...formData } = a
    setAwardFormData(formData)
    setAwardFormOpen(true)
  }

  const handleCancelAward = () => {
    setAwardFormOpen(false)
    setEditingAwardId(null)
    setAwardFormData(emptyAward)
  }

  const handleSaveAward = async (data: AwardFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingAwardId) {
        await profileApi.updateAward(editingAwardId, data)
      } else {
        await profileApi.createAward(data)
      }

      await loadData()
      handleCancelAward()
    } catch (err) {
      console.error('Failed to save award:', err)
      setError('Failed to save award. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAward = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      setError(null)
      await profileApi.deleteAward(id)
      setAwards((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete award:', err)
      setError('Failed to delete award. Please try again.')
    }
  }

  // ============================================================================
  // PUBLICATION HANDLERS
  // ============================================================================

  const handleAddPub = () => {
    setEditingPubId(null)
    setPubFormData(emptyPublication)
    setPubFormOpen(true)
  }

  const handleEditPub = (p: Publication) => {
    setEditingPubId(p.id)
    const { id, ...formData } = p
    setPubFormData(formData)
    setPubFormOpen(true)
  }

  const handleCancelPub = () => {
    setPubFormOpen(false)
    setEditingPubId(null)
    setPubFormData(emptyPublication)
  }

  const handleSavePub = async (data: PublicationFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingPubId) {
        await profileApi.updatePublication(editingPubId, data)
      } else {
        await profileApi.createPublication(data)
      }

      await loadData()
      handleCancelPub()
    } catch (err) {
      console.error('Failed to save publication:', err)
      setError('Failed to save publication. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePub = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      setError(null)
      await profileApi.deletePublication(id)
      setPublications((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete publication:', err)
      setError('Failed to delete publication. Please try again.')
    }
  }

  // ============================================================================
  // VOLUNTEERING HANDLERS
  // ============================================================================

  const handleAddVol = () => {
    setEditingVolId(null)
    setVolFormData(emptyVolunteering)
    setVolFormOpen(true)
  }

  const handleEditVol = (v: Volunteering) => {
    setEditingVolId(v.id)
    const { id, ...formData } = v
    setVolFormData(formData)
    setVolFormOpen(true)
  }

  const handleCancelVol = () => {
    setVolFormOpen(false)
    setEditingVolId(null)
    setVolFormData(emptyVolunteering)
  }

  const handleSaveVol = async (data: VolunteeringFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      if (editingVolId) {
        await profileApi.updateVolunteering(editingVolId, data)
      } else {
        await profileApi.createVolunteering(data)
      }

      await loadData()
      handleCancelVol()
    } catch (err) {
      console.error('Failed to save volunteering:', err)
      setError('Failed to save volunteering. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteVol = async (id: number, role: string) => {
    if (!confirm(`Are you sure you want to delete "${role}"?`)) return

    try {
      setError(null)
      await profileApi.deleteVolunteering(id)
      setVolunteerings((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      console.error('Failed to delete volunteering:', err)
      setError('Failed to delete volunteering. Please try again.')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="card p-xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-24 bg-bg-tertiary rounded mt-xl" />
          <div className="h-24 bg-bg-tertiary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">Achievements</h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Showcase your projects, certifications, awards, publications, and
          volunteering experiences
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-lg p-md bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <p className="text-body-small text-accent-red">{error}</p>
        </div>
      )}

      {/* PROJECTS Section */}
      <SectionTitle first>Projects</SectionTitle>
      {projectFormOpen && (
        <div className="mb-md">
          <ProjectForm
            initialData={projectFormData}
            onSave={handleSaveProject}
            onCancel={handleCancelProject}
            isEditing={!!editingProjectId}
            isSaving={isSaving}
          />
        </div>
      )}
      {projects.length > 0 ? (
        <div className="space-y-sm mb-md">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => handleEditProject(p)}
              onDelete={() => handleDeleteProject(p.id, p.project_name)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : (
        !projectFormOpen && (
          <EmptyState
            icon={<RocketLaunchIcon className="w-6 h-6 text-text-tertiary" />}
            message="No projects added yet"
          />
        )
      )}
      {!projectFormOpen && (
        <button onClick={handleAddProject} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Project
        </button>
      )}

      {/* CERTIFICATIONS Section */}
      <SectionTitle>Certifications</SectionTitle>
      {certFormOpen && (
        <div className="mb-md">
          <CertificationForm
            initialData={certFormData}
            onSave={handleSaveCert}
            onCancel={handleCancelCert}
            isEditing={!!editingCertId}
            isSaving={isSaving}
          />
        </div>
      )}
      {certifications.length > 0 ? (
        <div className="space-y-sm mb-md">
          {certifications.map((c) => (
            <CertificationCard
              key={c.id}
              cert={c}
              onEdit={() => handleEditCert(c)}
              onDelete={() => handleDeleteCert(c.id, c.name)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : (
        !certFormOpen && (
          <EmptyState
            icon={<DocumentCheckIcon className="w-6 h-6 text-text-tertiary" />}
            message="No certifications added yet"
          />
        )
      )}
      {!certFormOpen && (
        <button onClick={handleAddCert} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Certification
        </button>
      )}

      {/* AWARDS Section */}
      <SectionTitle>Awards & Honors</SectionTitle>
      {awardFormOpen && (
        <div className="mb-md">
          <AwardForm
            initialData={awardFormData}
            onSave={handleSaveAward}
            onCancel={handleCancelAward}
            isEditing={!!editingAwardId}
            isSaving={isSaving}
          />
        </div>
      )}
      {awards.length > 0 ? (
        <div className="space-y-sm mb-md">
          {awards.map((a) => (
            <AwardCard
              key={a.id}
              award={a}
              onEdit={() => handleEditAward(a)}
              onDelete={() => handleDeleteAward(a.id, a.title)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : (
        !awardFormOpen && (
          <EmptyState
            icon={<TrophyIcon className="w-6 h-6 text-text-tertiary" />}
            message="No awards added yet"
          />
        )
      )}
      {!awardFormOpen && (
        <button onClick={handleAddAward} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Award
        </button>
      )}

      {/* PUBLICATIONS Section */}
      <SectionTitle>Publications</SectionTitle>
      {pubFormOpen && (
        <div className="mb-md">
          <PublicationForm
            initialData={pubFormData}
            onSave={handleSavePub}
            onCancel={handleCancelPub}
            isEditing={!!editingPubId}
            isSaving={isSaving}
          />
        </div>
      )}
      {publications.length > 0 ? (
        <div className="space-y-sm mb-md">
          {publications.map((p) => (
            <PublicationCard
              key={p.id}
              pub={p}
              onEdit={() => handleEditPub(p)}
              onDelete={() => handleDeletePub(p.id, p.title)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : (
        !pubFormOpen && (
          <EmptyState
            icon={<NewspaperIcon className="w-6 h-6 text-text-tertiary" />}
            message="No publications added yet"
          />
        )
      )}
      {!pubFormOpen && (
        <button onClick={handleAddPub} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Publication
        </button>
      )}

      {/* VOLUNTEERING Section */}
      <SectionTitle>Volunteering</SectionTitle>
      {volFormOpen && (
        <div className="mb-md">
          <VolunteeringForm
            initialData={volFormData}
            onSave={handleSaveVol}
            onCancel={handleCancelVol}
            isEditing={!!editingVolId}
            isSaving={isSaving}
          />
        </div>
      )}
      {volunteerings.length > 0 ? (
        <div className="space-y-sm mb-md">
          {volunteerings.map((v) => (
            <VolunteeringCard
              key={v.id}
              vol={v}
              onEdit={() => handleEditVol(v)}
              onDelete={() => handleDeleteVol(v.id, v.role || v.organization)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      ) : (
        !volFormOpen && (
          <EmptyState
            icon={<HeartIcon className="w-6 h-6 text-text-tertiary" />}
            message="No volunteering experiences added yet"
          />
        )
      )}
      {!volFormOpen && (
        <button onClick={handleAddVol} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Volunteering Experience
        </button>
      )}

      {/* Tip */}
      <Tip>
        Include achievements most relevant to your target roles. Projects
        demonstrate hands-on experience, certifications validate your expertise,
        and volunteering shows character and community involvement.
      </Tip>
    </div>
  )
}