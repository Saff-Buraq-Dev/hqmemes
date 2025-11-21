import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/Input'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import { isValidEmail, isValidPassword, isValidUsername, getPasswordStrength } from '../utils/validation'
import { DEFAULT_AVATARS } from '../utils/constants'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0])
  const [avatarTab, setAvatarTab] = useState<'preset' | 'upload'>('preset')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; general?: string }>({})
  const { signup, isLoading } = useAuth()

  const passwordStrength = password ? getPasswordStrength(password) : null

  // Auto-fill username from email (only if not manually edited)
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail)
    
    if (!isUsernameManuallyEdited && newEmail.includes('@')) {
      const autoUsername = newEmail.split('@')[0]
      setUsername(autoUsername)
    }
  }

  // Mark username as manually edited when user types in it
  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername)
    if (newUsername !== email.split('@')[0]) {
      setIsUsernameManuallyEdited(true)
    }
  }

  const validate = () => {
    const newErrors: { email?: string; password?: string; username?: string } = {}

    if (!email) {
      newErrors.email = 'Email requis'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide'
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis'
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Minimum 8 caractères, 1 lettre et 1 chiffre'
    }

    // Username is now required since it auto-fills
    if (!username) {
      newErrors.username = 'Nom d\'utilisateur requis'
    } else if (!isValidUsername(username)) {
      newErrors.username = '3-20 caractères alphanumériques'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleTabChange = (tab: 'preset' | 'upload') => {
    setAvatarTab(tab)
    // Clear upload preview when switching to preset
    if (tab === 'preset') {
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!validate()) return

    let finalAvatarUrl = selectedAvatar

    // If user uploaded a custom avatar, store it temporarily
    if (avatarTab === 'upload' && avatarFile) {
      try {
        // Convert image to base64 for temporary storage
        const reader = new FileReader()
        await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
        
        // Store in localStorage to upload after first login
        localStorage.setItem('hqmemes-pending-custom-avatar', JSON.stringify({
          dataUrl: reader.result,
          filename: avatarFile.name,
          type: avatarFile.type,
        }))
        
        // Use a special marker to indicate custom avatar pending
        finalAvatarUrl = '__CUSTOM_AVATAR_PENDING__'
      } catch (error) {
        console.error('Failed to prepare avatar:', error)
        toast.error('Erreur lors de la préparation de l\'avatar')
        return
      }
    }

    // Send all user info including avatar URL (or marker for custom)
    signup(
      { email, password, username, avatarUrl: finalAvatarUrl },
      {
        onError: (error: any) => {
          console.error('Signup error:', error)
          
          // Handle specific Cognito errors
          if (error.name === 'UsernameExistsException') {
            setErrors({ general: 'Un compte avec cet email existe déjà.' })
          } else if (error.name === 'InvalidPasswordException') {
            setErrors({ general: 'Le mot de passe ne respecte pas les critères.' })
          } else {
            setErrors({ general: error.message || 'Erreur d\'inscription. Veuillez réessayer.' })
          }
        }
      }
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
            Rejoindre <span className="text-hq-blue">HQ-Memes</span>
          </h1>
          <p className="text-gray-600 mt-2">Créez votre compte en quelques secondes</p>
        </div>

        {/* Form */}
        <div className="card">
          {errors.general && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              ❌ {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Selection */}
            <div>
              <label className="label">Avatar</label>
              
              {/* Preview */}
              <div className="flex items-center gap-4 mb-3">
                <Avatar 
                  src={
                    avatarTab === 'upload' && avatarPreview 
                      ? avatarPreview 
                      : selectedAvatar
                  } 
                  alt="Selected avatar" 
                  size="xl" 
                />
                <p className="text-sm text-gray-600">
                  {avatarTab === 'upload' && avatarFile 
                    ? `Image uploadée : ${avatarFile.name}`
                    : 'Choisissez un avatar par défaut ou uploadez le vôtre'
                  }
                </p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-3 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => handleTabChange('preset')}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    avatarTab === 'preset'
                      ? 'border-hq-blue text-hq-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Par défaut
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('upload')}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    avatarTab === 'upload'
                      ? 'border-hq-blue text-hq-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload personnalisé
                </button>
              </div>

              {/* Tab Content */}
              {avatarTab === 'preset' ? (
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`p-2 rounded-lg transition-all ${
                        selectedAvatar === avatar
                          ? 'ring-4 ring-hq-blue bg-hq-blue-50'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Avatar src={avatar} alt="Avatar option" size="md" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {avatarPreview ? (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Avatar src={avatarPreview} alt="Preview" size="lg" />
                      </div>
                      <p className="text-sm text-gray-600">{avatarFile?.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null)
                          setAvatarPreview(null)
                        }}
                      >
                        Changer l'image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <label className="cursor-pointer">
                        <span className="text-hq-blue hover:underline font-medium text-sm">
                          Cliquez pour sélectionner une image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPEG, WebP, GIF • Max 5MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Input
              type="email"
              label="Email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              type="text"
              label="Nom d'utilisateur"
              placeholder="Votre nom d'utilisateur"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              error={errors.username}
              helperText={isUsernameManuallyEdited ? "Nom d'utilisateur personnalisé" : "Auto-rempli depuis votre email"}
              autoComplete="username"
            />

            <div>
              <Input
                type="password"
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />
              {password && !errors.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === 'weak'
                          ? 'bg-red-500'
                          : passwordStrength === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === 'medium' || passwordStrength === 'strong'
                          ? passwordStrength === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded ${
                        passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    Force:{' '}
                    <span
                      className={`font-medium ${
                        passwordStrength === 'weak'
                          ? 'text-red-600'
                          : passwordStrength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {passwordStrength === 'weak'
                        ? 'Faible'
                        : passwordStrength === 'medium'
                        ? 'Moyenne'
                        : 'Fort'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading}
            >
              S'inscrire
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-hq-blue font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

