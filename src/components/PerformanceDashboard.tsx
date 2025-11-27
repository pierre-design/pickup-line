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
  const [sortBy, setSortBy] = useState<'successRate' | 'alphabetical'>('alphabetical');
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 100;



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
    <div className="w-full h-full flex flex-col">
      {/* Sort Controls */}
      <div className="flex justify-center gap-3 mb-6" role="group" aria-label="Sort options">
        <button
          onClick={() => setSortBy('successRate')}
          className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] ${
            sortBy === 'successRate'
              ? 'bg-white text-dark-green'
              : 'border-2 border-white text-white hover:bg-white/10'
          }`}
          aria-label="Sort by top performers"
          aria-pressed={sortBy === 'successRate'}
        >
          Top
        </button>
        <button
          onClick={() => setSortBy('alphabetical')}
          className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white min-h-[44px] ${
            sortBy === 'alphabetical'
              ? 'bg-white text-dark-green'
              : 'border-2 border-white text-white hover:bg-white/10'
          }`}
          aria-label="Sort alphabetically"
          aria-pressed={sortBy === 'alphabetical'}
        >
          Alphabetically
        </button>
      </div>

      {/* Pickup Lines List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-2" 
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

  const successRatePercentage = successRate * 100;

  return (
    <div 
      className="group rounded-lg bg-dark-green/50 border border-[#006B3A] p-6 hover:scale-[1.02] hover:bg-white hover:shadow-lg transition-all duration-200 cursor-pointer" 
      role="listitem"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-dark-green leading-relaxed break-words transition-colors">
            {pickupLine?.text || 'Unknown pickup line'}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {pickupLine?.category && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-light-green bg-light-green/20 rounded-md group-hover:bg-light-green/30">
                {pickupLine.category}
              </span>
            )}
            <span className="inline-block px-2 py-1 text-xs font-medium text-white/80 bg-white/10 rounded-md group-hover:bg-dark-green/20">
              Used {totalUses}x
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className={`text-2xl font-extrabold transition-colors ${
            successRatePercentage >= 80 ? 'text-medium-green' : 'text-pink'
          } group-hover:text-dark-green`}>
            {successRatePercentage.toFixed(0)}%
          </p>
          <p className="text-xs text-white/60 group-hover:text-dark-green/60 mt-1 whitespace-nowrap transition-colors">
            {successfulUses}/{totalUses} success
          </p>
        </div>
      </div>

      <div className="w-full h-2 bg-white/10 group-hover:bg-dark-green/20 rounded-full overflow-hidden transition-colors">
        <div
          className={`h-full transition-all duration-500 ${
            successRatePercentage >= 80 ? 'bg-medium-green' : 'bg-pink'
          }`}
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
