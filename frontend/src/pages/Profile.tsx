import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import { memeService } from '../services/memeService'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import { DEFAULT_AVATARS } from '../utils/constants'
import { isValidUsername } from '../utils/validation'

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState(user?.username || '')
  const [usernameError, setUsernameError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || DEFAULT_AVATARS[0])
  const [avatarTab, setAvatarTab] = useState<'preset' | 'upload'>('preset')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Update selectedAvatar when user changes
  useEffect(() => {
    if (user?.avatarUrl) {
      setSelectedAvatar(user.avatarUrl)
    }
  }, [user?.avatarUrl])

  const handleUpdateUsername = async () => {
    if (!isValidUsername(newUsername)) {
      setUsernameError('3-20 caractères alphanumériques')
      return
    }

    setIsUpdating(true)
    try {
      await authService.updateProfile({ username: newUsername })
      updateUser({ username: newUsername })
      setIsEditingUsername(false)
      setUsernameError('')
      toast.success('Nom d\'utilisateur mis à jour avec succès')
    } catch (error) {
      setUsernameError('Erreur lors de la mise à jour')
      toast.error('Erreur lors de la mise à jour du nom d\'utilisateur')
    } finally {
      setIsUpdating(false)
    }
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

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    setUploadingAvatar(true)
    try {
      // Get presigned URL for avatar upload
      const { uploadUrl, fileUrl } = await memeService.getPresignedUrl(
        `avatar-${user?.userId}-${Date.now()}.${avatarFile.name.split('.').pop()}`,
        avatarFile.type
      )

      // Upload to S3
      await memeService.uploadToS3(uploadUrl, avatarFile)

      // Update profile with new avatar URL
      await authService.updateProfile({ avatarUrl: fileUrl })
      updateUser({ avatarUrl: fileUrl })
      
      setSelectedAvatar(fileUrl)
      setShowAvatarModal(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Avatar mis à jour avec succès')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Erreur lors de l\'upload de l\'avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateAvatar = async () => {
    if (avatarTab === 'upload' && avatarFile) {
      await handleUploadAvatar()
    } else if (avatarTab === 'preset') {
      setIsUpdating(true)
      try {
        await authService.updateProfile({ avatarUrl: selectedAvatar })
        updateUser({ avatarUrl: selectedAvatar })
        setShowAvatarModal(false)
        toast.success('Avatar mis à jour avec succès')
      } catch (error) {
        console.error('Error updating avatar:', error)
        toast.error('Erreur lors de la mise à jour de l\'avatar')
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false)
    setAvatarTab('preset')
    setAvatarFile(null)
    setAvatarPreview(null)
    setSelectedAvatar(user?.avatarUrl || DEFAULT_AVATARS[0])
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon profil</h1>

          <div className="card space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatarUrl || DEFAULT_AVATARS[0]}
                alt={user?.username || 'User'}
                size="xl"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Avatar</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Choisissez un avatar par défaut ou uploadez une photo personnalisée
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowAvatarModal(true)}>
                  Changer d'avatar
                </Button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="label">Nom d'utilisateur</label>
              {isEditingUsername ? (
                <div className="space-y-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    error={usernameError}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingUsername(false)
                        setNewUsername(user?.username || '')
                        setUsernameError('')
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdateUsername}
                      isLoading={isUpdating}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={user?.username || ''} disabled />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    Modifier
                  </Button>
                </div>
              )}
            </div>

            {/* User ID */}
            <div>
              <label className="label">ID utilisateur</label>
              <Input value={user?.userId || ''} disabled />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique de votre compte
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Avatar Selection Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={handleCloseAvatarModal}
        title="Choisir un avatar"
        size="lg"
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setAvatarTab('preset')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              avatarTab === 'preset'
                ? 'border-hq-blue text-hq-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Avatars par défaut
          </button>
          <button
            onClick={() => setAvatarTab('upload')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
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
          <div className="grid grid-cols-5 gap-4">
            {DEFAULT_AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`p-2 rounded-lg transition-all ${
                  selectedAvatar === avatar
                    ? 'ring-4 ring-hq-blue bg-hq-blue-50'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Avatar src={avatar} alt="Avatar option" size="lg" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {avatarPreview ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar src={avatarPreview} alt="Preview" size="xl" />
                  </div>
                  <p className="text-sm text-gray-600">{avatarFile?.name}</p>
                  <Button
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
                  <div className="text-6xl mb-4">📸</div>
                  <label className="cursor-pointer">
                    <span className="text-hq-blue hover:underline font-medium">
                      Cliquez pour sélectionner une image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPEG, WebP, GIF • Max 5MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleCloseAvatarModal}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleUpdateAvatar} 
            isLoading={isUpdating || uploadingAvatar} 
            className="flex-1"
            disabled={(avatarTab === 'upload' && !avatarFile) || (avatarTab === 'preset' && selectedAvatar === user?.avatarUrl)}
          >
            {avatarTab === 'upload' ? 'Uploader' : 'Confirmer'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

