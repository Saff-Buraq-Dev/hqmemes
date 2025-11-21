import { useState } from 'react'
import { motion } from 'framer-motion'
import { Meme } from '../types'
import Avatar from './Avatar'
import Badge from './Badge'
import Button from './Button'
import Modal from './Modal'
import { formatRelativeTime } from '../utils/format'
import { ASSETS_URL } from '../utils/constants'

interface MemeCardProps {
  meme: Meme
  onLike: (memeId: string) => void
  onDelete?: (memeId: string) => void
  showDelete?: boolean
}

export default function MemeCard({ meme, onLike, onDelete, showDelete = false }: MemeCardProps) {
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = meme.url.startsWith('http') ? meme.url : `${ASSETS_URL}${meme.url}`
  const visibleLikes = meme.likes?.slice(0, 3) || []
  const remainingLikes = (meme.likesCount || 0) - visibleLikes.length

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card group hover:shadow-lg transition-shadow flex flex-col h-full"
      >
        {/* Image - Fixed aspect ratio with object-contain */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-6xl">🖼️</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={meme.name}
              onError={() => setImageError(true)}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Content - Fixed minimum height */}
        <div className="flex flex-col flex-grow min-h-[160px] pt-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar
                src={meme.uploader?.avatarUrl || '/avatars/avatar-1.png'}
                alt={meme.uploader?.username || 'User'}
                tooltip={meme.uploader?.username}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                {/* Title limited to 2 lines */}
                <p 
                  className="text-sm font-semibold text-gray-900 line-clamp-2" 
                  title={meme.name}
                >
                  {meme.name}
                </p>
                <p 
                  className="text-xs text-gray-500" 
                  title={new Date(meme.createdAt).toLocaleString('fr-CA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                >
                  {formatRelativeTime(meme.createdAt)}
                </p>
              </div>
            </div>
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(meme.memeId)}
                className="text-red-600 hover:bg-red-50 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>

          {/* Categories */}
          {meme.categories && meme.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {meme.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Spacer to push footer to bottom */}
          <div className="flex-grow"></div>

          {/* Footer - Always at bottom */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {/* Likes with tooltips */}
            <div className="flex items-center gap-2">
              <Button
                variant={meme.isLiked ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onLike(meme.memeId)}
                leftIcon={
                  <svg className="w-4 h-4" fill={meme.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                }
              >
                {meme.likesCount || 0}
              </Button>
            </div>

            {/* Avatar stack with tooltips */}
            {visibleLikes.length > 0 && (
              <button
                onClick={() => setShowLikesModal(true)}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <span className="text-xs text-gray-500">Aimé par</span>
                <div className="flex -space-x-2">
                  {visibleLikes.map((like, index) => (
                    <div key={index} className="relative group/avatar">
                      <Avatar
                        src={like.avatarUrl || '/avatars/avatar-1.png'}
                        alt={like.username || 'User'}
                        size="xs"
                        className="ring-2 ring-white"
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                        {like.username || 'User'}
                      </div>
                    </div>
                  ))}
                  {remainingLikes > 0 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">+{remainingLikes}</span>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Likes modal */}
      <Modal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        title={`${meme.likesCount || 0} like${(meme.likesCount || 0) !== 1 ? 's' : ''}`}
        size="sm"
      >
        <div className="space-y-3">
          {meme.likes && meme.likes.length > 0 ? (
            meme.likes.map((like) => (
              <div key={like.userId} className="flex items-center gap-3">
                <Avatar
                  src={like.avatarUrl || '/avatars/avatar-1.png'}
                  alt={like.username || 'User'}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900">{like.username}</p>
                  <p className="text-sm text-gray-500">{formatRelativeTime(like.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Aucun like pour le moment</p>
          )}
        </div>
      </Modal>
    </>
  )
}

