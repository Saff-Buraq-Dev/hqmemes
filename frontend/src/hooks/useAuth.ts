import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/authStore'

export const useAuth = () => {
  const navigate = useNavigate()
  const { setAuth, clearAuth } = useAuthStore()

  // Sign up mutation
  const signupMutation = useMutation({
    mutationFn: ({ email, password, username, avatarUrl }: { email: string; password: string; username?: string; avatarUrl?: string }) =>
      authService.signup(email, password, username, avatarUrl),
    onSuccess: (data) => {
      // Redirect to confirmation page with email
      navigate('/confirm-signup', { state: { email: data.email } })
    },
    onError: (error: any) => {
      console.error('Signup error:', error)
    },
  })

  // Confirm signup mutation
  const confirmSignupMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authService.confirmSignup(email, code),
    onSuccess: () => {
      navigate('/login')
    },
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setAuth(
        {
          userId: data.userId,
          email: data.email,
          username: data.username,
          avatarUrl: data.avatarUrl,
        },
        data.accessToken
      )
      navigate('/')
    },
    onError: (error: any) => {
      console.error('Login error:', error)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth()
      navigate('/login')
    },
  })

  // REMOVED: getCurrentSession query that was causing infinite loop
  // The auth state is managed by Zustand store and persists across refreshes

  return {
    signup: (variables: any, options?: any) => signupMutation.mutate(variables, options),
    confirmSignup: confirmSignupMutation.mutate,
    login: (variables: any, options?: any) => loginMutation.mutate(variables, options),
    logout: logoutMutation.mutate,
    isLoading: signupMutation.isPending || loginMutation.isPending || confirmSignupMutation.isPending,
  }
}

