import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SortDropdown({ value, onChange }: Props) {
  const options = [
    { value: 'newest', label: 'Newest First' },
    { value: 'highest_score', label: 'Highest Score' },
    { value: 'highest_salary', label: 'Highest Salary' }
  ]
  
  const currentLabel = options.find(o => o.value === value)?.label || 'Sort by'
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="inline-flex items-center gap-2 h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition">
        {currentLabel}
        <ChevronDownIcon className="w-4 h-4" />
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-medium border border-slate-200 focus:outline-none">
          <div className="p-1">
            {options.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(option.value)}
                    className={`${
                      active ? 'bg-slate-100' : ''
                    } ${
                      value === option.value ? 'text-primary-600 font-medium' : 'text-slate-700'
                    } group flex w-full items-center justify-between rounded-md px-4 py-2 text-sm transition`}
                  >
                    {option.label}
                    {value === option.value && (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

