import { Meme } from '../types'
import MemeCard from './MemeCard'
import Spinner from './Spinner'

interface MemeGridProps {
  memes: Meme[]
  isLoading?: boolean
  onLike: (memeId: string) => void
  onDelete?: (memeId: string) => void
  showDelete?: boolean
  emptyMessage?: string
}

export default function MemeGrid({
  memes,
  isLoading,
  onLike,
  onDelete,
  showDelete,
  emptyMessage = 'Aucun meme trouvé',
}: MemeGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-6xl mb-4">🎭</span>
        <p className="text-xl text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {memes.map((meme) => (
        <MemeCard
          key={meme.memeId}
          meme={meme}
          onLike={onLike}
          onDelete={onDelete}
          showDelete={showDelete}
        />
      ))}
    </div>
  )
}

