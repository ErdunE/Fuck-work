// Personal Info
export interface PersonalInfo {
  first_name: string
  last_name: string
  preferred_name?: string
  email: string
  phone: string
  phone_country_code: string
  address_line1?: string
  address_line2?: string
  city: string
  state: string
  zip_code?: string
  country: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  other_url?: string
  professional_summary?: string
}

// Resume
export interface ResumeFile {
  id: string
  name: string
  file_url: string
  is_default: boolean
  uploaded_at: string
}

export interface CoverLetterTemplate {
  id: string
  name: string
  file_url: string
  uploaded_at: string
}

// Experience
export interface WorkExperience {
  id: string
  job_title: string
  company_name: string
  employment_type:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'internship'
    | 'freelance'
  location?: string
  location_type?: 'on-site' | 'remote' | 'hybrid'
  start_date: string // YYYY-MM format
  end_date?: string
  is_current: boolean
  description?: string
  skills_used?: string[]
}

// Education
export interface EducationEntry {
  id: string
  school_name: string
  degree:
    | 'high-school'
    | 'associate'
    | 'bachelor'
    | 'master'
    | 'mba'
    | 'phd'
    | 'other'
  field_of_study: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  gpa?: string
  honors?: string
  relevant_coursework?: string
  activities?: string
}

// Skills
export interface LanguageProficiency {
  id: string
  language: string
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic'
}

export interface Skills {
  programming_languages: string[]
  frameworks: string[]
  databases: string[]
  cloud_devops: string[]
  tools: string[]
  other_technical: string[]
  soft_skills: string[]
  languages: LanguageProficiency[]
}

// Achievements - Projects
export interface Project {
  id: string
  name: string
  role?: string
  start_date?: string
  end_date?: string
  is_ongoing: boolean
  project_url?: string
  repository_url?: string
  description?: string
  technologies: string[]
}

// Achievements - Certifications
export interface Certification {
  id: string
  name: string
  issuing_organization: string
  issue_date?: string
  expiration_date?: string
  no_expiration: boolean
  credential_id?: string
  credential_url?: string
}

// Achievements - Awards
export interface Award {
  id: string
  name: string
  issuing_organization?: string
  date_received?: string
  description?: string
}

// Achievements - Publications
export interface Publication {
  id: string
  title: string
  publisher?: string
  publication_date?: string
  url?: string
  description?: string
  authors?: string
}

// Achievements - Volunteering
export interface Volunteering {
  id: string
  organization: string
  role: string
  cause?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  description?: string
}

// Preferences
export interface JobPreferences {
  // Job preferences
  desired_job_titles: string[]
  desired_industries: string[]
  desired_company_sizes: string[]

  // Salary
  salary_min?: number
  salary_max?: number
  salary_currency: string
  salary_period: 'yearly' | 'monthly' | 'hourly'
  salary_negotiable: boolean

  // Location
  preferred_locations: string[]
  work_mode_preference: string[]
  willing_to_relocate: 'yes' | 'no' | 'for-right-opportunity'
  relocation_locations: string[]

  // Employment
  employment_types: string[]
  available_start_date:
    | 'immediately'
    | '2-weeks'
    | '1-month'
    | '2-months'
    | '3-months-plus'
  willing_to_travel: 'no' | '25' | '50' | '75' | '100'

  // Work Authorization
  authorized_us: boolean
  require_sponsorship: 'yes' | 'no' | 'not-applicable'
  work_authorization_status?: string
  authorized_other_countries: string[]

  // ATS Common Questions
  is_18_or_older: boolean
  has_drivers_license: boolean
  has_reliable_transportation: boolean
  willing_background_check: boolean
  willing_drug_test: boolean

  // EEO (optional, prefer not to say available)
  veteran_status?: 'veteran' | 'not-veteran' | 'prefer-not-to-say'
  disability_status?: 'yes' | 'no' | 'prefer-not-to-say'
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  race_ethnicity?: string[]
}

// Complete Profile
export interface UserProfile {
  personal_info: PersonalInfo
  resumes: ResumeFile[]
  cover_letters: CoverLetterTemplate[]
  experiences: WorkExperience[]
  education: EducationEntry[]
  skills: Skills
  projects: Project[]
  certifications: Certification[]
  awards: Award[]
  publications: Publication[]
  volunteering: Volunteering[]
  preferences: JobPreferences
  onboarding_completed: boolean
  profile_completion_percentage: number
}
