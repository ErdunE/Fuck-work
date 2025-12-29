interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ScoreBadge({ score, size = 'md', className = '' }: Props) {
  const getColorClass = () => {
    if (score >= 80) return 'bg-accent-green/10 text-accent-green border-accent-green'
    if (score >= 60) return 'bg-accent-orange/10 text-accent-orange border-accent-orange'
    return 'bg-accent-red/10 text-accent-red border-accent-red'
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-label'
      case 'lg':
        return 'w-14 h-14 text-body'
      default:
        return 'w-12 h-12 text-body-small'
    }
  }

  return (
    <div
      className={`rounded-full border-2 flex items-center justify-center font-bold ${getColorClass()} ${getSizeClass()} ${className}`}
      aria-label={`Authenticity score: ${score}`}
    >
      {score.toFixed(0)}
    </div>
  )
}
