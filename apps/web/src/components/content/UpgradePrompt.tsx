/**
 * Upgrade Prompt Component
 *
 * Displays a prompt to upgrade membership when quota is exceeded.
 */

import Link from 'next/link';

/**
 * Props for UpgradePrompt component.
 */
export interface UpgradePromptProps {
  /** Type of content being accessed */
  contentType: 'article' | 'video';
  /** Current usage count */
  currentUsage?: number;
  /** Maximum allowed for current membership */
  limit?: number;
  /** Current membership type */
  membershipType?: string;
}

/**
 * Get membership tier details.
 */
function getMembershipTiers() {
  return [
    {
      type: 'A',
      name: 'Basic',
      articles: 3,
      videos: 3,
      description: 'Access to 3 articles and 3 videos',
      isCurrent: false,
    },
    {
      type: 'B',
      name: 'Premium',
      articles: 10,
      videos: 10,
      description: 'Access to 10 articles and 10 videos',
      isCurrent: false,
    },
    {
      type: 'C',
      name: 'Unlimited',
      articles: Infinity,
      videos: Infinity,
      description: 'Unlimited access to all content',
      isCurrent: false,
    },
  ];
}

/**
 * Upgrade Prompt Component
 *
 * Shows when a user tries to access content but has exceeded their quota.
 * Displays information about their current limit and upgrade options.
 *
 * @example
 * <UpgradePrompt
 *   contentType="article"
 *   currentUsage={3}
 *   limit={3}
 *   membershipType="A"
 * />
 */
export function UpgradePrompt({
  contentType,
  currentUsage,
  limit,
  membershipType,
}: UpgradePromptProps) {
  const tiers = getMembershipTiers().map((tier) => ({
    ...tier,
    isCurrent: tier.type === membershipType,
  }));

  const contentLabel = contentType === 'article' ? 'articles' : 'videos';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Warning icon and message */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quota Limit Reached
        </h2>

        <p className="text-gray-600">
          You&apos;ve accessed {currentUsage ?? 'all'} of your {limit ?? 'allowed'} {contentLabel} this month.
          Upgrade your membership to access more content.
        </p>
      </div>

      {/* Membership tiers */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 text-center">
          Upgrade Your Membership
        </h3>

        <div className="grid gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.type}
              className={`relative p-4 rounded-xl border-2 ${
                tier.isCurrent
                  ? 'border-gray-300 bg-gray-50'
                  : tier.type === 'C'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              {tier.isCurrent && (
                <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  Current Plan
                </span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold ${
                    tier.isCurrent ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {tier.name}
                  </h4>
                  <p className={`text-sm ${
                    tier.isCurrent ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {tier.description}
                  </p>
                </div>

                {!tier.isCurrent && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tier.type === 'C'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    Upgrade
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/dashboard"
          className="btn btn-secondary text-center"
        >
          Back to Dashboard
        </Link>

        <Link
          href={`/${contentType}s`}
          className="btn btn-primary text-center"
        >
          Browse Other {contentType === 'article' ? 'Articles' : 'Videos'}
        </Link>
      </div>

      {/* Info text */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Note: You can still access {contentLabel} you&apos;ve already read without using your quota.
      </p>
    </div>
  );
}

export default UpgradePrompt;
