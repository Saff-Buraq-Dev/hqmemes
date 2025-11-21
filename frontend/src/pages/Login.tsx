import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { signOut, getCurrentUser } from 'aws-amplify/auth'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../stores/authStore'
import Input from '../components/Input'
import Button from '../components/Button'
import { isValidEmail } from '../utils/validation'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()
  const successMessage = location.state?.message
  const emailFromState = location.state?.email || ''
  
  const [email, setEmail] = useState(emailFromState)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const { login, isLoading } = useAuth()

  // Display success message if coming from confirmation
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      // Clear the state to avoid re-showing on refresh
      window.history.replaceState({}, document.title)
    }
  }, [successMessage])

  // Check for existing Cognito session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getCurrentUser()
        const { fetchAuthSession } = await import('aws-amplify/auth')
        const session = await fetchAuthSession()
        
        // User is already signed in with Cognito - auto-login
        if (session.tokens?.idToken) {
          const idToken = session.tokens.idToken.toString()
          
          // Get user data from backend
          try {
            const { authService } = await import('../services/authService')
            const userData = await authService.getOrCreateUser(idToken)
            
            // Update store and redirect
            const { setAuth } = useAuthStore.getState()
            setAuth(
              {
                userId: user.userId,
                email: userData.email,
                username: userData.username,
                avatarUrl: userData.avatarUrl,
              },
              idToken
            )
            
            navigate('/')
          } catch (error) {
            // Backend error, sign out and allow normal login
            console.error('Auto-login failed, signing out:', error)
            await signOut()
            clearAuth()
          }
        }
      } catch {
        // No existing session, normal login flow
      } finally {
        setIsCheckingSession(false)
      }
    }
    
    checkSession()
  }, [navigate, clearAuth])

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email requis'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide'
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (validate()) {
      login(
        { email, password },
        {
          onError: (error: any) => {
            console.error('Login error:', error)
            
            // Handle specific Cognito errors
            if (error.name === 'UserNotConfirmedException') {
              setErrors({ general: 'Compte non confirmé. Vérifiez votre email.' })
            } else if (error.name === 'NotAuthorizedException') {
              setErrors({ general: 'Email ou mot de passe incorrect.' })
            } else if (error.name === 'UserNotFoundException') {
              setErrors({ general: 'Aucun compte avec cet email.' })
            } else {
              setErrors({ general: error.message || 'Erreur de connexion. Veuillez réessayer.' })
            }
          }
        }
      )
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hq-blue-50 via-white to-hq-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-hq-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hq-blue-50 via-white to-hq-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-hq-blue rounded-2xl mb-4">
            <span className="text-4xl">🎭</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue sur <span className="text-hq-blue">HQ-Memes</span>
          </h1>
          <p className="text-gray-600 mt-2">Connectez-vous pour partager vos memes</p>
        </div>

        {/* Form */}
        <div className="card">
          {errors.general && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              ❌ {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="text-hq-blue font-medium hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

