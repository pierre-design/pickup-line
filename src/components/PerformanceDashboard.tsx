import { useMemo } from 'react';
import type { PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

interface PerformanceDashboardProps {
  statistics: PickupLineStatistics[];
}

interface PickupLineWithStats {
  id: string;
  text: string;
  category?: string;
  position: number;
  totalUses: number;
  successRate: number;
  successfulUses: number;
}

/**
 * Performance Dashboard Component
 * Displays ALL pickup lines with their performance statistics
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function PerformanceDashboard({ statistics }: PerformanceDashboardProps) {
  const allPickupLinesWithStats = useMemo(() => {
    // Create a map of statistics by pickup line ID
    const statsMap = new Map(statistics.map(stat => [stat.pickupLineId, stat]));

    // Map all pickup lines with their stats (or defaults if no stats)
    const linesWithStats: PickupLineWithStats[] = PICKUP_LINES.map((line, index) => {
      const stat = statsMap.get(line.id);
      return {
        id: line.id,
        text: line.text,
        category: line.category,
        position: index + 1,
        totalUses: stat?.totalUses || 0,
        successRate: stat?.successRate || 0,
        successfulUses: stat?.successfulUses || 0,
      };
    });

    // Always sort by performance: success rate (descending), then by total uses (descending)
    linesWithStats.sort((a, b) => {
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      return b.totalUses - a.totalUses;
    });

    // Update positions after sorting
    return linesWithStats.map((line, index) => ({
      ...line,
      position: index + 1,
    }));
  }, [statistics]);

  return (
    <>
      {/* Pickup Lines List - Scrollable content */}
      <div 
        role="list" 
        aria-label="Pickup line performance statistics"
      >
        <div className="space-y-3 pb-8">
          {allPickupLinesWithStats.map((line) => (
            <PickupLineCard
              key={line.id}
              line={line}
            />
          ))}
        </div>
      </div>
    </>
  );
}

interface PickupLineCardProps {
  line: PickupLineWithStats;
}

function PickupLineCard({ line }: PickupLineCardProps) {
  const { text, position, totalUses, successRate, successfulUses } = line;
  const successRatePercentage = successRate * 100;
  const hasData = totalUses > 0;

  return (
    <div 
      className="rounded-lg bg-dark-green/50 border border-[#006B3A] p-4 hover:bg-dark-green/70 transition-all duration-200" 
      role="listitem"
    >
      <div className="flex items-start gap-4">
        {/* Left side: 3/4 width - Pickup line text */}
        <div className="flex-[3] min-w-0">
          <p className="text-sm font-medium text-white leading-relaxed break-words">
            {text}
          </p>
        </div>

        {/* Right side: 1/4 width - Stats */}
        <div className="flex-1 flex flex-col items-end text-right">
          <div className="text-sm font-bold text-white/60 mb-1">#{position}</div>
          
          {hasData ? (
            <>
              <div className={`text-xl font-bold ${
                successRatePercentage >= 80 ? 'text-medium-green' : 'text-pink'
              }`}>
                {successRatePercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                {successfulUses}/{totalUses} success
              </div>
              <div className="text-xs text-white/60">
                Used {totalUses}x
              </div>
            </>
          ) : (
            <div className="text-xs text-white/40 mt-2">
              Not used yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
