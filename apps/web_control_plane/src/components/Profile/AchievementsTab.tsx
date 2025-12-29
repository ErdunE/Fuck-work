import { useState } from 'react'
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

// ============================================================================
// Types
// ============================================================================

interface Project {
  id: string
  name: string
  role: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_ongoing: boolean
  project_url: string
  repository_url: string
  description: string
  technologies: string[]
}

interface Certification {
  id: string
  name: string
  issuing_organization: string
  issue_month: string
  issue_year: string
  expiration_month: string
  expiration_year: string
  no_expiration: boolean
  credential_id: string
  credential_url: string
}

interface Award {
  id: string
  name: string
  issuing_organization: string
  month: string
  year: string
  description: string
}

interface Publication {
  id: string
  title: string
  publisher: string
  month: string
  year: string
  url: string
  authors: string
  description: string
}

interface Volunteering {
  id: string
  organization: string
  role: string
  cause: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  description: string
}

// ============================================================================
// Constants
// ============================================================================

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
  const year = new Date().getFullYear() + 5 - i
  return { value: year.toString(), label: year.toString() }
})

const CAUSES = [
  'Animal Welfare',
  'Arts and Culture',
  'Children',
  'Civil Rights and Social Action',
  'Disaster and Humanitarian Relief',
  'Economic Empowerment',
  'Education',
  'Environment',
  'Health',
  'Human Rights',
  'Poverty Alleviation',
  'Science and Technology',
  'Social Services',
  'Other',
]

// ============================================================================
// Helper Functions
// ============================================================================

const getMonthLabel = (value: string) => {
  return MONTHS.find((m) => m.value === value)?.label?.slice(0, 3) || value
}

const formatDateRange = (
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  isCurrent: boolean
) => {
  const start = startYear ? `${getMonthLabel(startMonth)} ${startYear}` : ''
  if (isCurrent) return start ? `${start} - Present` : 'Present'
  const end = endYear ? `${getMonthLabel(endMonth)} ${endYear}` : ''
  if (start && end) return `${start} - ${end}`
  return start || end
}

const formatDate = (month: string, year: string) => {
  if (!year) return ''
  return month ? `${getMonthLabel(month)} ${year}` : year
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
// PROJECT SECTION
// ============================================================================

const emptyProject: Omit<Project, 'id'> = {
  name: '',
  role: '',
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  is_ongoing: false,
  project_url: '',
  repository_url: '',
  description: '',
  technologies: [],
}

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <RocketLaunchIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{project.name}</h4>
            {project.role && (
              <p className="text-body-small text-text-secondary mt-0.5">{project.role}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {(project.start_year || project.end_year) && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDateRange(project.start_month, project.start_year, project.end_month, project.end_year, project.is_ongoing)}
                </span>
              )}
              {project.project_url && (
                <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent-blue hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Project
                </a>
              )}
            </div>
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-xs mt-sm">
                {project.technologies.map((tech) => (
                  <span key={tech} className="px-sm py-xs bg-bg-tertiary text-text-secondary rounded-full text-label">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectForm({ initialData, onSave, onCancel, isEditing }: { initialData: Omit<Project, 'id'>; onSave: (data: Omit<Project, 'id'>) => void; onCancel: () => void; isEditing: boolean }) {
  const [formData, setFormData] = useState(initialData)
  const updateField = (field: string, value: string | string[] | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="bg-bg-secondary rounded-xl p-lg">
      <h4 className="text-card-title text-text-primary mb-lg">{isEditing ? 'Edit Project' : 'Add Project'}</h4>
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Project Name <span className="text-accent-red">*</span></label>
            <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="E-commerce Platform" className="input w-full" required />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Your Role <span className="text-text-tertiary">(optional)</span></label>
            <input type="text" value={formData.role} onChange={(e) => updateField('role', e.target.value)} placeholder="Lead Developer" className="input w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Start Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.start_month} onChange={(e) => updateField('start_month', e.target.value)} className="input flex-1">
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.start_year} onChange={(e) => updateField('start_year', e.target.value)} className="input w-28">
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">End Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.end_month} onChange={(e) => updateField('end_month', e.target.value)} className="input flex-1" disabled={formData.is_ongoing}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.end_year} onChange={(e) => updateField('end_year', e.target.value)} className="input w-28" disabled={formData.is_ongoing}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input type="checkbox" checked={formData.is_ongoing} onChange={(e) => { updateField('is_ongoing', e.target.checked); if (e.target.checked) { updateField('end_month', ''); updateField('end_year', '') } }} className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue" />
          <span className="text-body-small text-text-primary">This project is ongoing</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Project URL <span className="text-text-tertiary">(optional)</span></label>
            <input type="url" value={formData.project_url} onChange={(e) => updateField('project_url', e.target.value)} placeholder="https://myproject.com" className="input w-full" />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Repository URL <span className="text-text-tertiary">(optional)</span></label>
            <input type="url" value={formData.repository_url} onChange={(e) => updateField('repository_url', e.target.value)} placeholder="https://github.com/user/repo" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Description <span className="text-text-tertiary">(optional)</span></label>
          <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the project, your contributions, and impact..." rows={3} className="input w-full resize-y" />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Technologies Used <span className="text-text-tertiary">(optional)</span></label>
          <TagInput value={formData.technologies} onChange={(v) => updateField('technologies', v)} placeholder="Add technology and press Enter..." />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Project'}</button>
      </div>
    </form>
  )
}

// ============================================================================
// CERTIFICATION SECTION
// ============================================================================

const emptyCertification: Omit<Certification, 'id'> = {
  name: '',
  issuing_organization: '',
  issue_month: '',
  issue_year: '',
  expiration_month: '',
  expiration_year: '',
  no_expiration: true,
  credential_id: '',
  credential_url: '',
}

function CertificationCard({ cert, onEdit, onDelete }: { cert: Certification; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <DocumentCheckIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{cert.name}</h4>
            <p className="text-body-small text-text-secondary mt-0.5">{cert.issuing_organization}</p>
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {cert.issue_year && (
                <span>Issued {formatDate(cert.issue_month, cert.issue_year)}</span>
              )}
              {cert.no_expiration ? (
                <span className="text-accent-green">No Expiration</span>
              ) : cert.expiration_year && (
                <span>Expires {formatDate(cert.expiration_month, cert.expiration_year)}</span>
              )}
              {cert.credential_url && (
                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent-blue hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Verify
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CertificationForm({ initialData, onSave, onCancel, isEditing }: { initialData: Omit<Certification, 'id'>; onSave: (data: Omit<Certification, 'id'>) => void; onCancel: () => void; isEditing: boolean }) {
  const [formData, setFormData] = useState(initialData)
  const updateField = (field: string, value: string | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="bg-bg-secondary rounded-xl p-lg">
      <h4 className="text-card-title text-text-primary mb-lg">{isEditing ? 'Edit Certification' : 'Add Certification'}</h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Certification Name <span className="text-accent-red">*</span></label>
          <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="AWS Solutions Architect" className="input w-full" required />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Issuing Organization <span className="text-accent-red">*</span></label>
          <input type="text" value={formData.issuing_organization} onChange={(e) => updateField('issuing_organization', e.target.value)} placeholder="Amazon Web Services" className="input w-full" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Issue Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.issue_month} onChange={(e) => updateField('issue_month', e.target.value)} className="input flex-1">
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.issue_year} onChange={(e) => updateField('issue_year', e.target.value)} className="input w-28">
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Expiration Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.expiration_month} onChange={(e) => updateField('expiration_month', e.target.value)} className="input flex-1" disabled={formData.no_expiration}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.expiration_year} onChange={(e) => updateField('expiration_year', e.target.value)} className="input w-28" disabled={formData.no_expiration}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input type="checkbox" checked={formData.no_expiration} onChange={(e) => { updateField('no_expiration', e.target.checked); if (e.target.checked) { updateField('expiration_month', ''); updateField('expiration_year', '') } }} className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue" />
          <span className="text-body-small text-text-primary">This credential does not expire</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Credential ID <span className="text-text-tertiary">(optional)</span></label>
            <input type="text" value={formData.credential_id} onChange={(e) => updateField('credential_id', e.target.value)} placeholder="ABC123XYZ" className="input w-full" />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Credential URL <span className="text-text-tertiary">(optional)</span></label>
            <input type="url" value={formData.credential_url} onChange={(e) => updateField('credential_url', e.target.value)} placeholder="https://verify.example.com/..." className="input w-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Certification'}</button>
      </div>
    </form>
  )
}

// ============================================================================
// AWARD SECTION
// ============================================================================

const emptyAward: Omit<Award, 'id'> = {
  name: '',
  issuing_organization: '',
  month: '',
  year: '',
  description: '',
}

function AwardCard({ award, onEdit, onDelete }: { award: Award; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <TrophyIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{award.name}</h4>
            {award.issuing_organization && (
              <p className="text-body-small text-text-secondary mt-0.5">{award.issuing_organization}</p>
            )}
            {award.year && (
              <p className="text-label text-text-tertiary mt-sm">{formatDate(award.month, award.year)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AwardForm({ initialData, onSave, onCancel, isEditing }: { initialData: Omit<Award, 'id'>; onSave: (data: Omit<Award, 'id'>) => void; onCancel: () => void; isEditing: boolean }) {
  const [formData, setFormData] = useState(initialData)
  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="bg-bg-secondary rounded-xl p-lg">
      <h4 className="text-card-title text-text-primary mb-lg">{isEditing ? 'Edit Award' : 'Add Award'}</h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Award Name <span className="text-accent-red">*</span></label>
          <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Employee of the Year" className="input w-full" required />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Issuing Organization <span className="text-text-tertiary">(optional)</span></label>
          <input type="text" value={formData.issuing_organization} onChange={(e) => updateField('issuing_organization', e.target.value)} placeholder="Google" className="input w-full" />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Date Received <span className="text-text-tertiary">(optional)</span></label>
          <div className="flex gap-sm max-w-xs">
            <select value={formData.month} onChange={(e) => updateField('month', e.target.value)} className="input flex-1">
              <option value="">Month</option>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={formData.year} onChange={(e) => updateField('year', e.target.value)} className="input w-28">
              <option value="">Year</option>
              {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Description <span className="text-text-tertiary">(optional)</span></label>
          <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the award and why you received it..." rows={3} className="input w-full resize-y" />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Award'}</button>
      </div>
    </form>
  )
}

// ============================================================================
// PUBLICATION SECTION
// ============================================================================

const emptyPublication: Omit<Publication, 'id'> = {
  title: '',
  publisher: '',
  month: '',
  year: '',
  url: '',
  authors: '',
  description: '',
}

function PublicationCard({ pub, onEdit, onDelete }: { pub: Publication; onEdit: () => void; onDelete: () => void }) {
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
              <p className="text-body-small text-text-secondary mt-0.5">{pub.publisher}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-md gap-y-xs mt-sm text-label text-text-tertiary">
              {pub.year && <span>{formatDate(pub.month, pub.year)}</span>}
              {pub.url && (
                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent-blue hover:underline">
                  <LinkIcon className="w-3.5 h-3.5" />
                  View
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PublicationForm({ initialData, onSave, onCancel, isEditing }: { initialData: Omit<Publication, 'id'>; onSave: (data: Omit<Publication, 'id'>) => void; onCancel: () => void; isEditing: boolean }) {
  const [formData, setFormData] = useState(initialData)
  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="bg-bg-secondary rounded-xl p-lg">
      <h4 className="text-card-title text-text-primary mb-lg">{isEditing ? 'Edit Publication' : 'Add Publication'}</h4>
      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Title <span className="text-accent-red">*</span></label>
          <input type="text" value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Machine Learning in Healthcare" className="input w-full" required />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Publisher / Journal <span className="text-text-tertiary">(optional)</span></label>
          <input type="text" value={formData.publisher} onChange={(e) => updateField('publisher', e.target.value)} placeholder="Nature Medicine" className="input w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Publication Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.month} onChange={(e) => updateField('month', e.target.value)} className="input flex-1">
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.year} onChange={(e) => updateField('year', e.target.value)} className="input w-28">
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">URL <span className="text-text-tertiary">(optional)</span></label>
            <input type="url" value={formData.url} onChange={(e) => updateField('url', e.target.value)} placeholder="https://doi.org/..." className="input w-full" />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Authors <span className="text-text-tertiary">(optional)</span></label>
          <input type="text" value={formData.authors} onChange={(e) => updateField('authors', e.target.value)} placeholder="John Doe, Jane Smith, et al." className="input w-full" />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Description / Abstract <span className="text-text-tertiary">(optional)</span></label>
          <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Brief description or abstract..." rows={3} className="input w-full resize-y" />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Publication'}</button>
      </div>
    </form>
  )
}

// ============================================================================
// VOLUNTEERING SECTION
// ============================================================================

const emptyVolunteering: Omit<Volunteering, 'id'> = {
  organization: '',
  role: '',
  cause: '',
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  is_current: false,
  description: '',
}

function VolunteeringCard({ vol, onEdit, onDelete }: { vol: Volunteering; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="border border-border-light rounded-xl p-md hover:border-border-default transition-colors">
      <div className="flex items-start justify-between gap-md">
        <div className="flex gap-md flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <HeartIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body text-text-primary font-medium">{vol.role}</h4>
            <p className="text-body-small text-text-secondary mt-0.5">{vol.organization}</p>
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
                  {formatDateRange(vol.start_month, vol.start_year, vol.end_month, vol.end_year, vol.is_current)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-xs flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function VolunteeringForm({ initialData, onSave, onCancel, isEditing }: { initialData: Omit<Volunteering, 'id'>; onSave: (data: Omit<Volunteering, 'id'>) => void; onCancel: () => void; isEditing: boolean }) {
  const [formData, setFormData] = useState(initialData)
  const updateField = (field: string, value: string | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="bg-bg-secondary rounded-xl p-lg">
      <h4 className="text-card-title text-text-primary mb-lg">{isEditing ? 'Edit Volunteering' : 'Add Volunteering Experience'}</h4>
      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Organization <span className="text-accent-red">*</span></label>
            <input type="text" value={formData.organization} onChange={(e) => updateField('organization', e.target.value)} placeholder="Red Cross" className="input w-full" required />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Your Role <span className="text-accent-red">*</span></label>
            <input type="text" value={formData.role} onChange={(e) => updateField('role', e.target.value)} placeholder="Volunteer Coordinator" className="input w-full" required />
          </div>
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Cause <span className="text-text-tertiary">(optional)</span></label>
          <select value={formData.cause} onChange={(e) => updateField('cause', e.target.value)} className="input w-full">
            <option value="">Select a cause...</option>
            {CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Start Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.start_month} onChange={(e) => updateField('start_month', e.target.value)} className="input flex-1">
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.start_year} onChange={(e) => updateField('start_year', e.target.value)} className="input w-28">
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">End Date <span className="text-text-tertiary">(optional)</span></label>
            <div className="flex gap-sm">
              <select value={formData.end_month} onChange={(e) => updateField('end_month', e.target.value)} className="input flex-1" disabled={formData.is_current}>
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={formData.end_year} onChange={(e) => updateField('end_year', e.target.value)} className="input w-28" disabled={formData.is_current}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-sm cursor-pointer">
          <input type="checkbox" checked={formData.is_current} onChange={(e) => { updateField('is_current', e.target.checked); if (e.target.checked) { updateField('end_month', ''); updateField('end_year', '') } }} className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue" />
          <span className="text-body-small text-text-primary">I am currently volunteering here</span>
        </label>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Description <span className="text-text-tertiary">(optional)</span></label>
          <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe your volunteering activities and impact..." rows={3} className="input w-full resize-y" />
        </div>
      </div>
      <div className="flex justify-end gap-sm mt-lg pt-lg border-t border-border-light">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Volunteering'}</button>
      </div>
    </form>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AchievementsTab() {
  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectFormData, setProjectFormData] = useState<Omit<Project, 'id'>>(emptyProject)

  // Certifications state
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [certFormOpen, setCertFormOpen] = useState(false)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [certFormData, setCertFormData] = useState<Omit<Certification, 'id'>>(emptyCertification)

  // Awards state
  const [awards, setAwards] = useState<Award[]>([])
  const [awardFormOpen, setAwardFormOpen] = useState(false)
  const [editingAwardId, setEditingAwardId] = useState<string | null>(null)
  const [awardFormData, setAwardFormData] = useState<Omit<Award, 'id'>>(emptyAward)

  // Publications state
  const [publications, setPublications] = useState<Publication[]>([])
  const [pubFormOpen, setPubFormOpen] = useState(false)
  const [editingPubId, setEditingPubId] = useState<string | null>(null)
  const [pubFormData, setPubFormData] = useState<Omit<Publication, 'id'>>(emptyPublication)

  // Volunteering state
  const [volunteerings, setVolunteerings] = useState<Volunteering[]>([])
  const [volFormOpen, setVolFormOpen] = useState(false)
  const [editingVolId, setEditingVolId] = useState<string | null>(null)
  const [volFormData, setVolFormData] = useState<Omit<Volunteering, 'id'>>(emptyVolunteering)

  // Project handlers
  const handleAddProject = () => {
    setEditingProjectId(null)
    setProjectFormData(emptyProject)
    setProjectFormOpen(true)
  }
  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id)
    setProjectFormData(p)
    setProjectFormOpen(true)
  }
  const handleCancelProject = () => {
    setProjectFormOpen(false)
    setEditingProjectId(null)
    setProjectFormData(emptyProject)
  }
  const handleSaveProject = (data: Omit<Project, 'id'>) => {
    if (editingProjectId) {
      setProjects((prev) => prev.map((p) => (p.id === editingProjectId ? { ...data, id: editingProjectId } : p)))
    } else {
      setProjects((prev) => [{ ...data, id: Date.now().toString() }, ...prev])
    }
    handleCancelProject()
  }
  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // Certification handlers
  const handleAddCert = () => {
    setEditingCertId(null)
    setCertFormData(emptyCertification)
    setCertFormOpen(true)
  }
  const handleEditCert = (c: Certification) => {
    setEditingCertId(c.id)
    setCertFormData(c)
    setCertFormOpen(true)
  }
  const handleCancelCert = () => {
    setCertFormOpen(false)
    setEditingCertId(null)
    setCertFormData(emptyCertification)
  }
  const handleSaveCert = (data: Omit<Certification, 'id'>) => {
    if (editingCertId) {
      setCertifications((prev) => prev.map((c) => (c.id === editingCertId ? { ...data, id: editingCertId } : c)))
    } else {
      setCertifications((prev) => [{ ...data, id: Date.now().toString() }, ...prev])
    }
    handleCancelCert()
  }
  const handleDeleteCert = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setCertifications((prev) => prev.filter((c) => c.id !== id))
    }
  }

  // Award handlers
  const handleAddAward = () => {
    setEditingAwardId(null)
    setAwardFormData(emptyAward)
    setAwardFormOpen(true)
  }
  const handleEditAward = (a: Award) => {
    setEditingAwardId(a.id)
    setAwardFormData(a)
    setAwardFormOpen(true)
  }
  const handleCancelAward = () => {
    setAwardFormOpen(false)
    setEditingAwardId(null)
    setAwardFormData(emptyAward)
  }
  const handleSaveAward = (data: Omit<Award, 'id'>) => {
    if (editingAwardId) {
      setAwards((prev) => prev.map((a) => (a.id === editingAwardId ? { ...data, id: editingAwardId } : a)))
    } else {
      setAwards((prev) => [{ ...data, id: Date.now().toString() }, ...prev])
    }
    handleCancelAward()
  }
  const handleDeleteAward = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setAwards((prev) => prev.filter((a) => a.id !== id))
    }
  }

  // Publication handlers
  const handleAddPub = () => {
    setEditingPubId(null)
    setPubFormData(emptyPublication)
    setPubFormOpen(true)
  }
  const handleEditPub = (p: Publication) => {
    setEditingPubId(p.id)
    setPubFormData(p)
    setPubFormOpen(true)
  }
  const handleCancelPub = () => {
    setPubFormOpen(false)
    setEditingPubId(null)
    setPubFormData(emptyPublication)
  }
  const handleSavePub = (data: Omit<Publication, 'id'>) => {
    if (editingPubId) {
      setPublications((prev) => prev.map((p) => (p.id === editingPubId ? { ...data, id: editingPubId } : p)))
    } else {
      setPublications((prev) => [{ ...data, id: Date.now().toString() }, ...prev])
    }
    handleCancelPub()
  }
  const handleDeletePub = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      setPublications((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // Volunteering handlers
  const handleAddVol = () => {
    setEditingVolId(null)
    setVolFormData(emptyVolunteering)
    setVolFormOpen(true)
  }
  const handleEditVol = (v: Volunteering) => {
    setEditingVolId(v.id)
    setVolFormData(v)
    setVolFormOpen(true)
  }
  const handleCancelVol = () => {
    setVolFormOpen(false)
    setEditingVolId(null)
    setVolFormData(emptyVolunteering)
  }
  const handleSaveVol = (data: Omit<Volunteering, 'id'>) => {
    if (editingVolId) {
      setVolunteerings((prev) => prev.map((v) => (v.id === editingVolId ? { ...data, id: editingVolId } : v)))
    } else {
      setVolunteerings((prev) => [{ ...data, id: Date.now().toString() }, ...prev])
    }
    handleCancelVol()
  }
  const handleDeleteVol = (id: string, role: string) => {
    if (confirm(`Are you sure you want to delete "${role}"?`)) {
      setVolunteerings((prev) => prev.filter((v) => v.id !== id))
    }
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">Achievements</h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Showcase your projects, certifications, awards, publications, and volunteering experiences
        </p>
      </div>

      {/* PROJECTS Section */}
      <SectionTitle first>Projects</SectionTitle>
      {projectFormOpen && (
        <div className="mb-md">
          <ProjectForm
            initialData={projectFormData}
            onSave={handleSaveProject}
            onCancel={handleCancelProject}
            isEditing={!!editingProjectId}
          />
        </div>
      )}
      {projects.length > 0 ? (
        <div className="space-y-sm mb-md">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={() => handleEditProject(p)} onDelete={() => handleDeleteProject(p.id, p.name)} />
          ))}
        </div>
      ) : !projectFormOpen && (
        <EmptyState icon={<RocketLaunchIcon className="w-6 h-6 text-text-tertiary" />} message="No projects added yet" />
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
          />
        </div>
      )}
      {certifications.length > 0 ? (
        <div className="space-y-sm mb-md">
          {certifications.map((c) => (
            <CertificationCard key={c.id} cert={c} onEdit={() => handleEditCert(c)} onDelete={() => handleDeleteCert(c.id, c.name)} />
          ))}
        </div>
      ) : !certFormOpen && (
        <EmptyState icon={<DocumentCheckIcon className="w-6 h-6 text-text-tertiary" />} message="No certifications added yet" />
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
          />
        </div>
      )}
      {awards.length > 0 ? (
        <div className="space-y-sm mb-md">
          {awards.map((a) => (
            <AwardCard key={a.id} award={a} onEdit={() => handleEditAward(a)} onDelete={() => handleDeleteAward(a.id, a.name)} />
          ))}
        </div>
      ) : !awardFormOpen && (
        <EmptyState icon={<TrophyIcon className="w-6 h-6 text-text-tertiary" />} message="No awards added yet" />
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
          />
        </div>
      )}
      {publications.length > 0 ? (
        <div className="space-y-sm mb-md">
          {publications.map((p) => (
            <PublicationCard key={p.id} pub={p} onEdit={() => handleEditPub(p)} onDelete={() => handleDeletePub(p.id, p.title)} />
          ))}
        </div>
      ) : !pubFormOpen && (
        <EmptyState icon={<NewspaperIcon className="w-6 h-6 text-text-tertiary" />} message="No publications added yet" />
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
          />
        </div>
      )}
      {volunteerings.length > 0 ? (
        <div className="space-y-sm mb-md">
          {volunteerings.map((v) => (
            <VolunteeringCard key={v.id} vol={v} onEdit={() => handleEditVol(v)} onDelete={() => handleDeleteVol(v.id, v.role)} />
          ))}
        </div>
      ) : !volFormOpen && (
        <EmptyState icon={<HeartIcon className="w-6 h-6 text-text-tertiary" />} message="No volunteering experiences added yet" />
      )}
      {!volFormOpen && (
        <button onClick={handleAddVol} className="btn-secondary flex items-center gap-1">
          <PlusIcon className="w-4 h-4" /> Add Volunteering Experience
        </button>
      )}

      {/* Tip */}
      <Tip>
        Include achievements most relevant to your target roles. Projects demonstrate hands-on experience,
        certifications validate your expertise, and volunteering shows character and community involvement.
      </Tip>
    </div>
  )
}
