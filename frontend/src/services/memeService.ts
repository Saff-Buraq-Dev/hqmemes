import { apiClient } from './api'
import { Meme, PaginatedResponse, MemeFilters, PresignedUrlResponse } from '../types'

export const memeService = {
  // Get memes with filters
  async getMemes(filters?: MemeFilters): Promise<PaginatedResponse<Meme>> {
    const params = new URLSearchParams()
    
    if (filters?.uploaderId) params.append('uploaderId', filters.uploaderId)
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','))
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get<PaginatedResponse<Meme>>(`/memes?${params}`)
    return response.data
  },

  // Get recent memes
  async getRecentMemes(limit = 10): Promise<Meme[]> {
    const response = await apiClient.get<PaginatedResponse<Meme>>(
      `/memes?sortBy=recent&limit=${limit}`
    )
    return response.data.data
  },

  // Get popular memes
  async getPopularMemes(limit = 10): Promise<Meme[]> {
    const response = await apiClient.get<PaginatedResponse<Meme>>(
      `/memes?sortBy=popular&limit=${limit}`
    )
    return response.data.data
  },

  // Get single meme
  async getMeme(memeId: string): Promise<Meme> {
    const response = await apiClient.get<Meme>(`/memes/${memeId}`)
    return response.data
  },

  // Get presigned URL for upload
  async getPresignedUrl(filename: string, contentType: string): Promise<PresignedUrlResponse> {
    const response = await apiClient.post<PresignedUrlResponse>('/upload/presigned', {
      filename,
      contentType,
    })
    return response.data
  },

  // Upload file to S3
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
  },

  // Create meme after upload
  async createMeme(data: {
    memeId: string
    name: string
    url: string
    categories: string[]
  }): Promise<Meme> {
    const response = await apiClient.post<Meme>('/memes', data)
    return response.data
  },

  // Delete meme
  async deleteMeme(memeId: string): Promise<void> {
    await apiClient.delete(`/memes/${memeId}`)
  },

  // Toggle like
  async toggleLike(memeId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const response = await apiClient.post<{ isLiked: boolean; likesCount: number }>(
      `/memes/${memeId}/like`
    )
    return response.data
  },

  // Get meme likes
  async getMemeLikes(memeId: string): Promise<{ userId: string; avatarUrl: string; username: string }[]> {
    const response = await apiClient.get<{ userId: string; avatarUrl: string; username: string }[]>(
      `/memes/${memeId}/likes`
    )
    return response.data
  },
}

