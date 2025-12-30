import { useState, useEffect, useCallback } from 'react'
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import profileApi from '../../services/profileApi'
import type { ProfilePersonalInfo, OtherUrl } from '../../types/profile'

// ============================================================================
// Social Link Icons (Brand Icons)
// ============================================================================

const LinkedInIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const GitHubIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const GlobeIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const LinkIconSvg = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

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
// Form Field Components
// ============================================================================

interface TextFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  type?: 'text' | 'email' | 'tel' | 'url'
  disabled?: boolean
}

function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  disabled,
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`input w-full ${disabled ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : ''}`}
      />
      {hint && <p className="text-label text-text-tertiary mt-xs">{hint}</p>}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`input w-full ${disabled ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface TextareaFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
}

function TextareaField({
  label,
  required,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
}: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-body-small text-text-primary mb-xs">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="input w-full resize-y min-h-[120px]"
      />
    </div>
  )
}

// ============================================================================
// Phone Code Options
// ============================================================================

const PHONE_CODES = [
  { value: '+1', label: '+1 (US/CA)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+86', label: '+86 (China)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+81', label: '+81 (Japan)' },
  { value: '+82', label: '+82 (Korea)' },
  { value: '+49', label: '+49 (Germany)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+55', label: '+55 (Brazil)' },
  { value: '+52', label: '+52 (Mexico)' },
  { value: '+65', label: '+65 (Singapore)' },
  { value: '+852', label: '+852 (Hong Kong)' },
  { value: '+886', label: '+886 (Taiwan)' },
]

// ============================================================================
// Social Link Types
// ============================================================================

type SocialPlatform = 'linkedin' | 'github' | 'website' | 'other'

interface SocialLink {
  id: string
  platform: SocialPlatform
  url: string
  label?: string // For 'other' links
}

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    label: string
    icon: React.FC<{ className?: string }>
    placeholder: string
    color: string
  }
> = {
  linkedin: {
    label: 'LinkedIn',
    icon: LinkedInIcon,
    placeholder: 'https://linkedin.com/in/username',
    color: 'text-[#0A66C2]',
  },
  github: {
    label: 'GitHub',
    icon: GitHubIcon,
    placeholder: 'https://github.com/username',
    color: 'text-[#181717]',
  },
  website: {
    label: 'Website',
    icon: GlobeIcon,
    placeholder: 'https://yourwebsite.com',
    color: 'text-accent-blue',
  },
  other: {
    label: 'Other',
    icon: LinkIconSvg,
    placeholder: 'https://...',
    color: 'text-text-secondary',
  },
}

// ============================================================================
// Form Data Interface
// ============================================================================

interface FormData {
  first_name: string
  last_name: string
  preferred_name: string
  email: string
  phone_country_code: string
  phone_number: string
  country: string
  state: string
  city: string
  street_address: string
  apartment: string
  postal_code: string
  professional_summary: string
}

// ============================================================================
// Helper Functions
// ============================================================================

// Convert API response to form data
function apiToFormData(profile: ProfilePersonalInfo): FormData {
  return {
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    preferred_name: profile.preferred_name || '',
    email: profile.email || '',
    phone_country_code: profile.phone_country_code || '+1',
    phone_number: profile.phone_number || '',
    country: profile.country || '',
    state: profile.state || '',
    city: profile.city || '',
    street_address: profile.street_address || '',
    apartment: profile.apartment || '',
    postal_code: profile.postal_code || '',
    professional_summary: profile.professional_summary || '',
  }
}

// Convert API response to social links
function apiToSocialLinks(profile: ProfilePersonalInfo): SocialLink[] {
  const links: SocialLink[] = [
    { id: 'linkedin', platform: 'linkedin', url: profile.linkedin_url || '' },
    { id: 'github', platform: 'github', url: profile.github_url || '' },
    { id: 'website', platform: 'website', url: profile.website_url || '' },
  ]

  // Add other_urls
  if (profile.other_urls && Array.isArray(profile.other_urls)) {
    profile.other_urls.forEach((item: OtherUrl, index: number) => {
      links.push({
        id: `other-${index}`,
        platform: 'other',
        url: item.url || '',
        label: item.label || '',
      })
    })
  }

  return links
}

// Convert form data and social links to API format
function formToApiData(
  formData: FormData,
  socialLinks: SocialLink[]
): Partial<Omit<ProfilePersonalInfo, 'id' | 'user_id'>> {
  const linkedinLink = socialLinks.find((l) => l.platform === 'linkedin')
  const githubLink = socialLinks.find((l) => l.platform === 'github')
  const websiteLink = socialLinks.find((l) => l.platform === 'website')
  const otherLinks = socialLinks
    .filter((l) => l.platform === 'other' && l.url)
    .map((l) => ({ label: l.label || 'Link', url: l.url }))

  return {
    first_name: formData.first_name || null,
    last_name: formData.last_name || null,
    preferred_name: formData.preferred_name || null,
    email: formData.email || null,
    phone_country_code: formData.phone_country_code || null,
    phone_number: formData.phone_number || null,
    country: formData.country || null,
    state: formData.state || null,
    city: formData.city || null,
    street_address: formData.street_address || null,
    apartment: formData.apartment || null,
    postal_code: formData.postal_code || null,
    professional_summary: formData.professional_summary || null,
    linkedin_url: linkedinLink?.url || null,
    github_url: githubLink?.url || null,
    website_url: websiteLink?.url || null,
    other_urls: otherLinks.length > 0 ? otherLinks : null,
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function PersonalInfoTab() {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    preferred_name: '',
    email: '',
    phone_country_code: '+1',
    phone_number: '',
    country: '',
    state: '',
    city: '',
    street_address: '',
    apartment: '',
    postal_code: '',
    professional_summary: '',
  })

  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: 'linkedin', platform: 'linkedin', url: '' },
    { id: 'github', platform: 'github', url: '' },
    { id: 'website', platform: 'website', url: '' },
  ])

  // Location state
  const [countries, setCountries] = useState<ICountry[]>([])
  const [states, setStates] = useState<IState[]>([])
  const [cities, setCities] = useState<ICity[]>([])

  // Track if data was loaded from API (to avoid resetting location dropdowns)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries()
    setCountries(allCountries)
  }, [])

  // Load profile data from API
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profile = await profileApi.getFullProfile()

      // Convert API data to form data
      const newFormData = apiToFormData(profile)
      setFormData(newFormData)

      // Convert API data to social links
      const newSocialLinks = apiToSocialLinks(profile)
      setSocialLinks(newSocialLinks)

      // Load states if country exists
      if (newFormData.country) {
        const countryStates = State.getStatesOfCountry(newFormData.country)
        setStates(countryStates)

        // Load cities if state exists
        if (newFormData.state) {
          const stateCities = City.getCitiesOfState(
            newFormData.country,
            newFormData.state
          )
          setCities(stateCities)
        }
      }

      setInitialLoadDone(true)
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Load states when country changes (after initial load)
  useEffect(() => {
    if (!initialLoadDone) return

    if (formData.country) {
      const countryStates = State.getStatesOfCountry(formData.country)
      setStates(countryStates)
      setCities([])
    } else {
      setStates([])
      setCities([])
    }
  }, [formData.country, initialLoadDone])

  // Load cities when state changes (after initial load)
  useEffect(() => {
    if (!initialLoadDone) return

    if (formData.country && formData.state) {
      const stateCities = City.getCitiesOfState(formData.country, formData.state)
      setCities(stateCities)
    } else {
      setCities([])
    }
  }, [formData.state, formData.country, initialLoadDone])

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Reset dependent fields when country/state changes
      if (field === 'country') {
        newData.state = ''
        newData.city = ''
      } else if (field === 'state') {
        newData.city = ''
      }

      return newData
    })
  }

  const updateSocialLink = (id: string, url: string) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, url } : link))
    )
  }

  const updateSocialLinkLabel = (id: string, label: string) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, label } : link))
    )
  }

  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      { id: `other-${Date.now()}`, platform: 'other', url: '', label: '' },
    ])
  }

  const removeSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSaveMessage(null)

      const apiData = formToApiData(formData, socialLinks)
      await profileApi.updatePersonalInfo(apiData)

      setSaveMessage('Changes saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save changes. Please try again.')
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
          <div className="grid grid-cols-2 gap-md mt-xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-sm" />
                <div className="h-10 bg-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-xl">
      {/* Page Header */}
      <div className="mb-xl">
        <h2 className="text-section-title text-text-primary">
          Personal Information
        </h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Complete your profile to improve job matching accuracy
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

      {/* ================================================================== */}
      {/* SECTION: Basic Information */}
      {/* ================================================================== */}
      <SectionTitle first>BASIC INFORMATION</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <TextField
          label="First Name"
          required
          value={formData.first_name}
          onChange={(v) => updateField('first_name', v)}
          placeholder="John"
        />
        <TextField
          label="Last Name"
          required
          value={formData.last_name}
          onChange={(v) => updateField('last_name', v)}
          placeholder="Doe"
        />
        <TextField
          label="Preferred Name"
          value={formData.preferred_name}
          onChange={(v) => updateField('preferred_name', v)}
          placeholder="Johnny"
          hint="Nickname or name you go by"
        />
        <TextField
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(v) => updateField('email', v)}
          placeholder="john@email.com"
        />
      </div>

      {/* ================================================================== */}
      {/* SECTION: Contact */}
      {/* ================================================================== */}
      <SectionTitle>CONTACT</SectionTitle>

      <div className="flex gap-sm max-w-lg">
        <div className="w-36">
          <label className="block text-body-small text-text-primary mb-xs">
            Country Code
          </label>
          <select
            value={formData.phone_country_code}
            onChange={(e) => updateField('phone_country_code', e.target.value)}
            className="input w-full"
          >
            {PHONE_CODES.map((code) => (
              <option key={code.value} value={code.value}>
                {code.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <TextField
            label="Phone Number"
            type="tel"
            required
            value={formData.phone_number}
            onChange={(v) => updateField('phone_number', v)}
            placeholder="(234) 567-8900"
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION: Location */}
      {/* ================================================================== */}
      <SectionTitle>LOCATION</SectionTitle>

      <div className="space-y-md">
        {/* Country / State / City Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <SelectField
            label="Country"
            required
            value={formData.country}
            onChange={(v) => updateField('country', v)}
            options={countries.map((c) => ({ value: c.isoCode, label: c.name }))}
            placeholder="Select country"
          />
          <SelectField
            label="State / Province"
            required
            value={formData.state}
            onChange={(v) => updateField('state', v)}
            options={states.map((s) => ({ value: s.isoCode, label: s.name }))}
            placeholder={formData.country ? 'Select state' : 'Select country first'}
            disabled={!formData.country}
          />
          {cities.length > 0 ? (
            <SelectField
              label="City"
              required
              value={formData.city}
              onChange={(v) => updateField('city', v)}
              options={cities.map((c) => ({ value: c.name, label: c.name }))}
              placeholder="Select city"
            />
          ) : (
            <TextField
              label="City"
              required
              value={formData.city}
              onChange={(v) => updateField('city', v)}
              placeholder={formData.state ? 'Enter city' : 'Select state first'}
              disabled={!formData.state}
            />
          )}
        </div>

        {/* Street Address */}
        <TextField
          label="Street Address"
          value={formData.street_address}
          onChange={(v) => updateField('street_address', v)}
          placeholder="123 Main Street"
        />

        {/* Apartment + ZIP Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <TextField
            label="Apartment, Suite, etc."
            value={formData.apartment}
            onChange={(v) => updateField('apartment', v)}
            placeholder="Apt 4B"
          />
          <TextField
            label="ZIP / Postal Code"
            value={formData.postal_code}
            onChange={(v) => updateField('postal_code', v)}
            placeholder="94102"
          />
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION: Online Presence */}
      {/* ================================================================== */}
      <SectionTitle>ONLINE PRESENCE</SectionTitle>

      <div className="border border-border-light rounded-xl overflow-hidden">
        {socialLinks.map((link, index) => {
          const config = PLATFORM_CONFIG[link.platform]
          const Icon = config.icon
          const isLast = index === socialLinks.length - 1
          const canDelete = link.platform === 'other'

          return (
            <div
              key={link.id}
              className={`flex items-center gap-md p-md ${!isLast ? 'border-b border-border-light' : ''}`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0 ${config.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Platform Label or Custom Label Input */}
              <div className="w-24 flex-shrink-0">
                {link.platform === 'other' ? (
                  <input
                    type="text"
                    value={link.label || ''}
                    onChange={(e) => updateSocialLinkLabel(link.id, e.target.value)}
                    placeholder="Label"
                    className="input w-full text-body-small"
                  />
                ) : (
                  <span className="text-body-small text-text-primary font-medium">
                    {config.label}
                  </span>
                )}
              </div>

              {/* URL Input */}
              <div className="flex-1">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocialLink(link.id, e.target.value)}
                  placeholder={config.placeholder}
                  className="input w-full"
                />
              </div>

              {/* Delete Button (only for 'other' links) */}
              {canDelete && (
                <button
                  onClick={() => removeSocialLink(link.id)}
                  className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Link Button */}
      <button
        onClick={addSocialLink}
        className="mt-md flex items-center gap-xs text-body-small text-accent-blue hover:text-accent-blue/80 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add another link
      </button>

      {/* ================================================================== */}
      {/* SECTION: About */}
      {/* ================================================================== */}
      <SectionTitle>ABOUT</SectionTitle>

      <div>
        <TextareaField
          label="Professional Summary"
          value={formData.professional_summary}
          onChange={(v) => updateField('professional_summary', v)}
          placeholder="I am a software engineer with 5+ years of experience in building web applications. I specialize in React, Node.js, and cloud technologies..."
          maxLength={500}
          rows={5}
        />
        <p className="text-label text-text-tertiary mt-xs text-right">
          {formData.professional_summary.length}/500 characters
        </p>
      </div>

      {/* ================================================================== */}
      {/* Save Button */}
      {/* ================================================================== */}
      <div className="mt-xl pt-lg border-t border-border-light flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}