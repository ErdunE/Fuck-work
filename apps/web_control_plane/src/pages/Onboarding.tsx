import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RocketLaunchIcon,
  UserIcon,
  LinkIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

// ============================================================================
// Types
// ============================================================================

interface OnboardingData {
  // Basic Info
  email: string
  firstName: string
  lastName: string
  phone: string
  countryCode: string
  city: string
  country: string

  // Links
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  otherUrl: string

  // Experience (matching ExperienceTab)
  experiences: Experience[]

  // Education (matching EducationTab)
  education: Education[]

  // Skills
  technicalSkills: string[]

  // Resume
  resumeFile: File | null
  resumeName: string

  // Preferences (matching PreferencesTab)
  desiredJobTitles: string[]
  preferredIndustries: string[]
  companySizes: string[]
  workModes: string[]
  employmentTypes: string[]
  minSalary: string
  maxSalary: string
  currency: string
  salaryPeriod: string
  preferredLocations: string[]
  availableStartDate: string
  willingToTravel: string

  // Work Authorization (matching PreferencesTab)
  authorizedCountries: string[]
  usAuthorizationStatus: string
  euAuthorizationStatus: string
  requireSponsorship: string

  // EEO
  genderIdentity: string
  veteranStatus: string
  disabilityStatus: string
  raceEthnicity: string[]
}

// Experience type matching ExperienceTab
interface Experience {
  id: string
  job_title: string
  company_name: string
  employment_type: string
  location_type: string
  location: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  description: string
  skills_used: string[]
}

// Education type matching EducationTab
interface Education {
  id: string
  school_name: string
  degree: string
  field_of_study: string
  location: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  gpa: string
  honors: string
  relevant_coursework: string
  activities: string
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { id: 'welcome', name: 'Welcome', icon: RocketLaunchIcon, required: false },
  { id: 'basic-info', name: 'Basic Info', icon: UserIcon, required: true },
  { id: 'links', name: 'Links', icon: LinkIcon, required: false },
  { id: 'experience', name: 'Experience', icon: BriefcaseIcon, required: false },
  { id: 'education', name: 'Education', icon: AcademicCapIcon, required: false },
  { id: 'skills', name: 'Skills', icon: WrenchScrewdriverIcon, required: false },
  { id: 'resume', name: 'Resume', icon: DocumentTextIcon, required: false },
  { id: 'preferences', name: 'Preferences', icon: AdjustmentsHorizontalIcon, required: true },
  { id: 'work-auth', name: 'Work Auth', icon: ShieldCheckIcon, required: true },
  { id: 'complete', name: 'Complete', icon: CheckCircleIcon, required: false },
]

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+86', country: 'CN' },
  { code: '+91', country: 'IN' },
  { code: '+81', country: 'JP' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+61', country: 'AU' },
  { code: '+65', country: 'SG' },
  { code: '+82', country: 'KR' },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Singapore', 'Japan', 'China', 'India', 'Other',
]

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
]

const LOCATION_TYPES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const YEARS = Array.from({ length: 50 }, (_, i) => {
  const year = new Date().getFullYear() - i
  return { value: year.toString(), label: year.toString() }
})

const FUTURE_YEARS = Array.from({ length: 60 }, (_, i) => {
  const year = new Date().getFullYear() + 5 - i
  return { value: year.toString(), label: year.toString() }
})

const DEGREES = [
  { value: 'high-school', label: 'High School Diploma' },
  { value: 'associate', label: "Associate's Degree" },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'certificate', label: 'Certificate / Bootcamp' },
  { value: 'other', label: 'Other' },
]

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-50)' },
  { value: 'small', label: 'Small (51-200)' },
  { value: 'medium', label: 'Medium (201-1000)' },
  { value: 'large', label: 'Large (1001-5000)' },
  { value: 'enterprise', label: 'Enterprise (5000+)' },
]

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

const PREF_EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
]

const SALARY_PERIODS = [
  { value: 'year', label: 'Per Year' },
  { value: 'month', label: 'Per Month' },
  { value: 'hour', label: 'Per Hour' },
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
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Netherlands', 'Ireland', 'Australia', 'Singapore', 'Japan',
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

const VETERAN_STATUS_OPTIONS = [
  { value: 'not_veteran', label: 'I am not a protected veteran' },
  { value: 'disabled_veteran', label: 'Disabled Veteran' },
  { value: 'recently_separated', label: 'Recently Separated Veteran' },
  { value: 'active_wartime', label: 'Active Duty Wartime or Campaign Badge Veteran' },
  { value: 'armed_forces', label: 'Armed Forces Service Medal Veteran' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const DISABILITY_STATUS_OPTIONS = [
  { value: 'yes', label: 'Yes, I have a disability' },
  { value: 'no', label: 'No, I do not have a disability' },
  { value: 'prefer_not_to_say', label: 'Prefer not to disclose' },
]

const GENDER_IDENTITY_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
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

const SUGGESTED_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
  'AWS', 'Docker', 'Git', 'Java', 'C++', 'Go', 'Kubernetes',
  'Machine Learning', 'Data Analysis', 'Project Management',
  'Agile', 'Communication', 'Leadership', 'Problem Solving',
]

const INDUSTRY_SUGGESTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce',
  'Consulting', 'Manufacturing', 'Media', 'Real Estate', 'Energy',
]

const LOCATION_SUGGESTIONS = [
  'Remote', 'San Francisco, CA', 'New York, NY', 'Seattle, WA',
  'Austin, TX', 'Los Angeles, CA', 'Boston, MA', 'Chicago, IL',
]

// ============================================================================
// Initial Data
// ============================================================================

const initialData: OnboardingData = {
  email: 'john.doe@example.com', // Pre-filled from registration
  firstName: '',
  lastName: '',
  phone: '',
  countryCode: '+1',
  city: '',
  country: 'United States',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  otherUrl: '',
  experiences: [],
  education: [],
  technicalSkills: [],
  resumeFile: null,
  resumeName: '',
  desiredJobTitles: [],
  preferredIndustries: [],
  companySizes: [],
  workModes: [],
  employmentTypes: ['full_time'],
  minSalary: '',
  maxSalary: '',
  currency: 'USD',
  salaryPeriod: 'year',
  preferredLocations: [],
  availableStartDate: 'immediately',
  willingToTravel: 'no_travel',
  authorizedCountries: [],
  usAuthorizationStatus: '',
  euAuthorizationStatus: '',
  requireSponsorship: 'no',
  genderIdentity: '',
  veteranStatus: '',
  disabilityStatus: '',
  raceEthnicity: [],
}

// ============================================================================
// Progress Bar Component
// ============================================================================

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / (totalSteps - 1)) * 100

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-bg-primary">
      <div className="h-1 bg-bg-tertiary">
        <div
          className="h-full bg-accent-blue transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="max-w-6xl mx-auto px-lg py-sm">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-xs text-label transition-colors ${
                index <= currentStep ? 'text-accent-blue' : 'text-text-quaternary'
              }`}
            >
              <step.icon className="w-4 h-4 hidden sm:block" />
              <span className="hidden md:inline">{step.name}</span>
              {step.required && index <= currentStep && (
                <span className="text-accent-red text-xs">*</span>
              )}
            </div>
          ))}
        </div>
      </div>
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
  columns = 1,
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  columns?: number
}) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className={`grid gap-sm ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : ''}`}>
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
// Step 1: Welcome
// ============================================================================

function WelcomeStep({
  onResumeUpload,
  resumeUploaded,
}: {
  onResumeUpload: (file: File) => void
  resumeUploaded: boolean
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onResumeUpload(file)
    }
  }

  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-lg bg-accent-blue/10 rounded-full flex items-center justify-center">
        <RocketLaunchIcon className="w-10 h-10 text-accent-blue" />
      </div>

      <h1 className="text-page-title text-text-primary mb-md">Welcome to FuckWork</h1>
      <p className="text-body text-text-secondary mb-xl max-w-md mx-auto">
        Let's set up your profile so we can start finding your perfect job matches and auto-apply on your behalf.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        {[
          { icon: '1', title: 'Smart Matching', desc: 'AI finds jobs that fit you' },
          { icon: '2', title: 'Auto Apply', desc: 'We apply while you sleep' },
          { icon: '3', title: 'Track Everything', desc: 'All applications in one place' },
        ].map((item) => (
          <div key={item.title} className="p-md bg-bg-secondary rounded-xl">
            <div className="w-8 h-8 mx-auto mb-sm bg-accent-blue text-white rounded-full flex items-center justify-center text-label font-semibold">
              {item.icon}
            </div>
            <p className="text-body font-medium text-text-primary">{item.title}</p>
            <p className="text-body-small text-text-tertiary">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-lg bg-bg-secondary rounded-xl mb-lg">
        <p className="text-body font-medium text-text-primary mb-sm">
          Have a resume? Upload it to auto-fill your profile
        </p>
        <p className="text-body-small text-text-tertiary mb-md">
          We'll extract your information so you don't have to type it all
        </p>

        <label className="inline-flex items-center gap-sm px-lg py-md border-2 border-dashed border-border-default rounded-xl cursor-pointer hover:border-accent-blue hover:bg-accent-blue/5 transition-colors">
          <DocumentTextIcon className="w-5 h-5 text-text-tertiary" />
          <span className="text-body text-text-secondary">
            {resumeUploaded ? 'Resume uploaded! Click to change' : 'Upload Resume (PDF, DOCX)'}
          </span>
          <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
        </label>

        {resumeUploaded && (
          <p className="mt-sm text-body-small text-accent-green flex items-center justify-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Resume uploaded - we'll pre-fill your information
          </p>
        )}
      </div>

      <p className="text-body-small text-text-quaternary">
        This will take about 3-5 minutes. You can skip optional steps and complete them later.
      </p>
    </div>
  )
}

// ============================================================================
// Step 2: Basic Info (with Email)
// ============================================================================

function BasicInfoStep({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: string) => void
}) {
  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">Let's start with the basics</h2>
      <p className="text-body text-text-secondary mb-xl text-center">
        This information will be used for job applications
      </p>

      <div className="space-y-lg max-w-lg mx-auto">
        {/* Email (pre-filled from registration) */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Email <span className="text-accent-red">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            className="input w-full"
          />
          <p className="text-label text-text-tertiary mt-xs">Pre-filled from your registration</p>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              First Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              placeholder="John"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Last Name <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="Doe"
              className="input w-full"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">
            Phone Number <span className="text-accent-red">*</span>
          </label>
          <div className="flex gap-sm">
            <select
              value={data.countryCode}
              onChange={(e) => onChange('countryCode', e.target.value)}
              className="input w-28"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} {c.country}</option>
              ))}
            </select>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="input flex-1"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              City <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="San Francisco"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-body-small text-text-primary mb-xs">
              Country <span className="text-accent-red">*</span>
            </label>
            <select
              value={data.country}
              onChange={(e) => onChange('country', e.target.value)}
              className="input w-full"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step 3: Links
// ============================================================================

function LinksStep({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: string) => void
}) {
  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">Add your professional links</h2>
      <p className="text-body text-text-secondary mb-xl text-center">
        Help employers learn more about you (all optional)
      </p>

      <div className="space-y-lg max-w-lg mx-auto">
        <div>
          <label className="block text-body-small text-text-primary mb-xs">LinkedIn Profile</label>
          <input
            type="url"
            value={data.linkedinUrl}
            onChange={(e) => onChange('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">GitHub Profile</label>
          <input
            type="url"
            value={data.githubUrl}
            onChange={(e) => onChange('githubUrl', e.target.value)}
            placeholder="https://github.com/yourusername"
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Portfolio / Personal Website</label>
          <input
            type="url"
            value={data.portfolioUrl}
            onChange={(e) => onChange('portfolioUrl', e.target.value)}
            placeholder="https://yourwebsite.com"
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Other Link</label>
          <input
            type="url"
            value={data.otherUrl}
            onChange={(e) => onChange('otherUrl', e.target.value)}
            placeholder="https://..."
            className="input w-full"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step 4: Experience (Full version matching ExperienceTab)
// ============================================================================

function ExperienceStep({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: Experience[]) => void
}) {
  const emptyExperience: Omit<Experience, 'id'> = {
    job_title: '', company_name: '', employment_type: 'full-time', location_type: 'on-site',
    location: '', start_month: '', start_year: '', end_month: '', end_year: '',
    is_current: false, description: '', skills_used: [],
  }

  const addExperience = () => {
    const newExp: Experience = { ...emptyExperience, id: Date.now().toString() }
    onChange('experiences', [...data.experiences, newExp])
  }

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean | string[]) => {
    onChange('experiences', data.experiences.map((exp) => exp.id === id ? { ...exp, [field]: value } : exp))
  }

  const removeExperience = (id: string) => {
    onChange('experiences', data.experiences.filter((exp) => exp.id !== id))
  }

  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">Your work experience</h2>
      <p className="text-body text-text-secondary mb-xl text-center">Add your relevant work history</p>

      <div className="max-w-2xl mx-auto space-y-lg">
        {data.experiences.length === 0 ? (
          <div className="text-center py-xl">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-md">
              <BriefcaseIcon className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-body text-text-tertiary mb-md">No experience added yet</p>
            <button onClick={addExperience} className="btn-secondary">Add Experience</button>
          </div>
        ) : (
          <>
            {data.experiences.map((exp, index) => (
              <div key={exp.id} className="bg-bg-secondary rounded-xl p-lg">
                <div className="flex justify-between items-center mb-md">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
                      <BuildingOfficeIcon className="w-5 h-5 text-text-tertiary" />
                    </div>
                    <span className="text-label text-text-tertiary">Experience {index + 1}</span>
                  </div>
                  <button onClick={() => removeExperience(exp.id)} className="text-body-small text-accent-red hover:underline">Remove</button>
                </div>

                <div className="space-y-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Job Title <span className="text-accent-red">*</span></label>
                      <input type="text" value={exp.job_title} onChange={(e) => updateExperience(exp.id, 'job_title', e.target.value)} placeholder="Software Engineer" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Company <span className="text-accent-red">*</span></label>
                      <input type="text" value={exp.company_name} onChange={(e) => updateExperience(exp.id, 'company_name', e.target.value)} placeholder="Google" className="input w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Employment Type</label>
                      <select value={exp.employment_type} onChange={(e) => updateExperience(exp.id, 'employment_type', e.target.value)} className="input w-full">
                        {EMPLOYMENT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Location Type</label>
                      <select value={exp.location_type} onChange={(e) => updateExperience(exp.id, 'location_type', e.target.value)} className="input w-full">
                        {LOCATION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-small text-text-primary mb-xs">Location</label>
                    <input type="text" value={exp.location} onChange={(e) => updateExperience(exp.id, 'location', e.target.value)} placeholder="San Francisco, CA" className="input w-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Start Date <span className="text-accent-red">*</span></label>
                      <div className="flex gap-sm">
                        <select value={exp.start_month} onChange={(e) => updateExperience(exp.id, 'start_month', e.target.value)} className="input flex-1">
                          <option value="">Month</option>
                          {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                        <select value={exp.start_year} onChange={(e) => updateExperience(exp.id, 'start_year', e.target.value)} className="input w-28">
                          <option value="">Year</option>
                          {YEARS.map((y) => (<option key={y.value} value={y.value}>{y.label}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">End Date</label>
                      <div className="flex gap-sm">
                        <select value={exp.end_month} onChange={(e) => updateExperience(exp.id, 'end_month', e.target.value)} className="input flex-1" disabled={exp.is_current}>
                          <option value="">Month</option>
                          {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                        <select value={exp.end_year} onChange={(e) => updateExperience(exp.id, 'end_year', e.target.value)} className="input w-28" disabled={exp.is_current}>
                          <option value="">Year</option>
                          {YEARS.map((y) => (<option key={y.value} value={y.value}>{y.label}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-sm cursor-pointer">
                    <input type="checkbox" checked={exp.is_current} onChange={(e) => { updateExperience(exp.id, 'is_current', e.target.checked); if (e.target.checked) { updateExperience(exp.id, 'end_month', ''); updateExperience(exp.id, 'end_year', ''); } }} className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue" />
                    <span className="text-body-small text-text-primary">I currently work here</span>
                  </label>

                  <div>
                    <label className="block text-body-small text-text-primary mb-xs">Description</label>
                    <textarea value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe your responsibilities and achievements..." rows={3} className="input w-full resize-y" />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addExperience} className="w-full py-md border-2 border-dashed border-border-default rounded-xl text-body text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-colors">
              + Add Another Experience
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Step 5: Education (Full version matching EducationTab)
// ============================================================================

function EducationStep({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: Education[]) => void
}) {
  const emptyEducation: Omit<Education, 'id'> = {
    school_name: '', degree: 'bachelor', field_of_study: '', location: '',
    start_month: '', start_year: '', end_month: '', end_year: '', is_current: false,
    gpa: '', honors: '', relevant_coursework: '', activities: '',
  }

  const addEducation = () => {
    const newEdu: Education = { ...emptyEducation, id: Date.now().toString() }
    onChange('education', [...data.education, newEdu])
  }

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    onChange('education', data.education.map((edu) => edu.id === id ? { ...edu, [field]: value } : edu))
  }

  const removeEducation = (id: string) => {
    onChange('education', data.education.filter((edu) => edu.id !== id))
  }

  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">Your education</h2>
      <p className="text-body text-text-secondary mb-xl text-center">Add your educational background</p>

      <div className="max-w-2xl mx-auto space-y-lg">
        {data.education.length === 0 ? (
          <div className="text-center py-xl">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-md">
              <AcademicCapIcon className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-body text-text-tertiary mb-md">No education added yet</p>
            <button onClick={addEducation} className="btn-secondary">Add Education</button>
          </div>
        ) : (
          <>
            {data.education.map((edu, index) => (
              <div key={edu.id} className="bg-bg-secondary rounded-xl p-lg">
                <div className="flex justify-between items-center mb-md">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
                      <AcademicCapIcon className="w-5 h-5 text-text-tertiary" />
                    </div>
                    <span className="text-label text-text-tertiary">Education {index + 1}</span>
                  </div>
                  <button onClick={() => removeEducation(edu.id)} className="text-body-small text-accent-red hover:underline">Remove</button>
                </div>

                <div className="space-y-md">
                  <div>
                    <label className="block text-body-small text-text-primary mb-xs">School Name <span className="text-accent-red">*</span></label>
                    <input type="text" value={edu.school_name} onChange={(e) => updateEducation(edu.id, 'school_name', e.target.value)} placeholder="Stanford University" className="input w-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Degree <span className="text-accent-red">*</span></label>
                      <select value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} className="input w-full">
                        {DEGREES.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Field of Study <span className="text-accent-red">*</span></label>
                      <input type="text" value={edu.field_of_study} onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)} placeholder="Computer Science" className="input w-full" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-small text-text-primary mb-xs">Location</label>
                    <input type="text" value={edu.location} onChange={(e) => updateEducation(edu.id, 'location', e.target.value)} placeholder="Stanford, CA" className="input w-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Start Date</label>
                      <div className="flex gap-sm">
                        <select value={edu.start_month} onChange={(e) => updateEducation(edu.id, 'start_month', e.target.value)} className="input flex-1">
                          <option value="">Month</option>
                          {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                        <select value={edu.start_year} onChange={(e) => updateEducation(edu.id, 'start_year', e.target.value)} className="input w-28">
                          <option value="">Year</option>
                          {FUTURE_YEARS.map((y) => (<option key={y.value} value={y.value}>{y.label}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">End Date (or Expected)</label>
                      <div className="flex gap-sm">
                        <select value={edu.end_month} onChange={(e) => updateEducation(edu.id, 'end_month', e.target.value)} className="input flex-1" disabled={edu.is_current}>
                          <option value="">Month</option>
                          {MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                        </select>
                        <select value={edu.end_year} onChange={(e) => updateEducation(edu.id, 'end_year', e.target.value)} className="input w-28" disabled={edu.is_current}>
                          <option value="">Year</option>
                          {FUTURE_YEARS.map((y) => (<option key={y.value} value={y.value}>{y.label}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-sm cursor-pointer">
                    <input type="checkbox" checked={edu.is_current} onChange={(e) => { updateEducation(edu.id, 'is_current', e.target.checked); if (e.target.checked) { updateEducation(edu.id, 'end_month', ''); updateEducation(edu.id, 'end_year', ''); } }} className="w-5 h-5 rounded border-border-default text-accent-blue focus:ring-accent-blue" />
                    <span className="text-body-small text-text-primary">I am currently studying here</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">GPA</label>
                      <input type="text" value={edu.gpa} onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)} placeholder="3.8/4.0" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-body-small text-text-primary mb-xs">Honors / Awards</label>
                      <input type="text" value={edu.honors} onChange={(e) => updateEducation(edu.id, 'honors', e.target.value)} placeholder="Cum Laude, Dean's List" className="input w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addEducation} className="w-full py-md border-2 border-dashed border-border-default rounded-xl text-body text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-colors">
              + Add Another Education
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Step 6: Skills
// ============================================================================

function SkillsStep({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: string[]) => void
}) {
  const [skillInput, setSkillInput] = useState('')

  const addSkill = (skill: string) => {
    if (skill && !data.technicalSkills.includes(skill)) {
      onChange('technicalSkills', [...data.technicalSkills, skill])
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    onChange('technicalSkills', data.technicalSkills.filter((s) => s !== skill))
  }

  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">What are your skills?</h2>
      <p className="text-body text-text-secondary mb-xl text-center">Add skills you want to highlight</p>

      <div className="max-w-2xl mx-auto">
        <div className="mb-lg">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
            placeholder="Type a skill and press Enter..."
            className="input w-full"
          />
        </div>

        {data.technicalSkills.length > 0 && (
          <div className="mb-lg">
            <p className="text-label text-text-tertiary mb-sm">Your Skills</p>
            <div className="flex flex-wrap gap-sm">
              {data.technicalSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 px-md py-xs bg-accent-blue/10 text-accent-blue rounded-full text-label">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:bg-accent-blue/20 rounded-full p-0.5"><XMarkIcon className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-label text-text-tertiary mb-sm">Suggested Skills</p>
          <div className="flex flex-wrap gap-sm">
            {SUGGESTED_SKILLS.filter((s) => !data.technicalSkills.includes(s)).map((skill) => (
              <button key={skill} onClick={() => addSkill(skill)} className="px-md py-xs bg-bg-secondary text-text-secondary rounded-full text-label hover:bg-bg-tertiary transition-colors">
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step 7: Resume (Confirmation page)
// ============================================================================

function ResumeStep({
  data,
  onChange,
  initialResumeUploaded,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: File | string | null) => void
  initialResumeUploaded: boolean
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange('resumeFile', file)
      onChange('resumeName', file.name)
    }
  }

  const hasResume = data.resumeName || initialResumeUploaded

  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">
        {hasResume ? 'Confirm your resume' : 'Upload your resume'}
      </h2>
      <p className="text-body text-text-secondary mb-xl text-center">
        {hasResume ? 'Your resume will be used for job applications' : 'Your resume helps with auto-apply'}
      </p>

      <div className="max-w-lg mx-auto">
        {hasResume ? (
          <div className="p-lg bg-bg-secondary rounded-xl text-center">
            <div className="w-16 h-16 mx-auto mb-md bg-accent-green/10 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-accent-green" />
            </div>
            <p className="text-body font-medium text-text-primary mb-xs">{data.resumeName || 'Resume uploaded'}</p>
            <p className="text-body-small text-text-tertiary mb-md">Your resume is ready for applications</p>
            <label className="inline-block text-body-small text-accent-blue hover:underline cursor-pointer">
              Upload a different resume
              <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        ) : (
          <label className="block p-xl border-2 border-dashed border-border-default rounded-xl text-center cursor-pointer hover:border-accent-blue hover:bg-accent-blue/5 transition-colors">
            <DocumentTextIcon className="w-12 h-12 text-text-quaternary mx-auto mb-md" />
            <p className="text-body font-medium text-text-primary mb-xs">Drop your resume here or click to upload</p>
            <p className="text-body-small text-text-tertiary">PDF or DOCX, max 5MB</p>
            <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Step 8: Preferences (Full version matching PreferencesTab)
// ============================================================================

function PreferencesStep({
  data,
  onChange,
  onArrayChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: string) => void
  onArrayChange: (field: keyof OnboardingData, value: string[]) => void
}) {
  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">What are you looking for?</h2>
      <p className="text-body text-text-secondary mb-xl text-center">Help us find the perfect job matches</p>

      <div className="max-w-2xl mx-auto space-y-xl">
        {/* Job Titles */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Desired Job Titles <span className="text-accent-red">*</span></label>
          <TagInput value={data.desiredJobTitles} onChange={(v) => onArrayChange('desiredJobTitles', v)} placeholder="e.g., Software Engineer, Product Manager..." />
        </div>

        {/* Industries */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Preferred Industries</label>
          <TagInput value={data.preferredIndustries} onChange={(v) => onArrayChange('preferredIndustries', v)} placeholder="e.g., Technology, Finance..." suggestions={INDUSTRY_SUGGESTIONS} />
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Company Size Preference</label>
          <CheckboxGroup options={COMPANY_SIZES} value={data.companySizes} onChange={(v) => onArrayChange('companySizes', v)} />
        </div>

        {/* Work Mode */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Preferred Work Mode <span className="text-accent-red">*</span></label>
          <CheckboxGroup options={WORK_MODES} value={data.workModes} onChange={(v) => onArrayChange('workModes', v)} />
        </div>

        {/* Employment Type */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Employment Type <span className="text-accent-red">*</span></label>
          <CheckboxGroup options={PREF_EMPLOYMENT_TYPES} value={data.employmentTypes} onChange={(v) => onArrayChange('employmentTypes', v)} />
        </div>

        {/* Preferred Locations */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Preferred Locations</label>
          <TagInput value={data.preferredLocations} onChange={(v) => onArrayChange('preferredLocations', v)} placeholder="e.g., San Francisco, Remote..." suggestions={LOCATION_SUGGESTIONS} />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Expected Salary Range</label>
          <div className="flex flex-wrap items-center gap-sm">
            <select value={data.currency} onChange={(e) => onChange('currency', e.target.value)} className="input w-28">
              {CURRENCIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
            <input type="number" value={data.minSalary} onChange={(e) => onChange('minSalary', e.target.value)} placeholder="Min" className="input w-28" />
            <span className="text-text-tertiary">-</span>
            <input type="number" value={data.maxSalary} onChange={(e) => onChange('maxSalary', e.target.value)} placeholder="Max" className="input w-28" />
            <select value={data.salaryPeriod} onChange={(e) => onChange('salaryPeriod', e.target.value)} className="input">
              {SALARY_PERIODS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
            </select>
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Available Start Date</label>
          <RadioGroup name="startDate" options={START_DATE_OPTIONS} value={data.availableStartDate} onChange={(v) => onChange('availableStartDate', v)} />
        </div>

        {/* Travel */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Willing to Travel</label>
          <RadioGroup name="travel" options={TRAVEL_OPTIONS} value={data.willingToTravel} onChange={(v) => onChange('willingToTravel', v)} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step 9: Work Authorization (Full version matching PreferencesTab)
// ============================================================================

function WorkAuthStep({
  data,
  onChange,
  onArrayChange,
}: {
  data: OnboardingData
  onChange: (field: keyof OnboardingData, value: string) => void
  onArrayChange: (field: keyof OnboardingData, value: string[]) => void
}) {
  const hasUS = data.authorizedCountries.includes('United States')
  const hasEU = data.authorizedCountries.some((c) => ['Germany', 'France', 'Netherlands', 'Ireland', 'United Kingdom'].includes(c))

  return (
    <div>
      <h2 className="text-section-title text-text-primary mb-sm text-center">Work Authorization</h2>
      <p className="text-body text-text-secondary mb-xl text-center">This information is required for job applications</p>

      <div className="max-w-2xl mx-auto space-y-xl">
        {/* Countries */}
        <div>
          <label className="block text-body-small text-text-primary mb-xs">Countries Authorized to Work In <span className="text-accent-red">*</span></label>
          <TagInput value={data.authorizedCountries} onChange={(v) => onArrayChange('authorizedCountries', v)} placeholder="Select countries..." suggestions={COMMON_COUNTRIES} />
        </div>

        {/* US Status */}
        {hasUS && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">US Work Authorization Status <span className="text-accent-red">*</span></label>
            <select value={data.usAuthorizationStatus} onChange={(e) => onChange('usAuthorizationStatus', e.target.value)} className="input w-full">
              <option value="">Select your status...</option>
              {US_AUTHORIZATION_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
        )}

        {/* EU Status */}
        {hasEU && (
          <div>
            <label className="block text-body-small text-text-primary mb-xs">EU/UK Work Authorization Status</label>
            <select value={data.euAuthorizationStatus} onChange={(e) => onChange('euAuthorizationStatus', e.target.value)} className="input w-full">
              <option value="">Select your status...</option>
              {EU_AUTHORIZATION_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
        )}

        {/* Sponsorship */}
        <div>
          <label className="block text-body-small text-text-primary mb-sm">Do you require visa sponsorship? <span className="text-accent-red">*</span></label>
          <RadioGroup name="sponsorship" options={SPONSORSHIP_OPTIONS} value={data.requireSponsorship} onChange={(v) => onChange('requireSponsorship', v)} />
        </div>

        {/* EEO Section */}
        <div className="pt-xl border-t border-border-light">
          <h3 className="text-label text-text-tertiary uppercase tracking-wider mb-md">Equal Employment Opportunity (Optional)</h3>
          <div className="flex items-start gap-sm p-md bg-bg-tertiary rounded-xl mb-lg">
            <InformationCircleIcon className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-0.5" />
            <p className="text-body-small text-text-secondary">
              This information is voluntary and confidential. It helps employers meet diversity reporting requirements.
            </p>
          </div>

          <div className="space-y-lg">
            <div>
              <label className="block text-body-small text-text-primary mb-sm">Gender Identity</label>
              <RadioGroup name="gender" options={GENDER_IDENTITY_OPTIONS} value={data.genderIdentity} onChange={(v) => onChange('genderIdentity', v)} />
            </div>

            <div>
              <label className="block text-body-small text-text-primary mb-sm">Veteran Status</label>
              <RadioGroup name="veteran" options={VETERAN_STATUS_OPTIONS} value={data.veteranStatus} onChange={(v) => onChange('veteranStatus', v)} />
            </div>

            <div>
              <label className="block text-body-small text-text-primary mb-sm">Disability Status</label>
              <RadioGroup name="disability" options={DISABILITY_STATUS_OPTIONS} value={data.disabilityStatus} onChange={(v) => onChange('disabilityStatus', v)} />
            </div>

            <div>
              <label className="block text-body-small text-text-primary mb-sm">Race / Ethnicity (select all that apply)</label>
              <CheckboxGroup options={RACE_ETHNICITY_OPTIONS} value={data.raceEthnicity} onChange={(v) => onArrayChange('raceEthnicity', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step 10: Complete
// ============================================================================

function CompleteStep({ data }: { data: OnboardingData }) {
  const navigate = useNavigate()

  const calculateCompleteness = () => {
    let score = 0
    const total = 10
    if (data.firstName && data.lastName) score++
    if (data.email) score++
    if (data.phone) score++
    if (data.linkedinUrl || data.githubUrl) score++
    if (data.experiences.length > 0) score++
    if (data.education.length > 0) score++
    if (data.technicalSkills.length > 0) score++
    if (data.resumeName) score++
    if (data.desiredJobTitles.length > 0 && data.workModes.length > 0) score++
    if (data.authorizedCountries.length > 0) score++
    return Math.round((score / total) * 100)
  }

  const completeness = calculateCompleteness()

  return (
    <div className="text-center">
      <div className="w-24 h-24 mx-auto mb-lg bg-accent-green/10 rounded-full flex items-center justify-center">
        <CheckCircleIcon className="w-14 h-14 text-accent-green" />
      </div>

      <h2 className="text-page-title text-text-primary mb-sm">You're all set!</h2>
      <p className="text-body text-text-secondary mb-xl max-w-md mx-auto">
        Your profile is ready. We'll start finding job matches and can now auto-apply on your behalf.
      </p>

      <div className="max-w-sm mx-auto mb-xl">
        <div className="flex justify-between text-label mb-xs">
          <span className="text-text-tertiary">Profile Completeness</span>
          <span className="text-accent-blue font-semibold">{completeness}%</span>
        </div>
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full bg-accent-blue transition-all duration-500" style={{ width: `${completeness}%` }} />
        </div>
        {completeness < 100 && (
          <p className="text-body-small text-text-tertiary mt-sm">Complete your profile in Settings to improve job matches</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-md justify-center">
        <button onClick={() => navigate('/match')} className="btn-primary px-xl py-md">View Matching Jobs</button>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary px-xl py-md">Go to Dashboard</button>
      </div>
    </div>
  )
}

// ============================================================================
// Main Onboarding Component
// ============================================================================

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [initialResumeUploaded, setInitialResumeUploaded] = useState(false)

  const updateField = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field: keyof OnboardingData, value: string[] | Experience[] | Education[]) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateAnyField = (field: keyof OnboardingData, value: File | string | null) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleResumeUpload = (file: File) => {
    setData((prev) => ({ ...prev, resumeFile: file, resumeName: file.name }))
    setInitialResumeUploaded(true)
  }

  const goNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1)
  }

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const skip = () => goNext()

  const isStepValid = () => {
    const stepId = STEPS[currentStep].id

    switch (stepId) {
      case 'basic-info':
        return Boolean(
          data.firstName?.trim() &&
          data.lastName?.trim() &&
          data.email?.trim() &&
          data.phone?.trim() &&
          data.city?.trim() &&
          data.country?.trim()
        )

      case 'preferences':
        // Only require these three fields
        const hasJobTitles = data.desiredJobTitles && data.desiredJobTitles.length > 0
        const hasWorkModes = data.workModes && data.workModes.length > 0
        const hasEmploymentTypes = data.employmentTypes && data.employmentTypes.length > 0

        console.log('Preferences validation:', {
          hasJobTitles,
          hasWorkModes,
          hasEmploymentTypes,
          desiredJobTitles: data.desiredJobTitles,
          workModes: data.workModes,
          employmentTypes: data.employmentTypes,
        })

        return hasJobTitles && hasWorkModes && hasEmploymentTypes

      case 'work-auth':
        const hasCountries = data.authorizedCountries && data.authorizedCountries.length > 0
        const hasSponsorship = Boolean(data.requireSponsorship?.trim())

        // If US is selected, also require US status
        const needsUsStatus = data.authorizedCountries?.includes('United States')
        const hasUsStatus = Boolean(data.usAuthorizationStatus?.trim())

        if (needsUsStatus) {
          return hasCountries && hasSponsorship && hasUsStatus
        }

        return hasCountries && hasSponsorship

      default:
        return true
    }
  }

  const canSkip = !STEPS[currentStep].required
  const isWelcomeStep = STEPS[currentStep].id === 'welcome'

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onResumeUpload={handleResumeUpload} resumeUploaded={initialResumeUploaded} />
      case 'basic-info':
        return <BasicInfoStep data={data} onChange={updateField} />
      case 'links':
        return <LinksStep data={data} onChange={updateField} />
      case 'experience':
        return <ExperienceStep data={data} onChange={updateArrayField} />
      case 'education':
        return <EducationStep data={data} onChange={updateArrayField} />
      case 'skills':
        return <SkillsStep data={data} onChange={updateArrayField} />
      case 'resume':
        return <ResumeStep data={data} onChange={updateAnyField} initialResumeUploaded={initialResumeUploaded} />
      case 'preferences':
        return <PreferencesStep data={data} onChange={updateField} onArrayChange={updateArrayField} />
      case 'work-auth':
        return <WorkAuthStep data={data} onChange={updateField} onArrayChange={updateArrayField} />
      case 'complete':
        return <CompleteStep data={data} />
      default:
        return null
    }
  }

  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0
  const currentStepConfig = STEPS[currentStep]

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Progress Bar - Fixed Top */}
      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Top padding for fixed progress bar, bottom padding for fixed nav */}
        <div className="pt-20 pb-20">
          <div className="max-w-6xl mx-auto px-lg py-lg">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Navigation - Fixed Bottom (except Complete step) */}
      {!isLastStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-border-light shadow-sm z-40">
          <div className="max-w-6xl mx-auto px-lg py-sm">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <div className="w-16">
                {!isFirstStep && (
                  <button
                    onClick={goBack}
                    className="text-body-small text-text-secondary hover:text-text-primary transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>

              {/* Skip & Continue - Right aligned */}
              <div className="flex items-center gap-md">
                {!isWelcomeStep && canSkip && (
                  <button
                    onClick={skip}
                    className="text-body-small text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Skip
                  </button>
                )}

                <button
                  onClick={goNext}
                  disabled={currentStepConfig.required && !isStepValid()}
                  className={`btn-primary px-lg py-xs text-body-small ${
                    currentStepConfig.required && !isStepValid()
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isFirstStep ? 'Get Started' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
