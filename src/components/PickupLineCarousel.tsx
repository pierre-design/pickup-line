import { useState, useRef, useEffect } from 'react';

import { SmartRecommendationEngine } from '../services/recommendationEngine';
import type { PickupLineStatistics } from '../domain/types';

interface PickupLineCarouselProps {
  statistics?: PickupLineStatistics[];
}

const recommendationEngine = new SmartRecommendationEngine();

export function PickupLineCarousel({ statistics = [] }: PickupLineCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to render text with handlebars as grey text
  const renderTextWithPlaceholders = (text: string) => {
    // Split on any text within curly braces
    const parts = text.split(/(\{[^}]+\})/);
    
    return (
      <>
        {parts.map((part, index) => {
          // Check if this part is a placeholder (within curly braces)
          if (part.startsWith('{') && part.endsWith('}')) {
            // Remove the braces and render as grey text
            const placeholderText = part.slice(1, -1);
            return (
              <span key={index} className="text-black/30">
                {placeholderText}
              </span>
            );
          }
          // Regular text
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  // Get smart recommendation and sorted lines
  const recommendation = recommendationEngine.getRecommendation(statistics);
  const sortedLines = recommendationEngine.getSortedPickupLines(statistics);
  const recommendedId = recommendation.recommendedLine.id;
  const recommendationExplanation = recommendationEngine.getRecommendationExplanation(recommendation);

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
        <div className="flex gap-4 pb-4 pl-6 pr-12 md:px-0">
          {sortedLines.map((line) => {
            const isRecommended = line.id === recommendedId;
            
            return (
              <div
                key={line.id}
                className={`flex-shrink-0 w-[calc(100vw-3rem)] md:w-full snap-start`}
              >
                <div className="bg-white rounded-2xl shadow-lg h-[320px] flex flex-col items-start relative p-6">
                  {/* Pickup Line Text */}
                  <p 
                    className="text-2xl sm:text-3xl font-bold leading-snug text-left flex-1" 
                    style={{ color: '#000000' }}
                  >
                    {renderTextWithPlaceholders(line.text)}
                  </p>
                  
                  {/* Recommended Badge - Bottom Right */}
                  {isRecommended && (
                    <div className="absolute bottom-6 right-6">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-light-green text-black"
                        title={recommendationExplanation}
                      >
                        Recommended
                      </span>
                    </div>
                  )}
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
