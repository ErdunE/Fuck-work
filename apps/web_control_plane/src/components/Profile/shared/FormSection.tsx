import { ReactNode } from 'react'

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export default function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <div className="mb-xl">
      <h3 className="text-card-title text-text-primary mb-xs">{title}</h3>
      {description && (
        <p className="text-body-small text-text-secondary mb-md">{description}</p>
      )}
      {children}
    </div>
  )
}
