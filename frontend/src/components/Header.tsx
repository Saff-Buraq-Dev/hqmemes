import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'
import Button from './Button'

export default function Header() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { logout } = useAuth()

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/memes', label: 'Tous les memes' },
    { path: '/my-memes', label: 'Mes memes' },
    { path: '/upload', label: 'Upload' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-hq-blue rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-2xl">🎭</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              HQ<span className="text-hq-blue">-Memes</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="relative px-4 py-2">
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path) ? 'text-hq-blue' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-hq-blue"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Avatar
                src={user?.avatarUrl || '/avatars/avatar-1.png'}
                alt={user?.username || 'User'}
                tooltip={user?.username}
                size="md"
              />
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? 'bg-hq-blue text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

