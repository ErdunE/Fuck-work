import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface FilterState {
  jobLevels: string[]
  workModes: string[]
  salaryMin: number | null
  salaryMax: number | null
  salaryDisclosed: boolean
  postedWithin: string | null
}

interface FilterDialogProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onApply: (filters: FilterState) => void
}

const jobLevelOptions = ['Intern', 'New Grad', 'Junior', 'Mid', 'Senior', 'Staff', 'Lead']
const workModeOptions = ['Remote', 'Hybrid', 'Onsite']
const postedWithinOptions = [
  { label: 'Any time', value: null },
  { label: 'Past 24 hours', value: '24h' },
  { label: 'Past week', value: '7d' },
  { label: 'Past month', value: '30d' },
]

export default function FilterDialog({ isOpen, onClose, filters, onApply }: FilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  // Sync local state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
    }
  }, [isOpen, filters])

  const handleJobLevelToggle = (level: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      jobLevels: prev.jobLevels.includes(level)
        ? prev.jobLevels.filter((l) => l !== level)
        : [...prev.jobLevels, level],
    }))
  }

  const handleWorkModeToggle = (mode: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      workModes: prev.workModes.includes(mode)
        ? prev.workModes.filter((m) => m !== mode)
        : [...prev.workModes, mode],
    }))
  }

  const handleReset = () => {
    setLocalFilters({
      jobLevels: [],
      workModes: [],
      salaryMin: null,
      salaryMax: null,
      salaryDisclosed: false,
      postedWithin: null,
    })
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-[560px] bg-bg-primary rounded-lg shadow-dropdown p-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-lg">
                  <Dialog.Title className="text-section-title text-text-primary">
                    Filters
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-xs rounded-md hover:bg-bg-secondary transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Filter Sections */}
                <div className="space-y-lg">
                  {/* Job Level */}
                  <div>
                    <h4 className="text-card-title text-text-primary mb-sm">Job Level</h4>
                    <div className="flex flex-wrap gap-xs">
                      {jobLevelOptions.map((level) => (
                        <button
                          key={level}
                          onClick={() => handleJobLevelToggle(level)}
                          className={`px-sm py-xs rounded-full text-body-small transition-colors ${
                            localFilters.jobLevels.includes(level)
                              ? 'bg-accent-blue text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-border-default'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Work Mode */}
                  <div>
                    <h4 className="text-card-title text-text-primary mb-sm">Work Mode</h4>
                    <div className="flex flex-wrap gap-xs">
                      {workModeOptions.map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleWorkModeToggle(mode)}
                          className={`px-sm py-xs rounded-full text-body-small transition-colors ${
                            localFilters.workModes.includes(mode)
                              ? 'bg-accent-blue text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-border-default'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <h4 className="text-card-title text-text-primary mb-sm">Salary Range</h4>
                    <div className="flex items-center gap-sm">
                      <input
                        type="number"
                        placeholder="Min"
                        value={localFilters.salaryMin || ''}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            salaryMin: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                        className="input w-[120px]"
                      />
                      <span className="text-text-tertiary">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={localFilters.salaryMax || ''}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            salaryMax: e.target.value ? parseInt(e.target.value) : null,
                          }))
                        }
                        className="input w-[120px]"
                      />
                    </div>
                    <label className="flex items-center gap-xs mt-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFilters.salaryDisclosed}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            salaryDisclosed: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-border-default text-accent-blue focus:ring-accent-blue"
                      />
                      <span className="text-body-small text-text-secondary">
                        Only show jobs with disclosed salary
                      </span>
                    </label>
                  </div>

                  {/* Posted Within */}
                  <div>
                    <h4 className="text-card-title text-text-primary mb-sm">Posted Within</h4>
                    <div className="flex flex-wrap gap-xs">
                      {postedWithinOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() =>
                            setLocalFilters((prev) => ({ ...prev, postedWithin: option.value }))
                          }
                          className={`px-sm py-xs rounded-full text-body-small transition-colors ${
                            localFilters.postedWithin === option.value
                              ? 'bg-accent-blue text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:bg-border-default'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-xl pt-lg border-t border-border-light">
                  <button onClick={handleReset} className="btn-text">
                    Reset all
                  </button>
                  <button onClick={handleApply} className="btn-primary">
                    Apply Filters
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
