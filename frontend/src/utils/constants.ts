// Default avatars
export const DEFAULT_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png'
]

// Upload limits
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE || '10485760') // 10MB
export const MAX_FILES_PER_UPLOAD = parseInt(import.meta.env.VITE_MAX_FILES_PER_UPLOAD || '10')

// Supported file types
export const SUPPORTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

// Pagination
export const DEFAULT_PAGE_SIZE = 10

// Asset URLs
export const ASSETS_URL = import.meta.env.VITE_ASSETS_URL || ''

