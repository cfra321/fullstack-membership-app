/**
 * Usage Display Component
 *
 * Displays usage statistics for articles and videos.
 */

import { formatUsage, getRemainingPercentage } from '../../lib/utils';

/**
 * Props for content usage display.
 */
interface ContentUsageProps {
  /** Label for the content type */
  label: string;
  /** Number of items accessed */
  count: number;
  /** Maximum allowed items */
  limit: number;
}

/**
 * Content Usage Card
 *
 * Displays usage for a single content type with a progress bar.
 */
function ContentUsageCard({ label, count, limit }: ContentUsageProps) {
  const percentage = getRemainingPercentage(count, limit);
  const usedPercentage = 100 - percentage;
  const isUnlimited = limit === Infinity || limit === Number.MAX_SAFE_INTEGER;

  // Color based on usage level
  let barColor = 'bg-green-500';
  if (!isUnlimited) {
    if (usedPercentage >= 100) {
      barColor = 'bg-red-500';
    } else if (usedPercentage >= 80) {
      barColor = 'bg-yellow-500';
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{formatUsage(count, limit)}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className="h-full w-full bg-green-500" />
        ) : (
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        )}
      </div>

      {/* Remaining text */}
      <p className="mt-2 text-xs text-gray-500">
        {isUnlimited
          ? 'Unlimited access'
          : limit - count > 0
          ? `${limit - count} remaining`
          : 'Limit reached'}
      </p>
    </div>
  );
}

/**
 * Props for UsageDisplay component.
 */
export interface UsageDisplayProps {
  /** Article usage statistics */
  articles: {
    count: number;
    limit: number;
  };
  /** Video usage statistics */
  videos: {
    count: number;
    limit: number;
  };
}

/**
 * Usage Display Component
 *
 * Displays both article and video usage statistics in a grid.
 *
 * @example
 * <UsageDisplay
 *   articles={{ count: 2, limit: 3 }}
 *   videos={{ count: 1, limit: 3 }}
 * />
 */
export function UsageDisplay({ articles, videos }: UsageDisplayProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ContentUsageCard
        label="Articles"
        count={articles.count}
        limit={articles.limit}
      />
      <ContentUsageCard
        label="Videos"
        count={videos.count}
        limit={videos.limit}
      />
    </div>
  );
}

export default UsageDisplay;
