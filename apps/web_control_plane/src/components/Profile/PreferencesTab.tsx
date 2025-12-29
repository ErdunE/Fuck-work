import { useState } from 'react'
import {
  LightBulbIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/solid'

// ============================================================================
// Types
// ============================================================================

interface Preferences {
  // Job Preferences
  desiredJobTitles: string[]
  preferredIndustries: string[]
  companySizes: string[]

  // Compensation
  minSalary: string
  maxSalary: string
  currency: string
  salaryPeriod: string
  salaryNegotiable: boolean

  // Location & Work Mode
  preferredLocations: string[]
  workModes: string[]
  willingToRelocate: string
  relocationLocations: string[]

  // Employment Details
  employmentTypes: string[]
  availableStartDate: string
  willingToTravel: string

  // Work Authorization
  authorizedCountries: string[]
  usAuthorizationStatus: string
  requireSponsorship: string
  euAuthorizationStatus: string

  // Application Questions
  isOver18: boolean
  hasDriversLicense: boolean
  hasReliableTransportation: boolean
  consentBackgroundCheck: boolean
  consentDrugTest: boolean

  // EEO Information
  genderIdentity: string
  sexualOrientation: string
  veteranStatus: string
  disabilityStatus: string
  raceEthnicity: string[]
}

// ============================================================================
// Constants
// ============================================================================

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-50 employees)' },
  { value: 'small', label: 'Small (51-200 employees)' },
  { value: 'medium', label: 'Medium (201-1000 employees)' },
  { value: 'large', label: 'Large (1001-5000 employees)' },
  { value: 'enterprise', label: 'Enterprise (5000+ employees)' },
]

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
  { value: 'year', label: 'Per Year' },
  { value: 'month', label: 'Per Month' },
  { value: 'hour', label: 'Per Hour' },
]

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

const RELOCATION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'for_right_opportunity', label: 'For the right opportunity' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'temporary', label: 'Temporary' },
]

const START_DATE_OPTIONS = [
  { value: 'immediately', label: 'Immediately' },
  { value: '2_weeks', label: '2 weeks' },
  { value: '1_month', label: '1 month' },
  { value: '2_months', label: '2 months' },
  { value: '3_months', label: '3+ months' },
]

const TRAVEL_OPTIONS = [
  { value: 'no_travel', label: 'No travel' },
  { value: 'up_to_25', label: 'Up to 25%' },
  { value: 'up_to_50', label: 'Up to 50%' },
  { value: 'up_to_75', label: 'Up to 75%' },
  { value: 'up_to_100', label: '100% travel' },
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

const US_AUTHORIZATION_STATUS = [
  { value: 'us_citizen', label: 'US Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident (Green Card)' },
  { value: 'opt', label: 'OPT (F-1 Student Visa)' },
  { value: 'opt_stem', label: 'OPT STEM Extension' },
  { value: 'cpt', label: 'CPT (F-1 Student Visa)' },
  { value: 'h1b', label: 'H-1B' },
  { value: 'h1b_transfer', label: 'H-1B (Transfer)' },
  { value: 'h4_ead', label: 'H-4 EAD' },
  { value: 'l1', label: 'L-1' },
  { value: 'l2_ead', label: 'L-2 EAD' },
  { value: 'tn', label: 'TN (NAFTA)' },
  { value: 'e2', label: 'E-2 Treaty Investor' },
  { value: 'e3', label: 'E-3 (Australian)' },
  { value: 'o1', label: 'O-1 Extraordinary Ability' },
  { value: 'j1', label: 'J-1' },
  { value: 'asylum_refugee', label: 'Asylee / Refugee' },
  { value: 'daca', label: 'DACA' },
  { value: 'other', label: 'Other' },
]

const EU_AUTHORIZATION_STATUS = [
  { value: 'eu_citizen', label: 'EU/EEA Citizen' },
  { value: 'uk_citizen', label: 'UK Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'work_permit', label: 'Work Permit / Visa' },
  { value: 'blue_card', label: 'EU Blue Card' },
  { value: 'student_visa', label: 'Student Visa with Work Rights' },
  { value: 'other', label: 'Other' },
]

const SPONSORSHIP_OPTIONS = [
  { value: 'yes', label: 'Yes, I will require sponsorship' },
  { value: 'no', label: 'No, I will not require sponsorship' },
  { value: 'not_applicable', label: 'Not applicable' },
]

// EEO Options
const GENDER_IDENTITY_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'transgender_male', label: 'Transgender Male' },
  { value: 'transgender_female', label: 'Transgender Female' },
  { value: 'genderqueer', label: 'Genderqueer / Gender Non-conforming' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const SEXUAL_ORIENTATION_OPTIONS = [
  { value: 'heterosexual', label: 'Heterosexual / Straight' },
  { value: 'gay', label: 'Gay' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'asexual', label: 'Asexual' },
  { value: 'queer', label: 'Queer' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const VETERAN_STATUS_OPTIONS = [
  { value: 'not_veteran', label: 'I am not a protected veteran' },
  { value: 'disabled_veteran', label: 'Disabled Veteran' },
  { value: 'recently_separated', label: 'Recently Separated Veteran' },
  { value: 'active_wartime', label: 'Active Duty Wartime or Campaign Badge Veteran' },
  { value: 'armed_forces', label: 'Armed Forces Service Medal Veteran' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const DISABILITY_STATUS_OPTIONS = [
  { value: 'yes', label: 'Yes, I have a disability (or previously had a disability)' },
  { value: 'no', label: 'No, I do not have a disability' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const RACE_ETHNICITY_OPTIONS = [
  { value: 'american_indian', label: 'American Indian or Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black or African American' },
  { value: 'hispanic', label: 'Hispanic or Latino' },
  { value: 'middle_eastern', label: 'Middle Eastern or North African' },
  { value: 'native_hawaiian', label: 'Native Hawaiian or Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'two_or_more', label: 'Two or more races' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

// Industry suggestions
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

// Location suggestions
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
// Initial State
// ============================================================================

const initialPreferences: Preferences = {
  desiredJobTitles: [],
  preferredIndustries: [],
  companySizes: [],
  minSalary: '',
  maxSalary: '',
  currency: 'USD',
  salaryPeriod: 'year',
  salaryNegotiable: true,
  preferredLocations: [],
  workModes: [],
  willingToRelocate: 'for_right_opportunity',
  relocationLocations: [],
  employmentTypes: ['full_time'],
  availableStartDate: 'immediately',
  willingToTravel: 'no_travel',
  authorizedCountries: [],
  usAuthorizationStatus: '',
  requireSponsorship: 'no',
  euAuthorizationStatus: '',
  isOver18: true,
  hasDriversLicense: false,
  hasReliableTransportation: true,
  consentBackgroundCheck: true,
  consentDrugTest: true,
  genderIdentity: '',
  sexualOrientation: '',
  veteranStatus: '',
  disabilityStatus: '',
  raceEthnicity: [],
}

// ============================================================================
// Section Title Component
// ============================================================================

function SectionTitle({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
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
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
}) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
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
      <div className="min-h-[48px] px-sm py-xs border border-border-default rounded-md flex flex-wrap items-center gap-sm bg-bg-primary transition-colors focus-within:border-accent-blue">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-sm py-1 bg-accent-blue/10 text-accent-blue rounded-full text-body-small leading-none"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:bg-accent-blue/20 rounded-full p-0.5">
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
            } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
              removeTag(value[value.length - 1])
            }
          }}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[150px] h-[30px] border-0 p-0 focus:ring-0 focus:outline-none text-body-small bg-transparent placeholder:text-text-tertiary"
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
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className="space-y-sm">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">{option.label}</span>
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
}: {
  name: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-sm">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-sm cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function PreferencesTab() {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences)

  const updateField = <K extends keyof Preferences>(field: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  const hasUSAuthorization = preferences.authorizedCountries.includes('United States')
  const hasEUAuthorization = preferences.authorizedCountries.some((c) =>
    ['Germany', 'France', 'Netherlands', 'Ireland', 'Spain', 'Italy', 'Sweden', 'United Kingdom'].includes(c)
  )

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">Preferences</h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Set your job preferences to help us find the best matches and auto-fill applications
        </p>
      </div>

      {/* JOB PREFERENCES Section */}
      <SectionTitle first>Job Preferences</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">What kind of jobs are you looking for?</p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Desired Job Titles</label>
          <TagInput
            value={preferences.desiredJobTitles}
            onChange={(v) => updateField('desiredJobTitles', v)}
            placeholder="e.g., Software Engineer, Product Manager..."
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-xs">Preferred Industries</label>
          <TagInput
            value={preferences.preferredIndustries}
            onChange={(v) => updateField('preferredIndustries', v)}
            placeholder="e.g., Technology, Finance, Healthcare..."
            suggestions={INDUSTRY_SUGGESTIONS}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Company Size Preference</label>
          <CheckboxGroup
            options={COMPANY_SIZES}
            value={preferences.companySizes}
            onChange={(v) => updateField('companySizes', v)}
          />
        </div>
      </div>

      {/* COMPENSATION Section */}
      <SectionTitle>Compensation</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">Your expected compensation range</p>

      <div className="space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Minimum Salary</label>
            <input
              type="number"
              value={preferences.minSalary}
              onChange={(e) => updateField('minSalary', e.target.value)}
              placeholder="80000"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Maximum Salary</label>
            <input
              type="number"
              value={preferences.maxSalary}
              onChange={(e) => updateField('maxSalary', e.target.value)}
              placeholder="120000"
              className="input w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="input"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Period</label>
            <select
              value={preferences.salaryPeriod}
              onChange={(e) => updateField('salaryPeriod', e.target.value)}
              className="input"
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
            checked={preferences.salaryNegotiable}
            onChange={(e) => updateField('salaryNegotiable', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">Salary is negotiable</span>
        </label>
      </div>

      {/* LOCATION & WORK MODE Section */}
      <SectionTitle>Location & Work Mode</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">Where would you like to work?</p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Preferred Locations</label>
          <TagInput
            value={preferences.preferredLocations}
            onChange={(v) => updateField('preferredLocations', v)}
            placeholder="e.g., San Francisco, New York, Remote..."
            suggestions={LOCATION_SUGGESTIONS}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Work Mode</label>
          <CheckboxGroup options={WORK_MODES} value={preferences.workModes} onChange={(v) => updateField('workModes', v)} />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Willing to Relocate</label>
          <RadioGroup
            name="relocate"
            options={RELOCATION_OPTIONS}
            value={preferences.willingToRelocate}
            onChange={(v) => updateField('willingToRelocate', v)}
          />
        </div>

        {preferences.willingToRelocate !== 'no' && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">Locations You'd Relocate To</label>
            <TagInput
              value={preferences.relocationLocations}
              onChange={(v) => updateField('relocationLocations', v)}
              placeholder="e.g., Seattle, Austin..."
            />
          </div>
        )}
      </div>

      {/* EMPLOYMENT DETAILS Section */}
      <SectionTitle>Employment Details</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">Your availability and preferences</p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Employment Type</label>
          <CheckboxGroup
            options={EMPLOYMENT_TYPES}
            value={preferences.employmentTypes}
            onChange={(v) => updateField('employmentTypes', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Available Start Date</label>
          <RadioGroup
            name="startDate"
            options={START_DATE_OPTIONS}
            value={preferences.availableStartDate}
            onChange={(v) => updateField('availableStartDate', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Willing to Travel</label>
          <RadioGroup
            name="travel"
            options={TRAVEL_OPTIONS}
            value={preferences.willingToTravel}
            onChange={(v) => updateField('willingToTravel', v)}
          />
        </div>
      </div>

      {/* WORK AUTHORIZATION Section */}
      <SectionTitle>Work Authorization</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">Your work authorization status</p>

      <div className="space-y-md">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Countries Authorized to Work In</label>
          <TagInput
            value={preferences.authorizedCountries}
            onChange={(v) => updateField('authorizedCountries', v)}
            placeholder="Select countries..."
            suggestions={COMMON_COUNTRIES}
          />
        </div>

        {hasUSAuthorization && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">US Work Authorization Status</label>
            <select
              value={preferences.usAuthorizationStatus}
              onChange={(e) => updateField('usAuthorizationStatus', e.target.value)}
              className="input w-full"
            >
              <option value="">Select your status...</option>
              {US_AUTHORIZATION_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasEUAuthorization && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">EU/UK Work Authorization Status</label>
            <select
              value={preferences.euAuthorizationStatus}
              onChange={(e) => updateField('euAuthorizationStatus', e.target.value)}
              className="input w-full"
            >
              <option value="">Select your status...</option>
              {EU_AUTHORIZATION_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Do you require visa sponsorship?</label>
          <RadioGroup
            name="sponsorship"
            options={SPONSORSHIP_OPTIONS}
            value={preferences.requireSponsorship}
            onChange={(v) => updateField('requireSponsorship', v)}
          />
        </div>
      </div>

      {/* APPLICATION QUESTIONS Section */}
      <SectionTitle>Application Questions</SectionTitle>
      <p className="text-body-small text-text-secondary mb-md">Pre-fill answers to frequently asked questions</p>

      <div className="space-y-sm">
        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.isOver18}
            onChange={(e) => updateField('isOver18', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">I am 18 years of age or older</span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.hasDriversLicense}
            onChange={(e) => updateField('hasDriversLicense', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">I have a valid driver's license</span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.hasReliableTransportation}
            onChange={(e) => updateField('hasReliableTransportation', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">I have reliable transportation</span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.consentBackgroundCheck}
            onChange={(e) => updateField('consentBackgroundCheck', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">I am willing to undergo a background check</span>
        </label>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.consentDrugTest}
            onChange={(e) => updateField('consentDrugTest', e.target.checked)}
            className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue"
          />
          <span className="text-body-small text-text-primary">I am willing to undergo a drug test</span>
        </label>
      </div>

      {/* EEO INFORMATION Section */}
      <SectionTitle>Equal Employment Opportunity</SectionTitle>
      <InfoBox>
        This information is collected for compliance with federal Equal Employment Opportunity (EEO)
        requirements. Your responses are voluntary, confidential, and will not affect your application.
        This data helps employers track their diversity and inclusion efforts.
      </InfoBox>

      <div className="space-y-lg">
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Gender Identity</label>
          <RadioGroup
            name="gender"
            options={GENDER_IDENTITY_OPTIONS}
            value={preferences.genderIdentity}
            onChange={(v) => updateField('genderIdentity', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Sexual Orientation</label>
          <RadioGroup
            name="orientation"
            options={SEXUAL_ORIENTATION_OPTIONS}
            value={preferences.sexualOrientation}
            onChange={(v) => updateField('sexualOrientation', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Veteran Status</label>
          <RadioGroup
            name="veteran"
            options={VETERAN_STATUS_OPTIONS}
            value={preferences.veteranStatus}
            onChange={(v) => updateField('veteranStatus', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">Disability Status</label>
          <RadioGroup
            name="disability"
            options={DISABILITY_STATUS_OPTIONS}
            value={preferences.disabilityStatus}
            onChange={(v) => updateField('disabilityStatus', v)}
          />
        </div>

        <div>
          <label className="block text-body-small text-text-primary mb-sm">
            Race / Ethnicity <span className="text-text-tertiary">(select all that apply)</span>
          </label>
          <CheckboxGroup
            options={RACE_ETHNICITY_OPTIONS}
            value={preferences.raceEthnicity}
            onChange={(v) => updateField('raceEthnicity', v)}
          />
        </div>
      </div>

      {/* Tip */}
      <Tip>
        Complete your preferences to enable auto-fill for job applications. The more information you provide, the faster
        and more accurate your applications will be. EEO information is optional but helps employers meet diversity
        reporting requirements.
      </Tip>

      {/* Save Button */}
      <div className="flex justify-end mt-xl pt-lg border-t border-border-light">
        <button type="button" className="btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  )
}
