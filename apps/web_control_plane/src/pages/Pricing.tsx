import { CheckIcon } from '@heroicons/react/24/outline'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic job search',
    features: [
      'Browse all job listings',
      'Basic search & filters',
      'Save up to 10 jobs',
      '5 applications per day',
    ],
    cta: 'Current Plan',
    highlighted: false,
    disabled: true,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'Supercharge your job search',
    features: [
      'Everything in Free',
      'Unlimited applications',
      'AI-powered job matching',
      'Auto-fill applications',
      'Priority support',
      'Application tracking',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
    disabled: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team management',
      'Custom integrations',
      'Dedicated support',
      'Analytics dashboard',
      'API access',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    disabled: false,
  },
]

export default function Pricing() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="text-center mb-3xl">
        <h1 className="text-page-title text-text-primary mb-sm">
          Simple, transparent pricing
        </h1>
        <p className="text-body text-text-secondary max-w-[600px] mx-auto">
          Choose the plan that's right for you. Upgrade anytime to unlock more features.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg max-w-[1000px] mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg p-lg ${
              plan.highlighted
                ? 'bg-bg-primary border-2 border-accent-blue shadow-card-hover'
                : 'bg-bg-primary border border-border-light shadow-card'
            }`}
          >
            {/* Plan Header */}
            <div className="mb-lg">
              {plan.highlighted && (
                <span className="inline-block text-label text-accent-blue bg-accent-blue/10 px-sm py-xs rounded-full mb-sm">
                  Most Popular
                </span>
              )}
              <h3 className="text-section-title text-text-primary">{plan.name}</h3>
              <div className="mt-sm">
                <span className="text-page-title text-text-primary">{plan.price}</span>
                <span className="text-body-small text-text-secondary ml-xs">/{plan.period}</span>
              </div>
              <p className="text-body-small text-text-secondary mt-sm">{plan.description}</p>
            </div>

            {/* Features */}
            <ul className="space-y-sm mb-lg">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-sm">
                  <CheckIcon className="w-5 h-5 text-accent-green flex-shrink-0 mt-[2px]" />
                  <span className="text-body-small text-text-primary">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              disabled={plan.disabled}
              className={`w-full h-button rounded-md font-medium transition-colors duration-fast ${
                plan.highlighted
                  ? 'bg-accent-blue text-white hover:bg-accent-blue-hover'
                  : plan.disabled
                  ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                  : 'bg-bg-primary text-text-primary border border-border-default hover:bg-bg-tertiary'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="text-center mt-3xl">
        <p className="text-body-small text-text-secondary">
          Have questions?{' '}
          <a href="mailto:support@fuckwork.com" className="text-accent-blue hover:text-accent-blue-hover">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
