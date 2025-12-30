import { useState, useEffect, useCallback } from 'react'
import {
  LightBulbIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/solid'
import profileApi from '../../services/profileApi'
import type { JobPreferences } from '../../types/profile'
import {
  COMPANY_SIZES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
  AVAILABLE_START_DATES,
  TRAVEL_PERCENTAGES,
  WILLING_TO_RELOCATE_OPTIONS,
  REQUIRES_SPONSORSHIP_OPTIONS,
} from '../../types/profile'

// ============================================================================
// Constants
// ============================================================================

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'SGD', label: 'SGD (S$)' },
  { value: 'HKD', label: 'HKD (HK$)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'OTHER', label: 'Other' },
]

const SALARY_PERIODS = [
  { value: 'yearly', label: 'Per Year' },
  { value: 'monthly', label: 'Per Month' },
  { value: 'hourly', label: 'Per Hour' },
]

const COMMON_COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Ireland',
  'Australia',
  'Singapore',
  'Japan',
  'India',
  'China',
  'Hong Kong',
  'United Arab Emirates',
  'Switzerland',
  'Sweden',
  'Spain',
  'Italy',
  'Brazil',
  'Mexico',
]

// EEO Options
const GENDER_IDENTITY_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Transgender Male', label: 'Transgender Male' },
  { value: 'Transgender Female', label: 'Transgender Female' },
  { value: 'Genderqueer / Gender Non-conforming', label: 'Genderqueer / Gender Non-conforming' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
]

// Sexual Orientation
const SEXUAL_ORIENTATION_OPTIONS = [
  { value: 'Heterosexual / Straight', label: 'Heterosexual / Straight' },
  { value: 'Gay', label: 'Gay' },
  { value: 'Lesbian', label: 'Lesbian' },
  { value: 'Bisexual', label: 'Bisexual' },
  { value: 'Pansexual', label: 'Pansexual' },
  { value: 'Asexual', label: 'Asexual' },
  { value: 'Queer', label: 'Queer' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
]

// Veteran Status
const VETERAN_STATUS_OPTIONS = [
  { value: 'Not a veteran', label: 'I am not a protected veteran' },
  { value: 'Disabled Veteran', label: 'Disabled Veteran' },
  { value: 'Recently Separated Veteran', label: 'Recently Separated Veteran' },
  { value: 'Active Duty Wartime or Campaign Badge Veteran', label: 'Active Duty Wartime or Campaign Badge Veteran' },
  { value: 'Armed Forces Service Medal Veteran', label: 'Armed Forces Service Medal Veteran' },
  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
]

// Disability Status
const DISABILITY_STATUS_OPTIONS = [
  { value: 'Yes', label: 'Yes, I have a disability (or previously had a disability)' },
  { value: 'No', label: 'No, I do not have a disability' },
  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
]

// Race/Ethnicity
const RACE_ETHNICITY_OPTIONS = [
  { value: 'American Indian or Alaska Native', label: 'American Indian or Alaska Native' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Black or African American', label: 'Black or African American' },
  { value: 'Hispanic or Latino', label: 'Hispanic or Latino' },
  { value: 'Middle Eastern or North African', label: 'Middle Eastern or North African' },
  { value: 'Native Hawaiian or Pacific Islander', label: 'Native Hawaiian or Pacific Islander' },
  { value: 'White', label: 'White' },
  { value: 'Two or more races', label: 'Two or more races' },
  { value: 'Prefer not to disclose', label: 'Prefer not to disclose' },
]

const INDUSTRY_SUGGESTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Consulting',
  'Manufacturing',
  'Media',
  'Real Estate',
  'Energy',
  'Retail',
  'Transportation',
  'Hospitality',
  'Legal',
  'Non-profit',
]

const LOCATION_SUGGESTIONS = [
  'Remote',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Los Angeles, CA',
  'Boston, MA',
  'Chicago, IL',
  'Denver, CO',
  'Atlanta, GA',
]

// ============================================================================
// Form Data Type (matches frontend state)
// ============================================================================

interface PreferencesFormData {
  // Job Preferences
  desired_titles: string[]
  desired_industries: string[]
  desired_company_sizes: string[]

  // Compensation
  min_salary: string
  max_salary: string
  salary_currency: string
  salary_period: string
  salary_negotiable: boolean

  // Location & Work Mode
  preferred_locations: string[]
  work_modes: string[]
  willing_to_relocate: string
  relocation_locations: string[]

  // Employment Details
  employment_types: string[]
  available_start_date: string
  travel_percentage: string

  // Work Authorization
  work_auth_countries: string[]
  requires_sponsorship: string

  // Application Questions
  age_over_18: boolean
  has_drivers_license: boolean
  has_reliable_transportation: boolean
  background_check_consent: boolean
  drug_test_consent: boolean

  // EEO Information
  eeo_gender: string
  eeo_sexual_orientation: string
  eeo_veteran_status: string
  eeo_disability_status: string
  eeo_race_ethnicity: string[]
}

// ============================================================================
// Initial State
// ============================================================================

const initialFormData: PreferencesFormData = {
  desired_titles: [],
  desired_industries: [],
  desired_company_sizes: [],
  min_salary: '',
  max_salary: '',
  salary_currency: 'USD',
  salary_period: 'yearly',
  salary_negotiable: true,
  preferred_locations: [],
  work_modes: [],
  willing_to_relocate: 'for_the_right_opportunity',
  relocation_locations: [],
  employment_types: ['Full-time'],
  available_start_date: 'immediately',
  travel_percentage: 'no_travel',
  work_auth_countries: [],
  requires_sponsorship: 'no',
  age_over_18: true,
  has_drivers_license: false,
  has_reliable_transportation: true,
  background_check_consent: true,
  drug_test_consent: true,
  eeo_gender: '',
  eeo_sexual_orientation: '',
  eeo_veteran_status: '',
  eeo_disability_status: '',
  eeo_race_ethnicity: [],
}

// ============================================================================
// Helper Functions
// ============================================================================

function apiToFormData(prefs: JobPreferences): PreferencesFormData {
  return {
    desired_titles: prefs.desired_titles || [],
    desired_industries: prefs.desired_industries || [],
    desired_company_sizes: prefs.desired_company_sizes || [],
    min_salary: prefs.min_salary?.toString() || '',
    max_salary: prefs.max_salary?.toString() || '',
    salary_currency: prefs.salary_currency || 'USD',
    salary_period: prefs.salary_period || 'yearly',
    salary_negotiable: prefs.salary_negotiable ?? true,
    preferred_locations: prefs.preferred_locations || [],
    work_modes: prefs.work_modes || [],
    willing_to_relocate: prefs.willing_to_relocate || 'for_the_right_opportunity',
    relocation_locations: prefs.relocation_locations || [],
    employment_types: prefs.employment_types || ['Full-time'],
    available_start_date: prefs.available_start_date || 'immediately',
    travel_percentage: prefs.travel_percentage || 'no_travel',
    work_auth_countries: prefs.work_auth_countries || [],
    requires_sponsorship: prefs.requires_sponsorship || 'no',
    age_over_18: prefs.age_over_18 ?? true,
    has_drivers_license: prefs.has_drivers_license ?? false,
    has_reliable_transportation: prefs.has_reliable_transportation ?? true,
    background_check_consent: prefs.background_check_consent ?? true,
    drug_test_consent: prefs.drug_test_consent ?? true,
    eeo_gender: prefs.eeo_gender || '',
    eeo_sexual_orientation: prefs.eeo_sexual_orientation || '',
    eeo_veteran_status: prefs.eeo_veteran_status || '',
    eeo_disability_status: prefs.eeo_disability_status || '',
    eeo_race_ethnicity: prefs.eeo_race_ethnicity || [],
  }
}

function formToApiData(
  form: PreferencesFormData
): Partial<Omit<JobPreferences, 'id' | 'user_id'>> {
  return {
    desired_titles: form.desired_titles.length > 0 ? form.desired_titles : null,
    desired_industries:
      form.desired_industries.length > 0 ? form.desired_industries : null,
    desired_company_sizes:
      form.desired_company_sizes.length > 0 ? form.desired_company_sizes : null,
    min_salary: form.min_salary ? parseInt(form.min_salary) : null,
    max_salary: form.max_salary ? parseInt(form.max_salary) : null,
    salary_currency: form.salary_currency,
    salary_period: form.salary_period,
    salary_negotiable: form.salary_negotiable,
    preferred_locations:
      form.preferred_locations.length > 0 ? form.preferred_locations : null,
    work_modes: form.work_modes.length > 0 ? form.work_modes : null,
    willing_to_relocate: form.willing_to_relocate || null,
    relocation_locations:
      form.relocation_locations.length > 0 ? form.relocation_locations : null,
    employment_types:
      form.employment_types.length > 0 ? form.employment_types : null,
    available_start_date: form.available_start_date || null,
    travel_percentage: form.travel_percentage || null,
    work_auth_countries:
      form.work_auth_countries.length > 0 ? form.work_auth_countries : null,
    requires_sponsorship: form.requires_sponsorship || null,
    age_over_18: form.age_over_18,
    has_drivers_license: form.has_drivers_license,
    has_reliable_transportation: form.has_reliable_transportation,
    background_check_consent: form.background_check_consent,
    drug_test_consent: form.drug_test_consent,
    eeo_gender: form.eeo_gender || null,
    eeo_sexual_orientation: form.eeo_sexual_orientation || null,
    eeo_veteran_status: form.eeo_veteran_status || null,
    eeo_disability_status: form.eeo_disability_status || null,
    eeo_race_ethnicity:
      form.eeo_race_ethnicity.length > 0 ? form.eeo_race_ethnicity : null,
  }
}

// ============================================================================
// Section Title Component
// ============================================================================

function SectionTitle({
  children,
  first = false,
}: {
  children: React.ReactNode
  first?: boolean
}) {
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
// Info Box Component
// ============================================================================

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-sm p-md bg-bg-tertiary rounded-xl mb-lg">
      <InformationCircleIcon className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-0.5" />
      <p className="text-body-small text-text-secondary">{children}</p>
    </div>
  )
}

// ============================================================================
// Tag Input Component
// ============================================================================

function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  suggestions = [],
  disabled = false,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
  disabled?: boolean
}) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
    )
    .slice(0, 5)

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

  return (
    <div className="relative">
      <div
        className={`min-h-[48px] px-sm py-xs border border-border-default rounded-md flex flex-wrap items-center gap-sm bg-bg-primary transition-colors focus-within:border-accent-blue ${disabled ? 'opacity-50' : ''}`}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-sm py-1 bg-accent-blue/10 text-accent-blue rounded-full text-body-small leading-none"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="hover:bg-accent-blue/20 rounded-full p-0.5"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(e.target.value.length > 0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (inputValue.trim()) addTag(inputValue)
            } else if (
              e.key === 'Backspace' &&
              !inputValue &&
              value.length > 0
            ) {
              removeTag(value[value.length - 1])
            }
          }}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[150px] h-[30px] border-0 p-0 focus:ring-0 focus:outline-none text-body-small bg-transparent placeholder:text-text-tertiary disabled:cursor-not-allowed"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-xs bg-bg-primary border border-border-light rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-md py-sm text-body-small hover:bg-bg-secondary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Checkbox Group Component
// ============================================================================

function CheckboxGroup({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: { value: string; label: string }[] | readonly string[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}) {
  // Normalize options to always be { value, label } objects
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className="space-y-sm">
      {normalizedOptions.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
            disabled={disabled}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}

// ============================================================================
// Radio Group Component
// ============================================================================

function RadioGroup({
  name,
  options,
  value,
  onChange,
  disabled = false,
}: {
  name: string
  options: { value: string; label: string }[] | readonly { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-sm">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-sm cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-5 h-5 border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function PreferencesTab() {
  // State
  const [formData, setFormData] = useState<PreferencesFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const prefs = await profileApi.getJobPreferences()
      if (prefs) {
        setFormData(apiToFormData(prefs))
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
      setError('Failed to load preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updateField = <K extends keyof PreferencesFormData>(
    field: K,
    value: PreferencesFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSaveMessage(null)

      const apiData = formToApiData(formData)
      await profileApi.updateJobPreferences(apiData)

      setSaveMessage('Preferences saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-12 bg-bg-tertiary rounded mt-xl" />
          <div className="h-12 bg-bg-tertiary rounded" />
          <div className="h-12 bg-bg-tertiary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">Preferences</h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Set your job preferences to help us find the best matches and auto-fill
          applications
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-lg p-md bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <p className="text-body-small text-accent-red">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveMessage && (
        <div className="mb-lg p-md bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-body-small text-accent-green">{saveMessage}</p>
        </div>
      )}

      {/* JOB PREFERENCES Section */}
      <SectionTitle first>Job Preferences</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        What kind of jobs are you looking for?
      </p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Desired Job Titles
          </label>
          <TagInput
            value={formData.desired_titles}
            onChange={(v) => updateField('desired_titles', v)}
            placeholder="e.g., Software Engineer, Product Manager..."
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Preferred Industries
          </label>
          <TagInput
            value={formData.desired_industries}
            onChange={(v) => updateField('desired_industries', v)}
            placeholder="e.g., Technology, Finance, Healthcare..."
            suggestions={INDUSTRY_SUGGESTIONS}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Company Size Preference
          </label>
          <CheckboxGroup
            options={[...COMPANY_SIZES]}
            value={formData.desired_company_sizes}
            onChange={(v) => updateField('desired_company_sizes', v)}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* COMPENSATION Section */}
      <SectionTitle>Compensation</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        Your expected compensation range
      </p>

      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Minimum Salary
            </label>
            <input
              type="number"
              value={formData.min_salary}
              onChange={(e) => updateField('min_salary', e.target.value)}
              placeholder="80000"
              disabled={isSaving}
              className="input w-full disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Maximum Salary
            </label>
            <input
              type="number"
              value={formData.max_salary}
              onChange={(e) => updateField('max_salary', e.target.value)}
              placeholder="120000"
              disabled={isSaving}
              className="input w-full disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Currency
            </label>
            <select
              value={formData.salary_currency}
              onChange={(e) => updateField('salary_currency', e.target.value)}
              disabled={isSaving}
              className="input disabled:opacity-50"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Period
            </label>
            <select
              value={formData.salary_period}
              onChange={(e) => updateField('salary_period', e.target.value)}
              disabled={isSaving}
              className="input disabled:opacity-50"
            >
              {SALARY_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.salary_negotiable}
            onChange={(e) => updateField('salary_negotiable', e.target.checked)}
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            Salary is negotiable
          </span>
        </label>
      </div>

      {/* LOCATION & WORK MODE Section */}
      <SectionTitle>Location & Work Mode</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        Where would you like to work?
      </p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Preferred Locations
          </label>
          <TagInput
            value={formData.preferred_locations}
            onChange={(v) => updateField('preferred_locations', v)}
            placeholder="e.g., San Francisco, New York, Remote..."
            suggestions={LOCATION_SUGGESTIONS}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Work Mode
          </label>
          <CheckboxGroup
            options={[...WORK_MODES]}
            value={formData.work_modes}
            onChange={(v) => updateField('work_modes', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Willing to Relocate
          </label>
          <RadioGroup
            name="relocate"
            options={[...WILLING_TO_RELOCATE_OPTIONS]}
            value={formData.willing_to_relocate}
            onChange={(v) => updateField('willing_to_relocate', v)}
            disabled={isSaving}
          />
        </div>

        {formData.willing_to_relocate !== 'no' && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Locations You'd Relocate To
            </label>
            <TagInput
              value={formData.relocation_locations}
              onChange={(v) => updateField('relocation_locations', v)}
              placeholder="e.g., Seattle, Austin..."
              disabled={isSaving}
            />
          </div>
        )}
      </div>

      {/* EMPLOYMENT DETAILS Section */}
      <SectionTitle>Employment Details</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        Your availability and preferences
      </p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Employment Type
          </label>
          <CheckboxGroup
            options={[...EMPLOYMENT_TYPES]}
            value={formData.employment_types}
            onChange={(v) => updateField('employment_types', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Available Start Date
          </label>
          <RadioGroup
            name="startDate"
            options={[...AVAILABLE_START_DATES]}
            value={formData.available_start_date}
            onChange={(v) => updateField('available_start_date', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Willing to Travel
          </label>
          <RadioGroup
            name="travel"
            options={[...TRAVEL_PERCENTAGES]}
            value={formData.travel_percentage}
            onChange={(v) => updateField('travel_percentage', v)}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* WORK AUTHORIZATION Section */}
      <SectionTitle>Work Authorization</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        Your work authorization status
      </p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Countries Authorized to Work In
          </label>
          <TagInput
            value={formData.work_auth_countries}
            onChange={(v) => updateField('work_auth_countries', v)}
            placeholder="Select countries..."
            suggestions={COMMON_COUNTRIES}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Do you require visa sponsorship?
          </label>
          <RadioGroup
            name="sponsorship"
            options={[...REQUIRES_SPONSORSHIP_OPTIONS]}
            value={formData.requires_sponsorship}
            onChange={(v) => updateField('requires_sponsorship', v)}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* APPLICATION QUESTIONS Section */}
      <SectionTitle>Application Questions</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">
        Pre-fill answers to frequently asked questions
      </p>

      <div className="space-y-sm">
        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.age_over_18}
            onChange={(e) => updateField('age_over_18', e.target.checked)}
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            I am 18 years of age or older
          </span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.has_drivers_license}
            onChange={(e) => updateField('has_drivers_license', e.target.checked)}
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            I have a valid driver's license
          </span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.has_reliable_transportation}
            onChange={(e) =>
              updateField('has_reliable_transportation', e.target.checked)
            }
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            I have reliable transportation
          </span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.background_check_consent}
            onChange={(e) =>
              updateField('background_check_consent', e.target.checked)
            }
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            I am willing to undergo a background check
          </span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.drug_test_consent}
            onChange={(e) => updateField('drug_test_consent', e.target.checked)}
            disabled={isSaving}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue disabled:opacity-50"
          />
          <span className="text-body-small text-text-primary">
            I am willing to undergo a drug test
          </span>
        </label>
      </div>

      {/* EEO INFORMATION Section */}
      <SectionTitle>Equal Employment Opportunity</SectionTitle>
      <InfoBox>
        This information is collected for compliance with federal Equal
        Employment Opportunity (EEO) requirements. Your responses are voluntary,
        confidential, and will not affect your application. This data helps
        employers track their diversity and inclusion efforts.
      </InfoBox>

      <div className="space-y-lg">
        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Gender Identity
          </label>
          <RadioGroup
            name="gender"
            options={GENDER_IDENTITY_OPTIONS}
            value={formData.eeo_gender}
            onChange={(v) => updateField('eeo_gender', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Sexual Orientation
          </label>
          <RadioGroup
            name="orientation"
            options={SEXUAL_ORIENTATION_OPTIONS}
            value={formData.eeo_sexual_orientation}
            onChange={(v) => updateField('eeo_sexual_orientation', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Veteran Status
          </label>
          <RadioGroup
            name="veteran"
            options={VETERAN_STATUS_OPTIONS}
            value={formData.eeo_veteran_status}
            onChange={(v) => updateField('eeo_veteran_status', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Disability Status
          </label>
          <RadioGroup
            name="disability"
            options={DISABILITY_STATUS_OPTIONS}
            value={formData.eeo_disability_status}
            onChange={(v) => updateField('eeo_disability_status', v)}
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Race / Ethnicity{' '}
            <span className="text-text-tertiary">(select all that apply)</span>
          </label>
          <CheckboxGroup
            options={RACE_ETHNICITY_OPTIONS}
            value={formData.eeo_race_ethnicity}
            onChange={(v) => updateField('eeo_race_ethnicity', v)}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Tip */}
      <Tip>
        Complete your preferences to enable auto-fill for job applications. The
        more information you provide, the faster and more accurate your
        applications will be. EEO information is optional but helps employers
        meet diversity reporting requirements.
      </Tip>

      {/* Save Button */}
      <div className="flex justify-end mt-xl pt-lg border-t border-border-light">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}