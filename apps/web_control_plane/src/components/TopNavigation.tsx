import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

// 所有导航项（登录和未登录用户都能看到）
const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Match', href: '/match' },
  { name: 'Applications', href: '/applications' },
  { name: 'Profile', href: '/profile' },
  { name: 'Pricing', href: '/pricing' },
]

export default function TopNavigation() {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="h-nav bg-bg-primary border-b border-border-light sticky top-0 z-50">
      <div className="max-w-content mx-auto px-2xl h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-[24px] font-semibold tracking-tight text-text-primary">
            FuckWork
          </span>
        </Link>

        {/* Navigation Links - 所有用户都能看到 */}
        <div className="flex items-center gap-lg">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-body-small transition-colors duration-fast relative py-xs
                ${isActive(item.href)
                  ? 'text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {item.name}
              {/* 激活指示器 */}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-blue rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        {isAuthenticated && user ? (
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-xs text-body-small text-text-secondary hover:text-text-primary transition-colors duration-fast">
              <div className="w-[36px] h-[36px] rounded-full bg-bg-tertiary flex items-center justify-center text-label text-text-secondary uppercase">
                {user.email?.charAt(0) || 'U'}
              </div>
              <ChevronDownIcon className="w-4 h-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-fast"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-fast"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-xs w-[200px] bg-bg-primary rounded-md shadow-dropdown border border-border-light py-xs focus:outline-none">
                <div className="px-sm py-xs border-b border-border-light mb-xs">
                  <p className="text-label text-text-tertiary">Signed in as</p>
                  <p className="text-body-small text-text-primary truncate">{user.email}</p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`block px-sm py-xs text-body-small ${
                        active ? 'bg-bg-secondary text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      Settings
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`block w-full text-left px-sm py-xs text-body-small ${
                        active ? 'bg-bg-secondary text-accent-red' : 'text-accent-red'
                      }`}
                    >
                      Log out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}
