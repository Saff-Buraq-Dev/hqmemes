import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignUp } from 'aws-amplify/auth'
import { apiClient } from './api'
import { User } from '../types'

export const authService = {
  // Sign up with Cognito and create user in our DB
  async signup(email: string, password: string, username?: string, avatarUrl?: string) {
    const derivedUsername = username || email.split('@')[0]
    
    // Sign up with Cognito
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          preferred_username: derivedUsername,
        },
      },
    })

    // Store avatar selection for later (after confirmation)
    // We'll use it when calling /auth/me for the first time
    if (avatarUrl) {
      localStorage.setItem('hqmemes-pending-avatar', JSON.stringify({
        userId,
        avatarUrl,
        username: derivedUsername,
      }))
    }

    // Return email for redirect to confirmation page
    return { email, username: derivedUsername }
  },

  // Confirm sign up
  async confirmSignup(email: string, code: string) {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    })
  },

  // Sign in with Cognito
  async login(email: string, password: string) {
    try {
      // First, check if there's already a signed in user
      try {
        await getCurrentUser()
        // If we get here, there's already a session - sign out first
        await signOut()
      } catch {
        // No existing session, proceed with login
      }

      const { isSignedIn } = await signIn({ username: email, password })
      
      if (!isSignedIn) {
        throw new Error('Login failed')
      }

      const session = await fetchAuthSession()
      const user = await getCurrentUser()
      
      // Use ID Token (contains user claims like email, preferred_username)
      const idToken = session.tokens?.idToken?.toString() || ''
      
      // Get or create user in our backend (pass ID token for claims)
      const userData = await this.getOrCreateUser(idToken)

      return {
        userId: user.userId,
        email: userData.email,
        username: userData.username,
        avatarUrl: userData.avatarUrl,
        accessToken: idToken, // Use ID token for API calls
      }
    } catch (error) {
      // Re-throw to be handled by the mutation onError
      throw error
    }
  },

  // Sign out
  async logout() {
    await signOut()
  },

  // Get current session
  async getCurrentSession() {
    try {
      const session = await fetchAuthSession()
      const user = await getCurrentUser()
      
      if (!session.tokens?.accessToken) {
        return null
      }

      const userData = await this.getMe()

      return {
        userId: user.userId,
        email: userData.email,
        username: userData.username,
        accessToken: session.tokens.accessToken.toString(),
      }
    } catch {
      return null
    }
  },

  // Get or create user in backend (auto-created by /auth/me if doesn't exist)
  async getOrCreateUser(token: string): Promise<User> {
    // Check if there's a pending avatar from signup
    const pendingData = localStorage.getItem('hqmemes-pending-avatar')
    let avatarUrl = '/avatars/avatar-1.png'
    
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData)
        avatarUrl = data.avatarUrl
        
        // Check if it's a custom avatar pending upload
        if (avatarUrl === '__CUSTOM_AVATAR_PENDING__') {
          const customAvatarData = localStorage.getItem('hqmemes-pending-custom-avatar')
          if (customAvatarData) {
            try {
              const { dataUrl, filename, type } = JSON.parse(customAvatarData)
              
              // Convert base64 to blob
              const response = await fetch(dataUrl)
              const blob = await response.blob()
              const file = new File([blob], filename, { type })
              
              // Upload to S3
              const userId = data.userId || 'temp-' + Date.now()
              const presigned = await apiClient.post('/upload/presigned', {
                filename: `avatar-${userId}.${filename.split('.').pop()}`,
                contentType: type,
              }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              
              const { uploadUrl, fileUrl } = presigned.data
              await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': type },
              })
              
              avatarUrl = fileUrl
              localStorage.removeItem('hqmemes-pending-custom-avatar')
            } catch (error) {
              console.error('Failed to upload custom avatar:', error)
              // Fallback to default avatar
              avatarUrl = '/avatars/avatar-1.png'
            }
          }
        }
        
        localStorage.removeItem('hqmemes-pending-avatar')
      } catch (e) {
        console.error('Error parsing pending avatar:', e)
      }
    }
    
    // Call /auth/me - will auto-create user with avatar if doesn't exist
    const response = await apiClient.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Avatar-Url': avatarUrl, // Pass avatar as custom header
      },
    })
    return response.data
  },

  // Get current user profile
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  // Update user profile
  async updateProfile(updates: { username?: string; avatarUrl?: string }): Promise<User> {
    const response = await apiClient.put<User>('/auth/me', updates)
    return response.data
  },
}

