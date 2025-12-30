// =============================================================================
// Profile API Service - Phase 7.0
// Dedicated API methods for all Profile-related endpoints
// =============================================================================

import api from './api'
import type {
  ProfilePersonalInfo,
  FullProfile,
  Experience,
  ExperienceListResponse,
  Education,
  EducationListResponse,
  Skill,
  SkillListResponse,
  Language,
  LanguageListResponse,
  Project,
  ProjectListResponse,
  Certification,
  CertificationListResponse,
  Award,
  AwardListResponse,
  Publication,
  PublicationListResponse,
  Volunteering,
  VolunteeringListResponse,
  JobPreferences,
  Resume,
  ResumeListResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ExperienceFormData,
  EducationFormData,
  ProjectFormData,
  CertificationFormData,
  AwardFormData,
  PublicationFormData,
  VolunteeringFormData,
  LanguageFormData,
} from '../types/profile'

// =============================================================================
// Profile / Personal Info
// =============================================================================

export async function getFullProfile(): Promise<FullProfile> {
  const response = await api.client.get('/api/users/me/profile')
  return response.data
}

export async function getPersonalInfo(): Promise<ProfilePersonalInfo> {
  const response = await api.client.get('/api/users/me/profile/personal-info')
  return response.data
}

export async function updatePersonalInfo(
  data: Partial<Omit<ProfilePersonalInfo, 'id' | 'user_id'>>
): Promise<ProfilePersonalInfo> {
  const response = await api.client.put('/api/users/me/profile', data)
  return response.data
}

// =============================================================================
// Resume & Cover Letter
// =============================================================================

export async function getResumes(): Promise<ResumeListResponse> {
  const response = await api.client.get('/api/users/me/resumes')
  return response.data
}

export async function getPresignedUploadUrl(
  data: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  const response = await api.client.post('/api/users/me/resumes/presigned-url', data)
  return response.data
}

export async function createResume(data: {
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  is_default: boolean
  is_cover_letter: boolean
}): Promise<Resume> {
  const response = await api.client.post('/api/users/me/resumes', data)
  return response.data
}

export async function setDefaultResume(resumeId: number): Promise<Resume> {
  const response = await api.client.put(`/api/users/me/resumes/${resumeId}/set-default`)
  return response.data
}

export async function deleteResume(resumeId: number): Promise<void> {
  await api.client.delete(`/api/users/me/resumes/${resumeId}`)
}

export async function getResumeDownloadUrl(resumeId: number): Promise<{ download_url: string }> {
  const response = await api.client.get(`/api/users/me/resumes/${resumeId}/download-url`)
  return response.data
}

// =============================================================================
// Experience
// =============================================================================

export async function getExperience(): Promise<ExperienceListResponse> {
  const response = await api.client.get('/api/users/me/experience')
  return response.data
}

export async function createExperience(data: ExperienceFormData): Promise<Experience> {
  const response = await api.client.post('/api/users/me/experience', data)
  return response.data
}

export async function updateExperience(
  id: number,
  data: Partial<ExperienceFormData>
): Promise<Experience> {
  const response = await api.client.put(`/api/users/me/experience/${id}`, data)
  return response.data
}

export async function deleteExperience(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/experience/${id}`)
}

// =============================================================================
// Education
// =============================================================================

export async function getEducation(): Promise<EducationListResponse> {
  const response = await api.client.get('/api/users/me/education')
  return response.data
}

export async function createEducation(data: EducationFormData): Promise<Education> {
  const response = await api.client.post('/api/users/me/education', data)
  return response.data
}

export async function updateEducation(
  id: number,
  data: Partial<EducationFormData>
): Promise<Education> {
  const response = await api.client.put(`/api/users/me/education/${id}`, data)
  return response.data
}

export async function deleteEducation(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/education/${id}`)
}

// =============================================================================
// Skills
// =============================================================================

export async function getSkills(): Promise<SkillListResponse> {
  const response = await api.client.get('/api/users/me/skills')
  return response.data
}

export async function createSkill(skill_name: string): Promise<Skill> {
  const response = await api.client.post('/api/users/me/skills', { skill_name })
  return response.data
}

export async function bulkUpdateSkills(skills: string[]): Promise<SkillListResponse> {
  const response = await api.client.post('/api/users/me/skills/bulk', { skills })
  return response.data
}

export async function deleteSkill(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/skills/${id}`)
}

export async function deleteSkillByName(skillName: string): Promise<void> {
  await api.client.delete(`/api/users/me/skills/by-name/${encodeURIComponent(skillName)}`)
}

// =============================================================================
// Languages
// =============================================================================

export async function getLanguages(): Promise<LanguageListResponse> {
  const response = await api.client.get('/api/users/me/languages')
  return response.data
}

export async function createLanguage(data: LanguageFormData): Promise<Language> {
  const response = await api.client.post('/api/users/me/languages', data)
  return response.data
}

export async function bulkUpdateLanguages(
  languages: LanguageFormData[]
): Promise<LanguageListResponse> {
  const response = await api.client.post('/api/users/me/languages/bulk', { languages })
  return response.data
}

export async function deleteLanguage(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/languages/${id}`)
}

// =============================================================================
// Projects
// =============================================================================

export async function getProjects(): Promise<ProjectListResponse> {
  const response = await api.client.get('/api/users/me/projects')
  return response.data
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const response = await api.client.post('/api/users/me/projects', data)
  return response.data
}

export async function updateProject(
  id: number,
  data: Partial<ProjectFormData>
): Promise<Project> {
  const response = await api.client.put(`/api/users/me/projects/${id}`, data)
  return response.data
}

export async function deleteProject(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/projects/${id}`)
}

// =============================================================================
// Certifications
// =============================================================================

export async function getCertifications(): Promise<CertificationListResponse> {
  const response = await api.client.get('/api/users/me/certifications')
  return response.data
}

export async function createCertification(data: CertificationFormData): Promise<Certification> {
  const response = await api.client.post('/api/users/me/certifications', data)
  return response.data
}

export async function updateCertification(
  id: number,
  data: Partial<CertificationFormData>
): Promise<Certification> {
  const response = await api.client.put(`/api/users/me/certifications/${id}`, data)
  return response.data
}

export async function deleteCertification(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/certifications/${id}`)
}

// =============================================================================
// Awards
// =============================================================================

export async function getAwards(): Promise<AwardListResponse> {
  const response = await api.client.get('/api/users/me/awards')
  return response.data
}

export async function createAward(data: AwardFormData): Promise<Award> {
  const response = await api.client.post('/api/users/me/awards', data)
  return response.data
}

export async function updateAward(
  id: number,
  data: Partial<AwardFormData>
): Promise<Award> {
  const response = await api.client.put(`/api/users/me/awards/${id}`, data)
  return response.data
}

export async function deleteAward(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/awards/${id}`)
}

// =============================================================================
// Publications
// =============================================================================

export async function getPublications(): Promise<PublicationListResponse> {
  const response = await api.client.get('/api/users/me/publications')
  return response.data
}

export async function createPublication(data: PublicationFormData): Promise<Publication> {
  const response = await api.client.post('/api/users/me/publications', data)
  return response.data
}

export async function updatePublication(
  id: number,
  data: Partial<PublicationFormData>
): Promise<Publication> {
  const response = await api.client.put(`/api/users/me/publications/${id}`, data)
  return response.data
}

export async function deletePublication(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/publications/${id}`)
}

// =============================================================================
// Volunteering
// =============================================================================

export async function getVolunteering(): Promise<VolunteeringListResponse> {
  const response = await api.client.get('/api/users/me/volunteering')
  return response.data
}

export async function createVolunteering(data: VolunteeringFormData): Promise<Volunteering> {
  const response = await api.client.post('/api/users/me/volunteering', data)
  return response.data
}

export async function updateVolunteering(
  id: number,
  data: Partial<VolunteeringFormData>
): Promise<Volunteering> {
  const response = await api.client.put(`/api/users/me/volunteering/${id}`, data)
  return response.data
}

export async function deleteVolunteering(id: number): Promise<void> {
  await api.client.delete(`/api/users/me/volunteering/${id}`)
}

// =============================================================================
// Job Preferences
// =============================================================================

export async function getJobPreferences(): Promise<JobPreferences> {
  const response = await api.client.get('/api/users/me/job-preferences')
  return response.data
}

export async function updateJobPreferences(
  data: Partial<Omit<JobPreferences, 'id' | 'user_id'>>
): Promise<JobPreferences> {
  const response = await api.client.put('/api/users/me/job-preferences', data)
  return response.data
}

// Partial update endpoints
export async function updateCompensationPreferences(data: {
  min_salary?: number | null
  max_salary?: number | null
  salary_currency?: string
  salary_period?: string
  salary_negotiable?: boolean
}): Promise<Record<string, unknown>> {
  const response = await api.client.put('/api/users/me/job-preferences/compensation', data)
  return response.data
}

export async function updateWorkAuthorizationPreferences(data: {
  work_auth_countries?: string[] | null
  requires_sponsorship?: string | null
}): Promise<Record<string, unknown>> {
  const response = await api.client.put('/api/users/me/job-preferences/work-authorization', data)
  return response.data
}

export async function updateEEOPreferences(data: {
  eeo_gender?: string | null
  eeo_sexual_orientation?: string | null
  eeo_veteran_status?: string | null
  eeo_disability_status?: string | null
  eeo_race_ethnicity?: string[] | null
}): Promise<Record<string, unknown>> {
  const response = await api.client.put('/api/users/me/job-preferences/eeo', data)
  return response.data
}

export async function updateApplicationQuestions(data: {
  age_over_18?: boolean | null
  has_drivers_license?: boolean | null
  has_reliable_transportation?: boolean | null
  background_check_consent?: boolean | null
  drug_test_consent?: boolean | null
}): Promise<Record<string, unknown>> {
  const response = await api.client.put('/api/users/me/job-preferences/application-questions', data)
  return response.data
}

// =============================================================================
// Export all as profileApi object for convenience
// =============================================================================

const profileApi = {
  // Profile
  getFullProfile,
  getPersonalInfo,
  updatePersonalInfo,
  
  // Resume
  getResumes,
  getPresignedUploadUrl,
  createResume,
  setDefaultResume,
  deleteResume,
  getResumeDownloadUrl,
  
  // Experience
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  
  // Education
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  
  // Skills
  getSkills,
  createSkill,
  bulkUpdateSkills,
  deleteSkill,
  deleteSkillByName,
  
  // Languages
  getLanguages,
  createLanguage,
  bulkUpdateLanguages,
  deleteLanguage,
  
  // Projects
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  
  // Certifications
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  
  // Awards
  getAwards,
  createAward,
  updateAward,
  deleteAward,
  
  // Publications
  getPublications,
  createPublication,
  updatePublication,
  deletePublication,
  
  // Volunteering
  getVolunteering,
  createVolunteering,
  updateVolunteering,
  deleteVolunteering,
  
  // Job Preferences
  getJobPreferences,
  updateJobPreferences,
  updateCompensationPreferences,
  updateWorkAuthorizationPreferences,
  updateEEOPreferences,
  updateApplicationQuestions,
}

export default profileApi
