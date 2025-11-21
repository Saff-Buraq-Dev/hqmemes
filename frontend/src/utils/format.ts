// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Date invalide'
  }

  // More granular time display
  if (diffInSeconds < 10) return 'À l\'instant'
  if (diffInSeconds < 60) return `Il y a ${diffInSeconds}s`
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `Il y a ${minutes} min`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `Il y a ${hours}h`
  }
  if (diffInSeconds < 2592000) { // 30 days
    const days = Math.floor(diffInSeconds / 86400)
    return `Il y a ${days}j`
  }
  
  // For dates older than 30 days, show full date
  return date.toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Format number with separator
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-CA').format(num)
}

// Truncate text
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

