import { useState, useRef, useCallback } from 'react'
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  StarIcon,
  TrashIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

// ============================================================================
// Types
// ============================================================================

interface UploadedFile {
  id: string
  name: string
  size: number
  uploadedAt: Date
  isDefault: boolean
  type: 'resume' | 'cover-letter'
}

// ============================================================================
// Section Title Component (Consistent with PersonalInfoTab)
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
// Upload Zone Component
// ============================================================================

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  title: string
  subtitle: string
  hint: string
}

function UploadZone({
  onFilesSelected,
  accept = '.pdf,.doc,.docx',
  title,
  subtitle,
  hint,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => {
        const ext = file.name.toLowerCase().split('.').pop()
        return ['pdf', 'doc', 'docx'].includes(ext || '')
      })

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesSelected(files)
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFilesSelected]
  )

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-xl cursor-pointer transition-all
        ${
          isDragging
            ? 'border-accent-blue bg-accent-blue/5'
            : 'border-border-default hover:border-accent-blue hover:bg-bg-secondary'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col items-center text-center">
        <div
          className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-md transition-colors
          ${isDragging ? 'bg-accent-blue/10' : 'bg-bg-tertiary'}
        `}
        >
          <CloudArrowUpIcon
            className={`w-8 h-8 ${isDragging ? 'text-accent-blue' : 'text-text-tertiary'}`}
          />
        </div>

        <p className="text-body text-text-primary mb-xs">{title}</p>
        <p className="text-body-small text-text-secondary mb-md">{subtitle}</p>
        <p className="text-label text-text-tertiary">{hint}</p>
      </div>
    </div>
  )
}

// ============================================================================
// File List Component
// ============================================================================

interface FileListProps {
  files: UploadedFile[]
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (id: string) => void
  showDefaultOption?: boolean
}

function FileList({
  files,
  onSetDefault,
  onDelete,
  onPreview,
  showDefaultOption = true,
}: FileListProps) {
  if (files.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="mt-lg">
      <p className="text-body-small text-text-secondary mb-sm">
        Uploaded Files ({files.length})
      </p>

      <div className="border border-border-light rounded-xl overflow-hidden">
        {files.map((file, index) => {
          const isLast = index === files.length - 1

          return (
            <div
              key={file.id}
              className={`
                flex items-center gap-md p-md bg-bg-primary hover:bg-bg-secondary transition-colors
                ${!isLast ? 'border-b border-border-light' : ''}
              `}
            >
              {/* File Icon */}
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-accent-blue" />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm">
                  <p className="text-body text-text-primary font-medium truncate">
                    {file.name}
                  </p>
                  {file.isDefault && (
                    <span className="flex-shrink-0 px-sm py-0.5 bg-accent-green/10 text-accent-green text-label rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-label text-text-tertiary mt-xs">
                  {formatFileSize(file.size)} · Uploaded {formatDate(file.uploadedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-xs flex-shrink-0">
                {/* Preview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(file.id)
                  }}
                  className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                  title="Preview"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>

                {/* Set Default (only for resumes) */}
                {showDefaultOption && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetDefault(file.id)
                    }}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${
                        file.isDefault
                          ? 'text-accent-orange'
                          : 'text-text-tertiary hover:text-accent-orange hover:bg-accent-orange/10'
                      }
                    `}
                    title={file.isDefault ? 'Default resume' : 'Set as default'}
                  >
                    {file.isDefault ? (
                      <StarIconSolid className="w-5 h-5" />
                    ) : (
                      <StarIcon className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(file.id)
                  }}
                  className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  message: string
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="mt-lg py-lg text-center">
      <p className="text-body-small text-text-tertiary">{message}</p>
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
// Main Component
// ============================================================================

export default function ResumeTab() {
  const [resumes, setResumes] = useState<UploadedFile[]>([])
  const [coverLetters, setCoverLetters] = useState<UploadedFile[]>([])

  // Handle resume upload
  const handleResumeUpload = useCallback(
    (files: File[]) => {
      const newFiles: UploadedFile[] = files.map((file, index) => ({
        id: `resume-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        isDefault: resumes.length === 0 && index === 0, // First upload is default
        type: 'resume' as const,
      }))

      setResumes((prev) => [...prev, ...newFiles])

      // TODO: Upload to server
      console.log('Uploading resumes:', files)
    },
    [resumes.length]
  )

  // Handle cover letter upload
  const handleCoverLetterUpload = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `cover-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      isDefault: false,
      type: 'cover-letter' as const,
    }))

    setCoverLetters((prev) => [...prev, ...newFiles])

    // TODO: Upload to server
    console.log('Uploading cover letters:', files)
  }, [])

  // Set default resume
  const handleSetDefaultResume = useCallback((id: string) => {
    setResumes((prev) =>
      prev.map((file) => ({
        ...file,
        isDefault: file.id === id,
      }))
    )
  }, [])

  // Delete resume
  const handleDeleteResume = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      setResumes((prev) => {
        const filtered = prev.filter((file) => file.id !== id)
        // If deleted file was default, set first remaining as default
        if (filtered.length > 0 && !filtered.some((f) => f.isDefault)) {
          filtered[0].isDefault = true
        }
        return filtered
      })
    }
  }, [])

  // Delete cover letter
  const handleDeleteCoverLetter = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this cover letter?')) {
      setCoverLetters((prev) => prev.filter((file) => file.id !== id))
    }
  }, [])

  // Preview file (placeholder)
  const handlePreview = useCallback(() => {
    // TODO: Implement file preview
    alert('Preview functionality coming soon!')
  }, [])

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">
          Resume & Documents
        </h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Upload your resume to auto-fill job applications
        </p>
      </div>

      {/* ================================================================== */}
      {/* SECTION: Resume */}
      {/* ================================================================== */}
      <SectionTitle first>RESUME</SectionTitle>

      <UploadZone
        onFilesSelected={handleResumeUpload}
        title="Drag and drop your resume here"
        subtitle="or click to browse"
        hint="Supported formats: PDF, DOC, DOCX (Max 5MB)"
      />

      {resumes.length > 0 ? (
        <FileList
          files={resumes}
          onSetDefault={handleSetDefaultResume}
          onDelete={handleDeleteResume}
          onPreview={handlePreview}
          showDefaultOption={true}
        />
      ) : (
        <EmptyState message="No resumes uploaded yet" />
      )}

      <Tip>
        Upload multiple versions of your resume for different job types (e.g.,
        technical, management, creative). The default resume will be used when
        auto-filling applications.
      </Tip>

      {/* ================================================================== */}
      {/* SECTION: Cover Letter Templates */}
      {/* ================================================================== */}
      <SectionTitle>COVER LETTER TEMPLATES</SectionTitle>

      <UploadZone
        onFilesSelected={handleCoverLetterUpload}
        title="Upload cover letter template"
        subtitle="or click to browse"
        hint="Supported formats: PDF, DOC, DOCX (Max 5MB)"
      />

      {coverLetters.length > 0 ? (
        <FileList
          files={coverLetters}
          onSetDefault={() => {}}
          onDelete={handleDeleteCoverLetter}
          onPreview={handlePreview}
          showDefaultOption={false}
        />
      ) : (
        <EmptyState message="No cover letters uploaded yet" />
      )}

      <Tip>
        Save your cover letter templates here. You can customize them for each
        application later.
      </Tip>
    </div>
  )
}
