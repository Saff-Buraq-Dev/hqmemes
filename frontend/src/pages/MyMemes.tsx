import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { useMemes } from '../hooks/useMemes'
import MemeGrid from '../components/MemeGrid'
import Button from '../components/Button'
import { Link } from 'react-router-dom'

export default function MyMemes() {
  const { user } = useAuthStore()
  const { memes, isLoading, toggleLike, deleteMeme } = useMemes({
    uploaderId: user?.userId,
    sortBy: 'recent',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes memes</h1>
          <p className="text-gray-600">
            {memes.length} meme{memes.length !== 1 ? 's' : ''} uploadé{memes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/upload">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouveau meme
          </Button>
        </Link>
      </motion.div>

      {/* Memes Grid */}
      <MemeGrid
        memes={memes}
        isLoading={isLoading}
        onLike={toggleLike}
        onDelete={deleteMeme}
        showDelete={true}
        emptyMessage="Vous n'avez pas encore uploadé de meme"
      />
    </div>
  )
}

