import { PICKUP_LINES } from '../domain/pickupLines';

interface PickupLineCarouselProps {
  statistics?: Array<{ pickupLineId: string; successRate: number }>;
}

export function PickupLineCarousel({ statistics = [] }: PickupLineCarouselProps) {
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

  return (
    <div className="w-full max-w-2xl -mx-6 px-6 md:mx-0 md:px-0">
      {/* Horizontal scrollable container */}
      <div className="overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide">
        <div className="flex gap-4 pb-4">
          {sortedLines.map((line) => {
            const isTopPerformer = line.id === topPerformerId;
            
            return (
              <div
                key={line.id}
                className="flex-shrink-0 w-[calc(100vw-3rem)] md:w-full snap-center snap-always"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg h-[200px] flex flex-col justify-center relative">
                  {/* Top Performing Badge */}
                  {isTopPerformer && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-light-green text-black">
                        Top performing
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
      
      {/* Scroll Indicator Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {sortedLines.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-white/30"
          />
        ))}
      </div>
    </div>
  );
}
