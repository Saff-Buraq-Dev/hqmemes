import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - only redirect if not already on login page
          const currentPath = window.location.pathname
          if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/confirm-signup') {
            useAuthStore.getState().clearAuth()
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  public get instance() {
    return this.client
  }
}

export const apiClient = new ApiClient().instance

