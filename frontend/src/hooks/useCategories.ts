import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'

export const useCategories = () => {
  const queryClient = useQueryClient()

  // Get categories
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 60000, // 1 minute
  })

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => categoryService.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return {
    categories: data || [],
    isLoading,
    createCategory: createMutation.mutate,
  }
}

