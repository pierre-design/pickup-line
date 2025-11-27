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
  const itemHeight = 100;

  const overallStats = useMemo(() => {
    const totalCalls = statistics.reduce((sum, stat) => sum + stat.totalUses, 0);
    const totalSuccessful = statistics.reduce((sum, stat) => sum + stat.successfulUses, 0);
    const overallSuccessRate = totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0;

    return {
      totalCalls,
      overallSuccessRate,
    };
  }, [statistics]);

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

  const visibleItems = useMemo(() => {
    return sortedStatistics.slice(visibleRange.start, visibleRange.end);
  }, [sortedStatistics, visibleRange]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;

    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + 5;

    setVisibleRange({ start: Math.max(0, start), end: Math.min(sortedStatistics.length, end) });
  }, [sortedStatistics.length, itemHeight]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">Performance Dashboard</h2>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass p-6 rounded-2xl border border-white/10 hover-lift">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
            Total Calls
          </p>
          <p className="text-4xl font-extrabold text-white">{overallStats.totalCalls}</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-primary/30 hover-lift">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
            Success Rate
          </p>
          <p className="text-4xl font-extrabold text-primary">
            {overallStats.overallSuccessRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-white">Pickup Line Performance</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto" role="group" aria-label="Sort options">
          <button
            onClick={() => setSortBy('successRate')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-900 min-h-[44px] transform hover:scale-105 active:scale-95 ${
              sortBy === 'successRate'
                ? 'bg-gradient-to-r from-primary to-green-600 text-white shadow-glow-primary'
                : 'glass text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Sort by success rate"
            aria-pressed={sortBy === 'successRate'}
          >
            Success Rate
          </button>
          <button
            onClick={() => setSortBy('totalUses')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-900 min-h-[44px] transform hover:scale-105 active:scale-95 ${
              sortBy === 'totalUses'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'glass text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Sort by total uses"
            aria-pressed={sortBy === 'totalUses'}
          >
            Most Used
          </button>
          <button
            onClick={() => setSortBy('alphabetical')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-900 min-h-[44px] transform hover:scale-105 active:scale-95 ${
              sortBy === 'alphabetical'
                ? 'bg-gradient-to-r from-secondary to-yellow-500 text-dark-900 shadow-[0_0_20px_rgba(255,221,0,0.5)]'
                : 'glass text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Sort alphabetically"
            aria-pressed={sortBy === 'alphabetical'}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Pickup Lines List */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[600px] overflow-y-auto pr-2" 
        role="list" 
        aria-label="Pickup line performance statistics"
      >
        {sortedStatistics.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center border border-white/10" role="status">
            <p className="text-lg font-bold text-white mb-2">No data yet</p>
            <p className="text-sm text-white/60">Start making calls to see your performance statistics</p>
          </div>
        ) : (
          <div style={{ height: `${sortedStatistics.length * itemHeight}px`, position: 'relative' }}>
            <div 
              className="space-y-3"
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

function PickupLineStatCard({ statistic }: PickupLineStatCardProps) {
  const { pickupLine, totalUses, successfulUses, successRate } = statistic;

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'from-primary to-green-600';
    if (rate >= 50) return 'from-blue-500 to-blue-600';
    if (rate >= 30) return 'from-secondary to-yellow-500';
    return 'from-error to-red-600';
  };

  const getSuccessRateTextColor = (rate: number) => {
    if (rate >= 70) return 'text-primary';
    if (rate >= 50) return 'text-blue-400';
    if (rate >= 30) return 'text-secondary';
    return 'text-error';
  };

  const successRatePercentage = successRate * 100;

  return (
    <div 
      className="glass p-4 rounded-xl border border-white/10 hover:border-white/20 hover-lift transition-all" 
      role="listitem"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-relaxed break-words">
            {pickupLine?.text || 'Unknown pickup line'}
          </p>
          {pickupLine?.category && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-white/80 bg-white/10 rounded-md">
              {pickupLine.category}
            </span>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          <p className={`text-2xl font-extrabold ${getSuccessRateTextColor(successRatePercentage)}`}>
            {successRatePercentage.toFixed(0)}%
          </p>
          <p className="text-xs text-white/60 mt-1 whitespace-nowrap">
            {successfulUses}/{totalUses} calls
          </p>
        </div>
      </div>

      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getSuccessRateColor(successRatePercentage)} transition-all duration-500`}
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
