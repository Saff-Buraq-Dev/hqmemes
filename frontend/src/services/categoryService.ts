import { apiClient } from './api'
import { Category } from '../types'

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories')
    return response.data
  },

  // Create new category
  async createCategory(name: string): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', { name })
    return response.data
  },
}

