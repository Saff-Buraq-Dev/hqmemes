import { useState, useEffect } from 'react'
import { ASSETS_URL } from '../utils/constants'

interface AvatarProps {
  src: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tooltip?: string
  onClick?: () => void
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export default function Avatar({ src, alt, size = 'md', tooltip, onClick, className = '' }: AvatarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Reset imageError when src changes
  useEffect(() => {
    setImageError(false)
  }, [src])

  // Handle different URL types: http/https, blob (preview), data (base64), or relative path
  const avatarUrl = (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:'))
    ? src 
    : `${ASSETS_URL}${src}`
  const fallbackUrl = '/avatars/avatar-1.png'

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm ${className}`}>
        <img
          src={imageError ? fallbackUrl : avatarUrl}
          alt={alt}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover ${
            onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
          }`}
          onClick={onClick}
        />
      </div>
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 animate-fade-in">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

