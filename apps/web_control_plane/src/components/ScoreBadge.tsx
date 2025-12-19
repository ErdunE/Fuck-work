interface Props {
  score: number
  className?: string
}

export default function ScoreBadge({ score, className = '' }: Props) {
  const getColorClass = () => {
    if (score >= 80) return 'bg-success-50 text-success-700 border-success-600'
    if (score >= 60) return 'bg-warning-50 text-warning-700 border-warning-600'
    return 'bg-danger-50 text-danger-700 border-danger-600'
  }
    
  return (
    <div 
      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${getColorClass()} ${className}`}
      aria-label={`Authenticity score: ${score}`}
    >
      {score.toFixed(0)}
    </div>
  )
}

