import { useState, useRef, useCallback, useEffect } from 'react'
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  EyeIcon,
  StarIcon,
  TrashIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import profileApi from '../../services/profileApi'
import type { Resume } from '../../types/profile'

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
// Upload Zone Component
// ============================================================================

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  title: string
  subtitle: string
  hint: string
  disabled?: boolean
}

function UploadZone({
  onFilesSelected,
  accept = '.pdf,.doc,.docx',
  title,
  subtitle,
  hint,
  disabled = false,
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

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((file) => {
        const ext = file.name.toLowerCase().split('.').pop()
        return ['pdf', 'doc', 'docx'].includes(ext || '')
      })

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected, disabled]
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
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-xl transition-all
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${
          isDragging && !disabled
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
        disabled={disabled}
      />

      <div className="flex flex-col items-center text-center">
        <div
          className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-md transition-colors
          ${isDragging && !disabled ? 'bg-accent-blue/10' : 'bg-bg-tertiary'}
        `}
        >
          <CloudArrowUpIcon
            className={`w-8 h-8 ${isDragging && !disabled ? 'text-accent-blue' : 'text-text-tertiary'}`}
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
  files: Resume[]
  onSetDefault: (id: number) => void
  onDelete: (id: number) => void
  onPreview: (file: Resume) => void
  onDownload: (file: Resume) => void
  showDefaultOption?: boolean
  isLoading?: boolean
}

function FileList({
  files,
  onSetDefault,
  onDelete,
  onPreview,
  onDownload,
  showDefaultOption = true,
  isLoading = false,
}: FileListProps) {
  if (files.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
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
                    {file.file_name}
                  </p>
                  {file.is_default && (
                    <span className="flex-shrink-0 px-sm py-0.5 bg-accent-green/10 text-accent-green text-label rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-label text-text-tertiary mt-xs">
                  {formatFileSize(file.file_size)} · Uploaded{' '}
                  {formatDate(file.uploaded_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-xs flex-shrink-0">
                {/* Preview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(file)
                  }}
                  disabled={isLoading}
                  className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  title="Preview"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file)
                  }}
                  disabled={isLoading}
                  className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>

                {/* Set Default (only for resumes) */}
                {showDefaultOption && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetDefault(file.id)
                    }}
                    disabled={isLoading || file.is_default}
                    className={`
                      p-2 rounded-lg transition-colors disabled:opacity-50
                      ${
                        file.is_default
                          ? 'text-accent-orange'
                          : 'text-text-tertiary hover:text-accent-orange hover:bg-accent-orange/10'
                      }
                    `}
                    title={file.is_default ? 'Default resume' : 'Set as default'}
                  >
                    {file.is_default ? (
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
                  disabled={isLoading}
                  className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
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
  // State
  const [resumes, setResumes] = useState<Resume[]>([])
  const [coverLetters, setCoverLetters] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load resumes from API
  const loadResumes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await profileApi.getResumes()
      setResumes(response.resumes || [])
      setCoverLetters(response.cover_letters || [])
    } catch (err) {
      console.error('Failed to load resumes:', err)
      setError('Failed to load files. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  // Get file extension
  const getFileExtension = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop()
    return ext || 'pdf'
  }

  // Get content type for file
  const getContentType = (fileType: string): string => {
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
    }
    return contentTypes[fileType] || 'application/octet-stream'
  }

  // Upload file to S3 and create record
  const uploadFile = async (
    file: File,
    isCoverLetter: boolean
  ): Promise<void> => {
    const fileType = getFileExtension(file.name)

    // 1. Get presigned URL
    const presignedResponse = await profileApi.getPresignedUploadUrl({
      file_name: file.name,
      file_type: fileType,
      is_cover_letter: isCoverLetter,
    })

    // 2. Upload to S3
    const uploadResponse = await fetch(presignedResponse.upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': getContentType(fileType),
      },
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3')
    }

    // 3. Create database record
    await profileApi.createResume({
      file_name: file.name,
      file_url: presignedResponse.file_url,
      file_type: fileType,
      file_size: file.size,
      is_default: !isCoverLetter && resumes.length === 0, // First resume is default
      is_cover_letter: isCoverLetter,
    })
  }

  // Handle resume upload
  const handleResumeUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true)
      setError(null)

      try {
        for (const file of files) {
          await uploadFile(file, false)
        }
        // Reload to get updated list
        await loadResumes()
      } catch (err) {
        console.error('Failed to upload resume:', err)
        setError('Failed to upload file. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [loadResumes, resumes.length]
  )

  // Handle cover letter upload
  const handleCoverLetterUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true)
      setError(null)

      try {
        for (const file of files) {
          await uploadFile(file, true)
        }
        // Reload to get updated list
        await loadResumes()
      } catch (err) {
        console.error('Failed to upload cover letter:', err)
        setError('Failed to upload file. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [loadResumes]
  )

  // Set default resume
  const handleSetDefaultResume = useCallback(
    async (id: number) => {
      try {
        setError(null)
        await profileApi.setDefaultResume(id)
        // Update local state
        setResumes((prev) =>
          prev.map((file) => ({
            ...file,
            is_default: file.id === id,
          }))
        )
      } catch (err) {
        console.error('Failed to set default resume:', err)
        setError('Failed to set default. Please try again.')
      }
    },
    []
  )

  // Delete file
  const handleDelete = useCallback(
    async (id: number, isCoverLetter: boolean) => {
      if (!confirm('Are you sure you want to delete this file?')) {
        return
      }

      try {
        setError(null)
        await profileApi.deleteResume(id)

        if (isCoverLetter) {
          setCoverLetters((prev) => prev.filter((f) => f.id !== id))
        } else {
          setResumes((prev) => {
            const filtered = prev.filter((f) => f.id !== id)
            // Note: Backend should handle setting new default if deleted was default
            return filtered
          })
        }
      } catch (err) {
        console.error('Failed to delete file:', err)
        setError('Failed to delete file. Please try again.')
      }
    },
    []
  )

  // Preview file - open in new tab
  const handlePreview = useCallback((file: Resume) => {
    window.open(file.file_url, '_blank')
  }, [])

  // Download file
  const handleDownload = useCallback(async (file: Resume) => {
    try {
      // Try to get signed download URL first
      const response = await profileApi.getResumeDownloadUrl(file.id)
      window.open(response.download_url, '_blank')
    } catch {
      // Fallback to direct URL
      window.open(file.file_url, '_blank')
    }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-40 bg-bg-tertiary rounded mt-xl" />
        </div>
      </div>
    )
  }

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

      {/* Error Message */}
      {error && (
        <div className="mb-lg p-md bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <p className="text-body-small text-accent-red">{error}</p>
        </div>
      )}

      {/* Uploading Indicator */}
      {isUploading && (
        <div className="mb-lg p-md bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
          <p className="text-body-small text-accent-blue">Uploading file...</p>
        </div>
      )}

      {/* ================================================================== */}
      {/* SECTION: Resume */}
      {/* ================================================================== */}
      <SectionTitle first>RESUME</SectionTitle>

      <UploadZone
        onFilesSelected={handleResumeUpload}
        title="Drag and drop your resume here"
        subtitle="or click to browse"
        hint="Supported formats: PDF, DOC, DOCX (Max 5MB)"
        disabled={isUploading}
      />

      {resumes.length > 0 ? (
        <FileList
          files={resumes}
          onSetDefault={handleSetDefaultResume}
          onDelete={(id) => handleDelete(id, false)}
          onPreview={handlePreview}
          onDownload={handleDownload}
          showDefaultOption={true}
          isLoading={isUploading}
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
        disabled={isUploading}
      />

      {coverLetters.length > 0 ? (
        <FileList
          files={coverLetters}
          onSetDefault={() => {}}
          onDelete={(id) => handleDelete(id, true)}
          onPreview={handlePreview}
          onDownload={handleDownload}
          showDefaultOption={false}
          isLoading={isUploading}
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