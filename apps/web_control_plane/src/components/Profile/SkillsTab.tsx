import { useState, useEffect, useCallback } from 'react'
import {
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  LightBulbIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline'
import profileApi from '../../services/profileApi'
import type { Skill, Language } from '../../types/profile'
import { LANGUAGE_PROFICIENCIES } from '../../types/profile'

// ============================================================================
// Constants
// ============================================================================

// 跨行业通用热门技能（按字母排序）
const POPULAR_SKILLS = [
  // 通用职业技能
  'Communication',
  'Leadership',
  'Problem Solving',
  'Project Management',
  'Teamwork',
  'Time Management',
  'Critical Thinking',
  'Adaptability',
  'Creativity',
  'Negotiation',

  // 商业技能
  'Data Analysis',
  'Strategic Planning',
  'Budget Management',
  'Sales',
  'Marketing',
  'Customer Service',
  'Business Development',
  'Financial Analysis',
  'Market Research',
  'Presentation',

  // 技术通用
  'Microsoft Office',
  'Excel',
  'PowerPoint',
  'Google Workspace',
  'CRM Software',
  'ERP Systems',

  // 管理技能
  'Team Management',
  'Performance Management',
  'Conflict Resolution',
  'Decision Making',
  'Mentoring',
  'Change Management',
]

// 初始显示的技能数量
const INITIAL_SKILLS_SHOWN = 12

// 语言列表
const LANGUAGES_LIST = [
  'English',
  'Spanish',
  'Mandarin Chinese',
  'Hindi',
  'Arabic',
  'Portuguese',
  'Bengali',
  'Russian',
  'Japanese',
  'French',
  'German',
  'Korean',
  'Italian',
  'Turkish',
  'Vietnamese',
  'Polish',
  'Dutch',
  'Thai',
  'Indonesian',
  'Greek',
  'Czech',
  'Swedish',
  'Romanian',
  'Hungarian',
  'Hebrew',
  'Danish',
  'Finnish',
  'Norwegian',
  'Ukrainian',
  'Cantonese',
  'Taiwanese',
  'Other',
]

// 语言熟练度 (匹配后端格式)
const PROFICIENCY_LEVELS = LANGUAGE_PROFICIENCIES.map((p) => ({
  value: p,
  label: p,
}))

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
// Tip Component
// ============================================================================

interface TipProps {
  children: React.ReactNode
}

function Tip({ children }: TipProps) {
  return (
    <div className="mt-xl flex items-start gap-sm p-md bg-accent-blue/5 rounded-xl">
      <LightBulbIcon className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
      <p className="text-body-small text-text-secondary">{children}</p>
    </div>
  )
}

// ============================================================================
// Skill Tag Component
// ============================================================================

interface SkillTagProps {
  skill: Skill
  onRemove: () => void
  isRemoving?: boolean
}

function SkillTag({ skill, onRemove, isRemoving }: SkillTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-md py-xs bg-accent-blue/10 text-accent-blue rounded-full text-body-small">
      {skill.skill_name}
      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        className="hover:bg-accent-blue/20 rounded-full p-0.5 transition-colors disabled:opacity-50"
      >
        <XMarkIcon className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

// ============================================================================
// Quick Add Button Component
// ============================================================================

interface QuickAddButtonProps {
  skill: string
  onAdd: () => void
  disabled?: boolean
}

function QuickAddButton({ skill, onAdd, disabled }: QuickAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1 px-md py-xs border rounded-full text-body-small
        transition-colors
        ${
          disabled
            ? 'border-border-light text-text-tertiary cursor-not-allowed opacity-50'
            : 'border-border-default text-text-secondary hover:bg-bg-secondary hover:border-border-default'
        }
      `}
    >
      <PlusIcon className="w-3.5 h-3.5" />
      {skill}
    </button>
  )
}

// ============================================================================
// Language Card Component
// ============================================================================

interface LanguageCardProps {
  language: Language
  onDelete: () => void
  isDeleting?: boolean
}

function LanguageCard({ language, onDelete, isDeleting }: LanguageCardProps) {
  const getProficiencyColor = (value: string | null) => {
    switch (value) {
      case 'Native':
        return 'bg-accent-green/10 text-accent-green'
      case 'Fluent':
        return 'bg-accent-blue/10 text-accent-blue'
      case 'Professional':
        return 'bg-accent-purple/10 text-accent-purple'
      case 'Conversational':
        return 'bg-accent-yellow/10 text-accent-yellow'
      case 'Basic':
        return 'bg-bg-tertiary text-text-secondary'
      default:
        return 'bg-bg-tertiary text-text-secondary'
    }
  }

  return (
    <div className="flex items-center justify-between p-md border border-border-light rounded-xl hover:border-border-default transition-colors">
      <div className="flex items-center gap-md">
        <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center">
          <LanguageIcon className="w-5 h-5 text-text-tertiary" />
        </div>
        <div>
          <p className="text-body text-text-primary font-medium">
            {language.language_name}
          </p>
          {language.proficiency && (
            <span
              className={`inline-block mt-xs px-sm py-0.5 rounded-full text-label ${getProficiencyColor(language.proficiency)}`}
            >
              {language.proficiency}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="p-2 text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors disabled:opacity-50"
        title="Remove language"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function SkillsTab() {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [showAllSkills, setShowAllSkills] = useState(false)

  // Languages state
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedProficiency, setSelectedProficiency] = useState('Professional')

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [skillsResponse, languagesResponse] = await Promise.all([
        profileApi.getSkills(),
        profileApi.getLanguages(),
      ])

      setSkills(skillsResponse.skills || [])
      setLanguages(languagesResponse.languages || [])
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load skills and languages. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Skills handlers
  const addSkill = async (skillName: string) => {
    const trimmed = skillName.trim()
    if (!trimmed || skills.find((s) => s.skill_name === trimmed)) {
      setSkillInput('')
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const newSkill = await profileApi.createSkill(trimmed)
      setSkills((prev) => [...prev, newSkill])
      setSkillInput('')
    } catch (err) {
      console.error('Failed to add skill:', err)
      setError('Failed to add skill. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeSkill = async (skill: Skill) => {
    try {
      setIsSaving(true)
      setError(null)
      await profileApi.deleteSkill(skill.id)
      setSkills((prev) => prev.filter((s) => s.id !== skill.id))
    } catch (err) {
      console.error('Failed to remove skill:', err)
      setError('Failed to remove skill. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (skillInput.trim()) {
        addSkill(skillInput)
      }
    }
  }

  // Languages handlers
  const addLanguage = async () => {
    if (!selectedLanguage || languages.find((l) => l.language_name === selectedLanguage)) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const newLanguage = await profileApi.createLanguage({
        language_name: selectedLanguage,
        proficiency: selectedProficiency,
      })
      setLanguages((prev) => [...prev, newLanguage])
      setSelectedLanguage('')
      setSelectedProficiency('Professional')
    } catch (err) {
      console.error('Failed to add language:', err)
      setError('Failed to add language. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeLanguage = async (language: Language) => {
    try {
      setIsSaving(true)
      setError(null)
      await profileApi.deleteLanguage(language.id)
      setLanguages((prev) => prev.filter((l) => l.id !== language.id))
    } catch (err) {
      console.error('Failed to remove language:', err)
      setError('Failed to remove language. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Get skill names for comparison
  const skillNames = skills.map((s) => s.skill_name)

  // Filter quick add skills (exclude already added)
  const availableQuickSkills = POPULAR_SKILLS.filter((s) => !skillNames.includes(s))
  const displayedQuickSkills = showAllSkills
    ? availableQuickSkills
    : availableQuickSkills.slice(0, INITIAL_SKILLS_SHOWN)

  // Filter available languages (exclude already added)
  const languageNames = languages.map((l) => l.language_name)
  const availableLanguages = LANGUAGES_LIST.filter(
    (lang) => !languageNames.includes(lang)
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-12 bg-bg-tertiary rounded mt-xl" />
          <div className="flex flex-wrap gap-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 bg-bg-tertiary rounded-full" />
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
        <h2 className="text-section-title text-text-primary">Skills</h2>
        <p className="text-body-small text-text-secondary mt-xs">
          Showcase your expertise and capabilities to potential employers
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-lg p-md bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <p className="text-body-small text-accent-red">{error}</p>
        </div>
      )}

      {/* YOUR SKILLS Section */}
      <SectionTitle first>Your Skills</SectionTitle>

      <p className="text-body-small text-text-secondary mb-md">
        Add skills that highlight your professional expertise. Include both
        technical and soft skills relevant to your career.
      </p>

      {/* Skill Input */}
      <div className="mb-md">
        <div className="min-h-[48px] px-sm border border-border-default rounded-md flex items-center gap-sm bg-bg-primary transition-colors focus-within:border-accent-blue">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type a skill and press Enter..."
            disabled={isSaving}
            className="flex-1 h-[32px] border-0 p-0 focus:ring-0 focus:outline-none text-body-small bg-transparent placeholder:text-text-tertiary disabled:opacity-50"
          />
          {skillInput && (
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              disabled={isSaving}
              className="btn-primary py-xs px-sm text-label disabled:opacity-50"
            >
              {isSaving ? '...' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {/* Added Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-sm mb-lg">
          {skills.map((skill) => (
            <SkillTag
              key={skill.id}
              skill={skill}
              onRemove={() => removeSkill(skill)}
              isRemoving={isSaving}
            />
          ))}
        </div>
      )}

      {/* Quick Add */}
      {availableQuickSkills.length > 0 && (
        <div className="mb-lg">
          <p className="text-label text-text-tertiary mb-sm">
            Quick add popular skills:
          </p>
          <div className="flex flex-wrap gap-sm">
            {displayedQuickSkills.map((skill) => (
              <QuickAddButton
                key={skill}
                skill={skill}
                onAdd={() => addSkill(skill)}
                disabled={isSaving}
              />
            ))}
          </div>

          {availableQuickSkills.length > INITIAL_SKILLS_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAllSkills(!showAllSkills)}
              className="mt-sm flex items-center gap-1 text-body-small text-accent-blue hover:text-accent-blue-dark transition-colors"
            >
              {showAllSkills ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Show {availableQuickSkills.length - INITIAL_SKILLS_SHOWN} more
                  skills
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* LANGUAGES Section */}
      <SectionTitle>Languages</SectionTitle>

      <p className="text-body-small text-text-secondary mb-md">
        Add languages you speak and your proficiency level
      </p>

      {/* Language List */}
      {languages.length > 0 && (
        <div className="space-y-sm mb-lg">
          {languages.map((language) => (
            <LanguageCard
              key={language.id}
              language={language}
              onDelete={() => removeLanguage(language)}
              isDeleting={isSaving}
            />
          ))}
        </div>
      )}

      {/* Add Language Form */}
      <div className="flex flex-col sm:flex-row gap-sm mb-lg">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={isSaving}
          className="input flex-1 disabled:opacity-50"
        >
          <option value="">Select language...</option>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <select
          value={selectedProficiency}
          onChange={(e) => setSelectedProficiency(e.target.value)}
          disabled={isSaving}
          className="input sm:w-48 disabled:opacity-50"
        >
          {PROFICIENCY_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={addLanguage}
          disabled={!selectedLanguage || isSaving}
          className="btn-secondary flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          {isSaving ? '...' : 'Add'}
        </button>
      </div>

      {/* Empty State for Languages */}
      {languages.length === 0 && (
        <p className="text-body-small text-text-tertiary text-center py-md">
          No languages added yet
        </p>
      )}

      {/* Tip */}
      <Tip>
        List skills that are most relevant to your target roles. Quality over
        quantity — focus on skills you can confidently discuss in an interview.
        For languages, be honest about your proficiency level.
      </Tip>
    </div>
  )
}