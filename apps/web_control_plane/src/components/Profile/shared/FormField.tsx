import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
}

// Text Input
interface TextFieldProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number'
}

export function TextField({
  label,
  required,
  error,
  hint,
  disabled,
  ...props
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <input
        {...props}
        disabled={disabled}
        className={`input w-full ${error ? 'border-accent-red focus:ring-accent-red' : ''} ${disabled ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : ''}`}
      />
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}

// Select
interface SelectFieldProps
  extends BaseFieldProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  required,
  error,
  hint,
  options,
  placeholder,
  disabled,
  ...props
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <select
        {...props}
        disabled={disabled}
        className={`input w-full ${error ? 'border-accent-red' : ''} ${disabled ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}

// Textarea
interface TextareaFieldProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export function TextareaField({
  label,
  required,
  error,
  hint,
  ...props
}: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <textarea
        {...props}
        className={`input w-full min-h-[120px] resize-y ${error ? 'border-accent-red' : ''}`}
      />
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}

// Checkbox
interface CheckboxFieldProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {}

export function CheckboxField({
  label,
  required,
  error,
  hint,
  ...props
}: CheckboxFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-sm cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
        />
        <span className="text-body-small text-text-primary">
          {label}
          {required && <span className="text-accent-red ml-0.5">*</span>}
        </span>
      </label>
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs ml-7">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs ml-7">{error}</p>}
    </div>
  )
}

// Multi-select Checkbox Group
interface CheckboxGroupProps extends BaseFieldProps {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
}

export function CheckboxGroup({
  label,
  required,
  error,
  hint,
  options,
  value,
  onChange,
}: CheckboxGroupProps) {
  const handleChange = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  return (
    <div>
      <label className="block text-body-small text-text-primary mb-sm">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <div className="space-y-sm">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => handleChange(opt.value)}
              className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-body-small text-text-primary">{opt.label}</span>
          </label>
        ))}
      </div>
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}

// Radio Group
interface RadioGroupProps extends BaseFieldProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  direction?: 'horizontal' | 'vertical'
}

export function RadioGroup({
  label,
  required,
  error,
  hint,
  options,
  value,
  onChange,
  direction = 'vertical',
}: RadioGroupProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-sm">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <div
        className={
          direction === 'horizontal' ? 'flex flex-wrap gap-md' : 'space-y-sm'
        }
      >
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-sm cursor-pointer">
            <input
              type="radio"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-5 h-5 border-border-default text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-body-small text-text-primary">{opt.label}</span>
          </label>
        ))}
      </div>
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}
