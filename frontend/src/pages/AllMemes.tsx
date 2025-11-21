import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMemes } from '../hooks/useMemes'
import { useCategories } from '../hooks/useCategories'
import { MemeFilters, SortBy } from '../types'
import MemeGrid from '../components/MemeGrid'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'

export default function AllMemes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<MemeFilters>({
    sortBy: (searchParams.get('sort') as SortBy) || 'recent',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    page: 1,
    limit: 10,
  })

  const { memes, total, isLoading, toggleLike } = useMemes(filters)
  const { categories } = useCategories()

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.sortBy) params.set('sort', filters.sortBy)
    if (filters.categories?.length) params.set('categories', filters.categories.join(','))
    setSearchParams(params)
  }, [filters.sortBy, filters.categories, setSearchParams])

  const handleSortChange = (sortBy: SortBy) => {
    setFilters({ ...filters, sortBy, page: 1 })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories?.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...(filters.categories || []), category]
    setFilters({ ...filters, categories: newCategories, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setFilters({ sortBy: 'recent', categories: [], page: 1, limit: 10 })
  }

  // Calculate total pages
  const totalPages = Math.ceil(total / (filters.limit || 10))

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tous les memes</h1>
        <p className="text-gray-600">
          {total} meme{total !== 1 ? 's' : ''} au total
        </p>
      </motion.div>

      {/* Filters */}
      <div className="card space-y-4">
        {/* Sort */}
        <div>
          <label className="label">Trier par</label>
          <div className="flex gap-2">
            <Button
              variant={filters.sortBy === 'recent' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('recent')}
            >
              🔥 Récents
            </Button>
            <Button
              variant={filters.sortBy === 'popular' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('popular')}
            >
              ⭐ Populaires
            </Button>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="label">Catégories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.categoryId}
                  variant={filters.categories?.includes(category.name) ? 'primary' : 'secondary'}
                  onRemove={
                    filters.categories?.includes(category.name)
                      ? () => handleCategoryToggle(category.name)
                      : undefined
                  }
                >
                  <button
                    onClick={() => handleCategoryToggle(category.name)}
                    className="flex items-center gap-1"
                  >
                    {category.name} ({category.count})
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Clear filters */}
        {(filters.categories?.length || filters.sortBy !== 'recent') && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      {/* Memes Grid */}
      <MemeGrid
        memes={memes}
        isLoading={isLoading}
        onLike={toggleLike}
        emptyMessage="Aucun meme trouvé avec ces filtres"
      />

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

