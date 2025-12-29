interface MonthYearPickerProps {
  label: string
  required?: boolean
  value: string // YYYY-MM format
  onChange: (value: string) => void
  error?: string
  hint?: string
  minYear?: number
  maxYear?: number
}

export default function MonthYearPicker({
  label,
  required,
  value,
  onChange,
  error,
  hint,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 10,
}: MonthYearPickerProps) {
  const [year, month] = value ? value.split('-') : ['', '']

  const months = [
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

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  )

  const handleMonthChange = (newMonth: string) => {
    if (year) {
      onChange(`${year}-${newMonth}`)
    } else {
      onChange(`${new Date().getFullYear()}-${newMonth}`)
    }
  }

  const handleYearChange = (newYear: string) => {
    if (month) {
      onChange(`${newYear}-${month}`)
    } else {
      onChange(`${newYear}-01`)
    }
  }

  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <div className="flex gap-sm">
        <select
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={`input flex-1 ${error ? 'border-accent-red' : ''}`}
        >
          <option value="">Month</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className={`input w-28 ${error ? 'border-accent-red' : ''}`}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {hint && !error && (
        <p className="text-label text-text-tertiary mt-xs">{hint}</p>
      )}
      {error && <p className="text-label text-accent-red mt-xs">{error}</p>}
    </div>
  )
}
