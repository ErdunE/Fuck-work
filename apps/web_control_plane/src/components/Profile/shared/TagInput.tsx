import { useState, KeyboardEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface TagInputProps {
  label: string
  required?: boolean
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
  hint?: string
  error?: string
}

export default function TagInput({
  label,
  required,
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  suggestions = [],
  hint,
  error,
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
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
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>

      <div
        className={`input p-sm min-h-[48px] flex flex-wrap gap-sm ${error ? 'border-accent-red' : ''}`}
      >
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

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-bg-primary rounded-lg shadow-dropdown border border-border-light py-1 z-10 max-h-48 overflow-y-auto">
              {filteredSuggestions.slice(0, 10).map((suggestion) => (
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

      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}
