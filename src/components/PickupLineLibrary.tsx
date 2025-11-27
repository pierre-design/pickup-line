import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { PickupLine, PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

interface PickupLineLibraryProps {
  statistics: PickupLineStatistics[];
  onSelectPickupLine?: (pickupLine: PickupLine) => void;
}

/**
 * Pickup Line Library Component
 * Displays all 15 pickup lines with their performance statistics
 * Requirements: 5.3, 5.4, 6.3
 */
export function PickupLineLibrary({ statistics, onSelectPickupLine }: PickupLineLibraryProps) {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 }); // Show more items initially
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 150; // Approximate height of each card in pixels
  const useVirtualization = PICKUP_LINES.length > 20; // Only virtualize if more than 20 items

  const handleLineClick = (pickupLine: PickupLine) => {
    // Toggle detailed view
    setSelectedLineId(selectedLineId === pickupLine.id ? null : pickupLine.id);
    onSelectPickupLine?.(pickupLine);
  };

  // Prepare pickup line data with statistics (memoized)
  const pickupLineData = useMemo(() => {
    return PICKUP_LINES.map((pickupLine) => {
      const stats = statistics.find(s => s.pickupLineId === pickupLine.id);
      const isExcluded = !!(stats && stats.totalUses >= 10 && stats.successRate < 0.3);
      const showSuccessRate = !!(stats && stats.totalUses >= 5);
      const isSelected = selectedLineId === pickupLine.id;

      return {
        pickupLine,
        stats,
        isExcluded,
        showSuccessRate,
        isSelected,
      };
    });
  }, [statistics, selectedLineId]);

  // Get visible items for virtualization (memoized)
  const visibleItems = useMemo(() => {
    return pickupLineData.slice(visibleRange.start, visibleRange.end);
  }, [pickupLineData, visibleRange]);

  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;

    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + 3; // Buffer of 3 items

    setVisibleRange({ start: Math.max(0, start), end: Math.min(pickupLineData.length, end) });
  }, [pickupLineData.length, itemHeight]);

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
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">Pickup Line Library</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
        Tap any line to view detailed statistics
      </p>

      {/* Pickup Lines Grid with Optional Virtualization */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[600px] overflow-y-auto"
        role="list" 
        aria-label="Available pickup lines"
      >
        {useVirtualization ? (
          <div style={{ height: `${Math.ceil(pickupLineData.length / 2) * itemHeight}px`, position: 'relative' }}>
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              style={{ 
                transform: `translateY(${Math.floor(visibleRange.start / 2) * itemHeight}px)`,
                position: 'absolute',
                width: '100%'
              }}
            >
              {visibleItems.map((item) => (
                <PickupLineCard
                  key={item.pickupLine.id}
                  pickupLine={item.pickupLine}
                  statistics={item.stats}
                  isExcluded={item.isExcluded}
                  showSuccessRate={item.showSuccessRate}
                  isSelected={item.isSelected}
                  onClick={() => handleLineClick(item.pickupLine)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {pickupLineData.map((item) => (
              <PickupLineCard
                key={item.pickupLine.id}
                pickupLine={item.pickupLine}
                statistics={item.stats}
                isExcluded={item.isExcluded}
                showSuccessRate={item.showSuccessRate}
                isSelected={item.isSelected}
                onClick={() => handleLineClick(item.pickupLine)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PickupLineCardProps {
  pickupLine: PickupLine;
  statistics?: PickupLineStatistics;
  isExcluded: boolean;
  showSuccessRate: boolean;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Individual pickup line card
 */
function PickupLineCard({
  pickupLine,
  statistics,
  isExcluded,
  showSuccessRate,
  isSelected,
  onClick,
}: PickupLineCardProps) {
  const successRatePercentage = statistics ? statistics.successRate * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all
        min-h-[44px] touch-manipulation
        ${isExcluded
          ? 'bg-gray-100 border-gray-300 opacity-60 hover:opacity-80 active:opacity-90'
          : 'bg-white border-gray-200 hover:border-primary hover:shadow-md active:shadow-lg'
        }
        ${isSelected ? 'border-primary shadow-lg' : ''}
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
      role="listitem"
      aria-label={`${pickupLine.text}${isExcluded ? ' (excluded from suggestions)' : ''}${showSuccessRate && statistics ? `, success rate ${(statistics.successRate * 100).toFixed(0)}%` : ''}`}
      aria-expanded={isSelected}
    >
      {/* Category Tag */}
      {pickupLine.category && (
        <span className="inline-block mb-1.5 sm:mb-2 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-md">
          {pickupLine.category}
        </span>
      )}

      {/* Pickup Line Text */}
      <p className={`text-xs sm:text-sm font-medium leading-relaxed mb-2 sm:mb-3 break-words ${isExcluded ? 'text-gray-500' : 'text-gray-900'}`}>
        {pickupLine.text}
      </p>

      {/* Success Rate Badge and Excluded Indicator */}
      <div className="flex items-center justify-between gap-2">
        {showSuccessRate && statistics ? (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div
              className={`
                px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold
                ${successRatePercentage >= 70 ? 'bg-success text-white' :
                  successRatePercentage >= 50 ? 'bg-blue-500 text-white' :
                  successRatePercentage >= 30 ? 'bg-warning text-white' :
                  'bg-error text-white'}
              `}
            >
              {successRatePercentage.toFixed(0)}%
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {statistics.totalUses} {statistics.totalUses === 1 ? 'use' : 'uses'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">
            {statistics ? `${statistics.totalUses} ${statistics.totalUses === 1 ? 'use' : 'uses'}` : 'Not used yet'}
          </span>
        )}

        {isExcluded && (
          <div 
            className="flex items-center gap-1 text-gray-500 flex-shrink-0" 
            title="Excluded from suggestions due to low performance"
            aria-label="Excluded from suggestions due to low performance"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs hidden sm:inline" aria-hidden="true">Excluded</span>
          </div>
        )}
      </div>

      {/* Detailed Statistics (shown when selected) */}
      {isSelected && statistics && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-1.5 sm:space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Total Uses:</span>
            <span className="font-semibold text-gray-900">{statistics.totalUses}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Successful:</span>
            <span className="font-semibold text-success">{statistics.successfulUses}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Failed:</span>
            <span className="font-semibold text-error">{statistics.totalUses - statistics.successfulUses}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Success Rate:</span>
            <span className="font-semibold text-gray-900">{successRatePercentage.toFixed(1)}%</span>
          </div>
          {statistics.lastUsed && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Last Used:</span>
              <span className="font-semibold text-gray-900">
                {new Date(statistics.lastUsed).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
