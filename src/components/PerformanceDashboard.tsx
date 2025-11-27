import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

interface PerformanceDashboardProps {
  statistics: PickupLineStatistics[];
}

/**
 * Performance Dashboard Component
 * Displays aggregate performance statistics and individual pickup line performance
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export function PerformanceDashboard({ statistics }: PerformanceDashboardProps) {
  const [sortBy, setSortBy] = useState<'successRate' | 'totalUses' | 'alphabetical'>('successRate');
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 100; // Approximate height of each item in pixels

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalCalls = statistics.reduce((sum, stat) => sum + stat.totalUses, 0);
    const totalSuccessful = statistics.reduce((sum, stat) => sum + stat.successfulUses, 0);
    const overallSuccessRate = totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0;

    return {
      totalCalls,
      overallSuccessRate,
    };
  }, [statistics]);

  // Sort statistics based on selected sort option (memoized)
  const sortedStatistics = useMemo(() => {
    const statsWithPickupLines = statistics.map(stat => {
      const pickupLine = PICKUP_LINES.find(pl => pl.id === stat.pickupLineId);
      return {
        ...stat,
        pickupLine,
      };
    });

    const sorted = [...statsWithPickupLines];

    switch (sortBy) {
      case 'successRate':
        sorted.sort((a, b) => b.successRate - a.successRate);
        break;
      case 'totalUses':
        sorted.sort((a, b) => b.totalUses - a.totalUses);
        break;
      case 'alphabetical':
        sorted.sort((a, b) => {
          const textA = a.pickupLine?.text || '';
          const textB = b.pickupLine?.text || '';
          return textA.localeCompare(textB);
        });
        break;
    }

    return sorted;
  }, [statistics, sortBy]);

  // Get visible items for virtualization (memoized)
  const visibleItems = useMemo(() => {
    return sortedStatistics.slice(visibleRange.start, visibleRange.end);
  }, [sortedStatistics, visibleRange]);

  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;

    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + 5; // Buffer of 5 items

    setVisibleRange({ start: Math.max(0, start), end: Math.min(sortedStatistics.length, end) });
  }, [sortedStatistics.length, itemHeight]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm">
      {/* Header */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Performance Dashboard</h2>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl border border-blue-200">
          <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Total Calls
          </p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900">{overallStats.totalCalls}</p>
        </div>

        <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl border border-green-200">
          <p className="text-xs sm:text-sm font-semibold text-green-600 uppercase tracking-wide mb-1">
            Success Rate
          </p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-900">
            {overallStats.overallSuccessRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pickup Line Performance</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto" role="group" aria-label="Sort options">
          <button
            onClick={() => setSortBy('successRate')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] touch-manipulation ${
              sortBy === 'successRate'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
            aria-label="Sort by success rate"
            aria-pressed={sortBy === 'successRate'}
          >
            Success Rate
          </button>
          <button
            onClick={() => setSortBy('totalUses')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] touch-manipulation ${
              sortBy === 'totalUses'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
            aria-label="Sort by total uses"
            aria-pressed={sortBy === 'totalUses'}
          >
            Most Used
          </button>
          <button
            onClick={() => setSortBy('alphabetical')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] touch-manipulation ${
              sortBy === 'alphabetical'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
            }`}
            aria-label="Sort alphabetically"
            aria-pressed={sortBy === 'alphabetical'}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Pickup Lines List with Virtualization */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2" 
        role="list" 
        aria-label="Pickup line performance statistics"
      >
        {sortedStatistics.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500" role="status">
            <p className="text-base sm:text-lg font-medium mb-2">No data yet</p>
            <p className="text-xs sm:text-sm">Start making calls to see your performance statistics</p>
          </div>
        ) : (
          <div style={{ height: `${sortedStatistics.length * itemHeight}px`, position: 'relative' }}>
            <div 
              className="space-y-2 sm:space-y-3"
              style={{ 
                transform: `translateY(${visibleRange.start * itemHeight}px)`,
                position: 'absolute',
                width: '100%'
              }}
            >
              {visibleItems.map((stat) => (
                <PickupLineStatCard
                  key={stat.pickupLineId}
                  statistic={stat}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PickupLineStatCardProps {
  statistic: PickupLineStatistics & { pickupLine?: { id: string; text: string; category?: string } };
}

/**
 * Individual pickup line statistics card
 */
function PickupLineStatCard({ statistic }: PickupLineStatCardProps) {
  const { pickupLine, totalUses, successfulUses, successRate } = statistic;

  // Determine color based on success rate
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-success';
    if (rate >= 50) return 'bg-blue-500';
    if (rate >= 30) return 'bg-warning';
    return 'bg-error';
  };

  const getSuccessRateTextColor = (rate: number) => {
    if (rate >= 70) return 'text-success';
    if (rate >= 50) return 'text-blue-500';
    if (rate >= 30) return 'text-warning';
    return 'text-error';
  };

  const successRatePercentage = successRate * 100;

  return (
    <div 
      className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors" 
      role="listitem"
    >
      {/* Pickup Line Text */}
      <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-900 leading-relaxed break-words">
            {pickupLine?.text || 'Unknown pickup line'}
          </p>
          {pickupLine?.category && (
            <span className="inline-block mt-1 sm:mt-1.5 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-md">
              {pickupLine.category}
            </span>
          )}
        </div>

        {/* Success Rate Badge */}
        <div className="flex-shrink-0 text-right">
          <p className={`text-xl sm:text-2xl font-bold ${getSuccessRateTextColor(successRatePercentage)}`}>
            {successRatePercentage.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
            {successfulUses}/{totalUses} calls
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className={`h-full ${getSuccessRateColor(successRatePercentage)} transition-all duration-500 ease-out`}
          style={{ width: `${successRatePercentage}%` }}
          role="progressbar"
          aria-valuenow={successRatePercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Success rate: ${successRatePercentage.toFixed(0)}%`}
        />
      </div>
    </div>
  );
}
