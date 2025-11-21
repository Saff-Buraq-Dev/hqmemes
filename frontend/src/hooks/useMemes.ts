import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { memeService } from '../services/memeService'
import { MemeFilters } from '../types'

const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL || '5000')

export const useMemes = (filters?: MemeFilters) => {
  const queryClient = useQueryClient()

  // Get memes with filters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['memes', filters],
    queryFn: () => memeService.getMemes(filters),
    refetchInterval: POLLING_INTERVAL,
  })

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: (memeId: string) => memeService.toggleLike(memeId),
    onSuccess: (data, memeId) => {
      // Optimistic update
      queryClient.setQueryData(['memes', filters], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((meme: any) =>
            meme.memeId === memeId
              ? { ...meme, isLiked: data.isLiked, likesCount: data.likesCount }
              : meme
          ),
        }
      })
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['memes'] })
    },
  })

  // Delete meme mutation
  const deleteMutation = useMutation({
    mutationFn: (memeId: string) => memeService.deleteMeme(memeId),
    onSuccess: () => {
      toast.success('Meme supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['memes'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du meme')
    },
  })

  return {
    memes: data?.data || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
    toggleLike: likeMutation.mutate,
    deleteMeme: deleteMutation.mutate,
  }
}

export const useRecentMemes = () => {
  return useQuery({
    queryKey: ['memes', 'recent'],
    queryFn: () => memeService.getRecentMemes(10),
    refetchInterval: POLLING_INTERVAL,
  })
}

export const usePopularMemes = () => {
  return useQuery({
    queryKey: ['memes', 'popular'],
    queryFn: () => memeService.getPopularMemes(10),
    refetchInterval: POLLING_INTERVAL,
  })
}

