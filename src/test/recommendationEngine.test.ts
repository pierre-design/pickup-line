import { SmartRecommendationEngine } from '../services/recommendationEngine';
import type { PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

describe('SmartRecommendationEngine', () => {
  let engine: SmartRecommendationEngine;

  beforeEach(() => {
    engine = new SmartRecommendationEngine();
  });

  describe('Fair Testing Phase', () => {
    it('should recommend untested lines first', () => {
      const statistics: PickupLineStatistics[] = [];
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('fair_testing');
      expect(result.confidence).toBe('low');
      expect(PICKUP_LINES.some(line => line.id === result.recommendedLine.id)).toBe(true);
    });

    it('should recommend line with fewest attempts during fair testing', () => {
      const statistics: PickupLineStatistics[] = [
        {
          pickupLineId: 'pl-1',
          totalUses: 2,
          successfulUses: 1,
          successRate: 0.5,
          lastUsed: new Date(),
        },
        {
          pickupLineId: 'pl-2',
          totalUses: 1,
          successfulUses: 0,
          successRate: 0,
          lastUsed: new Date(),
        },
      ];
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('fair_testing');
      // pl-2 has 1 attempt, but pl-3 through pl-7 have 0 attempts
      // So it should pick the first untested line (pl-3) since 0 < 1
      expect(result.recommendedLine.id).toBe('pl-3'); // First untested line
    });

    it('should recommend completely untested line over partially tested', () => {
      const statistics: PickupLineStatistics[] = [
        {
          pickupLineId: 'pl-1',
          totalUses: 2,
          successfulUses: 1,
          successRate: 0.5,
          lastUsed: new Date(),
        },
      ];
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('fair_testing');
      expect(result.recommendedLine.id).not.toBe('pl-1'); // Should pick untested line
    });
  });

  describe('Performance-Based Recommendation', () => {
    it('should recommend best performer after fair testing', () => {
      const statistics: PickupLineStatistics[] = PICKUP_LINES.map((line, index) => ({
        pickupLineId: line.id,
        totalUses: 5,
        successfulUses: index === 0 ? 4 : 2, // pl-1 has 80% success rate, others 40%
        successRate: index === 0 ? 0.8 : 0.4,
        lastUsed: new Date(),
      }));
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('best_performer');
      expect(result.recommendedLine.id).toBe('pl-1');
      expect(result.confidence).toBe('high');
    });

    it('should have medium confidence with fewer attempts', () => {
      const statistics: PickupLineStatistics[] = PICKUP_LINES.map((line, index) => ({
        pickupLineId: line.id,
        totalUses: 3, // Less than MIN_ATTEMPTS_FOR_CONFIDENCE (5)
        successfulUses: index === 0 ? 3 : 1,
        successRate: index === 0 ? 1.0 : 0.33,
        lastUsed: new Date(),
      }));
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('best_performer');
      expect(result.confidence).toBe('medium');
    });
  });

  describe('Performance-Based Selection', () => {
    it('should select actual best performer regardless of order', () => {
      // Create a scenario where the "best" performer is actually underperforming vs others
      const statistics: PickupLineStatistics[] = [
        {
          pickupLineId: 'pl-1',
          totalUses: 15, // Enough data to detect decline
          successfulUses: 3, // 20% success rate - significantly below others
          successRate: 0.2,
          lastUsed: new Date(),
        },
        {
          pickupLineId: 'pl-2',
          totalUses: 10,
          successfulUses: 7, // 70% success rate
          successRate: 0.7,
          lastUsed: new Date(),
        },
        ...PICKUP_LINES.slice(2).map(line => ({
          pickupLineId: line.id,
          totalUses: 5,
          successfulUses: 3, // 60% success rate
          successRate: 0.6,
          lastUsed: new Date(),
        })),
      ];
      
      const result = engine.getRecommendation(statistics);
      
      // pl-2 has the highest success rate (70%), so it should be the best performer
      // pl-1 would be detected as declining if it were sorted first, but since pl-2 is better,
      // the algorithm correctly identifies pl-2 as the best performer
      expect(result.reason).toBe('best_performer');
      expect(result.recommendedLine.id).toBe('pl-2'); // Actually the best performer
    });
  });

  describe('Fallback Recommendation', () => {
    it('should provide fallback when no statistics available', () => {
      // This shouldn't happen in practice due to fair testing, but test anyway
      const statistics: PickupLineStatistics[] = [];
      
      // Mock the fair testing to return null (shouldn't happen)
      const originalCheckFairTesting = (engine as any).checkFairTesting;
      (engine as any).checkFairTesting = () => null;
      
      const result = engine.getRecommendation(statistics);
      
      expect(result.reason).toBe('fallback');
      expect(result.confidence).toBe('low');
      expect(result.recommendedLine.id).toBe('pl-1');
      
      // Restore original method
      (engine as any).checkFairTesting = originalCheckFairTesting;
    });
  });

  describe('Sorted Pickup Lines', () => {
    it('should put recommended line first', () => {
      const statistics: PickupLineStatistics[] = [
        {
          pickupLineId: 'pl-2',
          totalUses: 5,
          successfulUses: 4,
          successRate: 0.8,
          lastUsed: new Date(),
        },
        {
          pickupLineId: 'pl-1',
          totalUses: 5,
          successfulUses: 2,
          successRate: 0.4,
          lastUsed: new Date(),
        },
      ];
      
      const sortedLines = engine.getSortedPickupLines(statistics);
      const recommendation = engine.getRecommendation(statistics);
      
      expect(sortedLines[0].id).toBe(recommendation.recommendedLine.id);
    });
  });

  describe('Recommendation Explanations', () => {
    it('should provide appropriate explanations for each reason', () => {
      const testCases = [
        { reason: 'fair_testing' as const, expected: 'Testing for optimal performance' },
        { reason: 'best_performer' as const, expected: 'Top performer (high confidence)' },
        { reason: 'performance_decline' as const, expected: 'Switching to better alternative' },
        { reason: 'fallback' as const, expected: 'Default recommendation' },
      ];

      testCases.forEach(({ reason, expected }) => {
        const result = {
          recommendedLine: PICKUP_LINES[0],
          reason,
          confidence: 'high' as const,
        };
        
        const explanation = engine.getRecommendationExplanation(result);
        expect(explanation).toBe(expected);
      });
    });
  });
});