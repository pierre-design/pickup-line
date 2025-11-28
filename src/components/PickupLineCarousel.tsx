import { useState, useRef, useEffect } from 'react';

import { SmartRecommendationEngine } from '../services/recommendationEngine';
import type { PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

interface PickupLineCarouselProps {
  statistics?: PickupLineStatistics[];
}

const recommendationEngine = new SmartRecommendationEngine();

export function PickupLineCarousel({ statistics = [] }: PickupLineCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUpdatingRecommendation, setIsUpdatingRecommendation] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousRecommendedIdRef = useRef<string | null>(null);

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

  // Get smart recommendation but keep original order
  const recommendation = recommendationEngine.getRecommendation(statistics);
  const recommendedId = recommendation.recommendedLine.id;
  const recommendationExplanation = recommendationEngine.getRecommendationExplanation(recommendation);
  
  // Use original PICKUP_LINES order instead of sorted
  const lines = PICKUP_LINES;

  // Auto-scroll to recommended pickup line when recommendation changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if recommendation changed
    if (previousRecommendedIdRef.current !== null && previousRecommendedIdRef.current !== recommendedId) {
      // Show loading indicator
      setIsUpdatingRecommendation(true);
      
      // Find the index of the recommended line
      const recommendedIndex = lines.findIndex(line => line.id === recommendedId);
      
      if (recommendedIndex !== -1) {
        // Smooth scroll to the recommended line after a brief delay
        setTimeout(() => {
          const itemWidth = container.scrollWidth / lines.length;
          const scrollLeft = recommendedIndex * itemWidth;
          
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
          
          // Hide loading indicator after scroll completes
          setTimeout(() => {
            setIsUpdatingRecommendation(false);
          }, 800);
        }, 1000);
      } else {
        setIsUpdatingRecommendation(false);
      }
    }
    
    // Update previous recommendation reference
    previousRecommendedIdRef.current = recommendedId;
  }, [recommendedId, lines]);

  // Track scroll position to update active dot
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.scrollWidth / lines.length;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(index, lines.length - 1));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lines.length]);

  return (
    <div className="w-full max-w-2xl">
      {/* Horizontal scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-scroll overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-6 md:mx-0"
        style={{ scrollPaddingLeft: '1.5rem', scrollPaddingRight: '1.5rem' }}
      >
        <div className="flex gap-4 pb-4 pl-6 pr-6 md:px-0">
          {lines.map((line) => {
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
        {lines.map((_, index) => (
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

      {/* Recommendation Update Loading Modal */}
      {isUpdatingRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Spinner */}
              <div className="w-8 h-8 border-3 border-light-green border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              
              {/* Text */}
              <div>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  Finding your best pickup line
                </p>
                <p className="text-sm text-gray-600">
                  Analyzing performance data...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
