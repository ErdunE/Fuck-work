import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface Props {
  decision: 'recommend' | 'caution' | 'avoid'
}

export default function DecisionBadge({ decision }: Props) {
  const config = {
    recommend: {
      icon: CheckCircleIcon,
      label: 'Recommended',
      className: 'bg-success-50 text-success-700 border-success-200'
    },
    caution: {
      icon: ExclamationTriangleIcon,
      label: 'Caution',
      className: 'bg-warning-50 text-warning-700 border-warning-200'
    },
    avoid: {
      icon: XCircleIcon,
      label: 'Avoid',
      className: 'bg-danger-50 text-danger-700 border-danger-200'
    }
  }
  
  const { icon: Icon, label, className } = config[decision]
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${className}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  )
}

