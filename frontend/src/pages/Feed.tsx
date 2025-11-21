import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRecentMemes, usePopularMemes } from '../hooks/useMemes'
import { memeService } from '../services/memeService'
import MemeGrid from '../components/MemeGrid'
import Button from '../components/Button'
import Spinner from '../components/Spinner'

export default function Feed() {
  const { data: recentMemes, isLoading: loadingRecent } = useRecentMemes()
  const { data: popularMemes, isLoading: loadingPopular } = usePopularMemes()
  const queryClient = useQueryClient()

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (memeId: string) => memeService.toggleLike(memeId),
    onSuccess: () => {
      // Invalidate both recent and popular queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['memes', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['memes', 'popular'] })
    },
  })

  const handleLike = (memeId: string) => {
    likeMutation.mutate(memeId)
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Bienvenue sur <span className="text-hq-blue">HQ-Memes</span> 🎭
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Partagez vos memes préférés avec vos collègues
        </p>
        <Link to="/upload">
          <Button size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Uploader un meme
          </Button>
        </Link>
      </motion.div>

      {/* Recent Memes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🔥 Mèmes récents</h2>
          <Link to="/memes?sort=recent">
            <Button variant="ghost" size="sm">
              Voir tous
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        {loadingRecent ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <MemeGrid
            memes={recentMemes || []}
            onLike={handleLike}
            emptyMessage="Aucun meme récent"
          />
        )}
      </section>

      {/* Popular Memes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">⭐ Mèmes populaires</h2>
          <Link to="/memes?sort=popular">
            <Button variant="ghost" size="sm">
              Voir tous
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        {loadingPopular ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <MemeGrid
            memes={popularMemes || []}
            onLike={handleLike}
            emptyMessage="Aucun meme populaire"
          />
        )}
      </section>
    </div>
  )
}

