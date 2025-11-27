import { useState, useRef, useEffect } from 'react';
import { PICKUP_LINES } from '../domain/pickupLines';

interface PickupLineCarouselProps {
  statistics?: Array<{ pickupLineId: string; successRate: number }>;
}

export function PickupLineCarousel({ statistics = [] }: PickupLineCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Find the top performing pickup line
  const topPerformerId = statistics.length > 0
    ? statistics.reduce((top, current) => 
        current.successRate > top.successRate ? current : top
      ).pickupLineId
    : null;

  // Sort pickup lines: top performer first, then the rest
  const sortedLines = [...PICKUP_LINES].sort((a, b) => {
    if (a.id === topPerformerId) return -1;
    if (b.id === topPerformerId) return 1;
    return 0;
  });

  // Track scroll position to update active dot
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.scrollWidth / sortedLines.length;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(index, sortedLines.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sortedLines.length]);

  return (
    <div className="w-full max-w-2xl">
      {/* Horizontal scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-6 md:mx-0"
        style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
      >
        <div className="flex gap-4 pb-4 px-6 md:px-0">
          {sortedLines.map((line, index) => {
            const isTopPerformer = line.id === topPerformerId;
            const isLast = index === sortedLines.length - 1;
            
            return (
              <div
                key={line.id}
                className={`flex-shrink-0 w-[calc(100vw-3rem)] md:w-full snap-start ${isLast ? 'mr-6 md:mr-0' : ''}`}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg h-[200px] flex flex-col justify-center relative">
                  {/* Recommended Badge */}
                  {isTopPerformer && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-light-green text-black">
                        Recommended
                      </span>
                    </div>
                  )}
                  
                  {/* Pickup Line Text */}
                  <p 
                    className="text-2xl sm:text-3xl font-bold leading-snug text-center" 
                    style={{ color: '#000000' }}
                  >
                    {line.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll Indicator Dots - iOS style with smooth stretch animation */}
      <div className="flex justify-center gap-2 mt-4">
        {sortedLines.map((_, index) => (
          <div
            key={index}
            style={{
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={`h-2 rounded-full ${
              index === activeIndex 
                ? 'w-6 bg-white' 
                : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
