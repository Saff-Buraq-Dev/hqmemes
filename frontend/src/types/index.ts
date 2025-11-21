// User types
export interface User {
  userId: string
  username: string
  email: string
  avatarUrl: string
  createdAt: string
}

// Meme types
export interface Meme {
  memeId: string
  name: string
  url: string
  uploaderId: string
  uploader?: User
  categories: string[]
  likesCount: number
  likes?: Like[]
  createdAt: string
  isLiked?: boolean
}

// Like types
export interface Like {
  userId: string
  username: string
  avatarUrl: string
  createdAt: string
}

// Category types
export interface Category {
  categoryId: string
  name: string
  count: number
  createdAt: string
}

// Upload Job types
export interface UploadJob {
  jobId: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalFiles: number
  processedFiles: number
  errors: string[]
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Filter and Sort types
export type SortBy = 'recent' | 'popular'
export type SortOrder = 'asc' | 'desc'

export interface MemeFilters {
  uploaderId?: string
  categories?: string[]
  sortBy?: SortBy
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

// Auth types
export interface SignupData {
  email: string
  password: string
  username?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthUser {
  userId: string
  email: string
  username: string
  accessToken: string
  refreshToken: string
}

// Upload types
export interface UploadMemeData {
  file: File
  name: string
  categories: string[]
}

export interface PresignedUrlResponse {
  uploadUrl: string
  fileUrl: string
  memeId: string
}

