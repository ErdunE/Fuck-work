// =============================================================================
// Profile Types - Phase 7.0
// Matches backend API exactly
// =============================================================================

// -----------------------------------------------------------------------------
// Personal Info / Profile
// -----------------------------------------------------------------------------

export interface OtherUrl {
  label: string
  url: string
}

export interface ProfilePersonalInfo {
  id: number
  user_id: number
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  email: string | null
  phone_country_code: string | null
  phone_number: string | null
  country: string | null
  state: string | null
  city: string | null
  street_address: string | null
  apartment: string | null
  postal_code: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  other_urls: OtherUrl[] | null
  professional_summary: string | null
}

// -----------------------------------------------------------------------------
// Resume & Cover Letter
// -----------------------------------------------------------------------------

export interface Resume {
  id: number
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  is_default: boolean
  is_cover_letter: boolean
  uploaded_at: string
}

export interface ResumeListResponse {
  resumes: Resume[]
  cover_letters: Resume[]
  total: number
}

export interface PresignedUrlRequest {
  file_name: string
  file_type: string
  is_cover_letter: boolean
}

export interface PresignedUrlResponse {
  upload_url: string
  file_url: string
  file_key: string
  expires_in: number
}

// -----------------------------------------------------------------------------
// Experience
// -----------------------------------------------------------------------------

export interface Experience {
  id: number
  job_title: string
  company_name: string
  employment_type: string | null  // "Full-time", "Part-time", "Contract", etc.
  location_type: string | null    // "On-site", "Remote", "Hybrid"
  location: string | null
  start_month: string | null      // "January", "February", etc.
  start_year: number | null
  end_month: string | null
  end_year: number | null
  is_current: boolean
  description: string | null
  skills_used: string[] | null
}

export interface ExperienceListResponse {
  experience: Experience[]
  total: number
}

// -----------------------------------------------------------------------------
// Education
// -----------------------------------------------------------------------------

export interface Education {
  id: number
  school_name: string
  degree: string | null
  field_of_study: string | null
  location: string | null
  start_month: string | null
  start_year: number | null
  end_month: string | null
  end_year: number | null
  is_current: boolean
  gpa: string | null              // VARCHAR, e.g., "3.9/4.0"
  honors: string | null
  coursework: string | null
  activities: string | null
}

export interface EducationListResponse {
  education: Education[]
  total: number
}

// -----------------------------------------------------------------------------
// Skills
// -----------------------------------------------------------------------------

export interface Skill {
  id: number
  skill_name: string
}

export interface SkillListResponse {
  skills: Skill[]
  total: number
}

export interface BulkSkillsRequest {
  skills: string[]
}

// -----------------------------------------------------------------------------
// Languages
// -----------------------------------------------------------------------------

export interface Language {
  id: number
  language_name: string
  proficiency: string | null  // "Native", "Fluent", "Professional", "Conversational", "Basic"
}

export interface LanguageListResponse {
  languages: Language[]
  total: number
}

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------

export interface Project {
  id: number
  project_name: string
  role: string | null
  start_month: string | null
  start_year: number | null
  end_month: string | null
  end_year: number | null
  is_ongoing: boolean
  project_url: string | null
  repo_url: string | null
  description: string | null
  technologies: string[] | null
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
}

// -----------------------------------------------------------------------------
// Certifications
// -----------------------------------------------------------------------------

export interface Certification {
  id: number
  name: string
  issuing_organization: string | null
  issue_month: string | null
  issue_year: number | null
  expiration_month: string | null
  expiration_year: number | null
  no_expiration: boolean
  credential_id: string | null
  credential_url: string | null
}

export interface CertificationListResponse {
  certifications: Certification[]
  total: number
}

// -----------------------------------------------------------------------------
// Awards
// -----------------------------------------------------------------------------

export interface Award {
  id: number
  title: string
  issuer: string | null
  received_month: string | null
  received_year: number | null
  description: string | null
}

export interface AwardListResponse {
  awards: Award[]
  total: number
}

// -----------------------------------------------------------------------------
// Publications
// -----------------------------------------------------------------------------

export interface Publication {
  id: number
  title: string
  publisher: string | null
  publication_month: string | null
  publication_year: number | null
  url: string | null
  authors: string | null
  description: string | null
}

export interface PublicationListResponse {
  publications: Publication[]
  total: number
}

// -----------------------------------------------------------------------------
// Volunteering
// -----------------------------------------------------------------------------

export interface Volunteering {
  id: number
  organization: string
  role: string | null
  cause: string | null
  start_month: string | null
  start_year: number | null
  end_month: string | null
  end_year: number | null
  is_current: boolean
  description: string | null
}

export interface VolunteeringListResponse {
  volunteering: Volunteering[]
  total: number
}

// -----------------------------------------------------------------------------
// Job Preferences
// -----------------------------------------------------------------------------

export interface JobPreferences {
  id: number
  user_id: number
  
  // Job Preferences
  desired_titles: string[] | null
  desired_industries: string[] | null
  desired_company_sizes: string[] | null
  
  // Compensation
  min_salary: number | null
  max_salary: number | null
  salary_currency: string
  salary_period: string              // "yearly", "monthly", "hourly"
  salary_negotiable: boolean
  
  // Location & Work Mode
  preferred_locations: string[] | null
  work_modes: string[] | null        // ["Remote", "Hybrid", "On-site"]
  willing_to_relocate: string | null // "yes", "no", "for_the_right_opportunity"
  relocation_locations: string[] | null
  
  // Employment Details
  employment_types: string[] | null  // ["Full-time", "Part-time", "Contract"]
  available_start_date: string | null // "immediately", "2_weeks", "1_month", etc.
  travel_percentage: string | null   // "no_travel", "up_to_25", "up_to_50", etc.
  
  // Work Authorization
  work_auth_countries: string[] | null
  requires_sponsorship: string | null // "yes", "no", "not_applicable"
  
  // Application Questions
  age_over_18: boolean | null
  has_drivers_license: boolean | null
  has_reliable_transportation: boolean | null
  background_check_consent: boolean | null
  drug_test_consent: boolean | null
  
  // EEO
  eeo_gender: string | null
  eeo_sexual_orientation: string | null
  eeo_veteran_status: string | null
  eeo_disability_status: string | null
  eeo_race_ethnicity: string[] | null
}

// -----------------------------------------------------------------------------
// Full Profile Response (GET /api/users/me/profile)
// -----------------------------------------------------------------------------

export interface FullProfile extends ProfilePersonalInfo {
  education: Education[]
  experience: Experience[]
  skills: Skill[]
  languages: Language[]
  projects: Project[]
  certifications: Certification[]
  awards: Award[]
  publications: Publication[]
  volunteering: Volunteering[]
  resumes: Resume[]
}

// -----------------------------------------------------------------------------
// Form Data Types (for components)
// -----------------------------------------------------------------------------

export type ExperienceFormData = Omit<Experience, 'id'>
export type EducationFormData = Omit<Education, 'id'>
export type ProjectFormData = Omit<Project, 'id'>
export type CertificationFormData = Omit<Certification, 'id'>
export type AwardFormData = Omit<Award, 'id'>
export type PublicationFormData = Omit<Publication, 'id'>
export type VolunteeringFormData = Omit<Volunteering, 'id'>
export type LanguageFormData = Omit<Language, 'id'>

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export const EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Temporary'
] as const

export const LOCATION_TYPES = [
  'On-site', 'Remote', 'Hybrid'
] as const

export const LANGUAGE_PROFICIENCIES = [
  'Native', 'Fluent', 'Professional', 'Conversational', 'Basic'
] as const

export const DEGREE_TYPES = [
  'High School Diploma',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'MBA',
  'Doctorate (PhD)',
  'Professional Degree (JD, MD)',
  'Certificate',
  'Other'
] as const

export const COMPANY_SIZES = [
  { value: 'Startup', label: 'Startup (1-10)' },
  { value: 'Small', label: 'Small (11-50)' },
  { value: 'Mid-size', label: 'Mid-size (51-200)' },
  { value: 'Large', label: 'Large (201-1000)' },
  { value: 'Enterprise', label: 'Enterprise (1000+)' },
] as const

export const WORK_MODES = [
  'Remote',
  'Hybrid',
  'On-site'
] as const

export const AVAILABLE_START_DATES = [
  { value: 'immediately', label: 'Immediately' },
  { value: '2_weeks', label: '2 Weeks Notice' },
  { value: '1_month', label: '1 Month Notice' },
  { value: '2_months', label: '2 Months Notice' },
  { value: '3_months_plus', label: '3+ Months' }
] as const

export const TRAVEL_PERCENTAGES = [
  { value: 'no_travel', label: 'No Travel' },
  { value: 'up_to_25', label: 'Up to 25%' },
  { value: 'up_to_50', label: 'Up to 50%' },
  { value: 'up_to_75', label: 'Up to 75%' },
  { value: 'up_to_100', label: '100% (Full Travel)' }
] as const

export const WILLING_TO_RELOCATE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'for_the_right_opportunity', label: 'For the Right Opportunity' }
] as const

export const REQUIRES_SPONSORSHIP_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_applicable', label: 'Not Applicable' }
] as const

export const VOLUNTEERING_CAUSES = [
  'Animal Welfare',
  'Arts & Culture',
  'Children & Youth',
  'Civil Rights',
  'Disaster Relief',
  'Education',
  'Environment',
  'Health',
  'Homeless & Housing',
  'Human Rights',
  'Hunger',
  'Politics',
  'Poverty',
  'Science & Technology',
  'Senior Care',
  'Veterans',
  'Other'
] as const
