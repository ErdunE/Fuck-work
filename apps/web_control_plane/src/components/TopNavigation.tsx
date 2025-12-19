import { Menu, Transition } from '@headlessui/react'
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function TopNavigation() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <nav className="h-16 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="text-xl font-semibold text-slate-900">
          FuckWork
        </div>
        
        {/* User Menu */}
        {user && (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition">
              <UserCircleIcon className="w-6 h-6" />
              <span>{user.email}</span>
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
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-medium border border-slate-200 focus:outline-none">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-slate-100' : ''
                        } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700`}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </nav>
  )
}

