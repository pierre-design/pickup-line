// Smart Recommendation Engine - Ensures fair testing and optimal recommendations
import type { PickupLine, PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

export interface RecommendationResult {
  recommendedLine: PickupLine;
  reason: 'fair_testing' | 'best_performer' | 'fallback' | 'performance_decline';
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Smart recommendation engine that ensures fair testing of all pickup lines
 * and recommends the best performer once sufficient data is available
 */
export class SmartRecommendationEngine {
  private readonly MIN_ATTEMPTS_FOR_FAIR_TESTING = 3;
  private readonly MIN_ATTEMPTS_FOR_CONFIDENCE = 5;
  private readonly PERFORMANCE_DECLINE_THRESHOLD = 0.15; // 15% decline triggers switch


  /**
   * Get the recommended pickup line based on current statistics
   */
  getRecommendation(statistics: PickupLineStatistics[]): RecommendationResult {
    // Phase 1: Fair Testing - Ensure all lines get minimum attempts
    const fairTestingResult = this.checkFairTesting(statistics);
    if (fairTestingResult) {
      return fairTestingResult;
    }

    // Phase 2: Performance-Based Recommendation
    const performanceResult = this.getPerformanceBasedRecommendation(statistics);
    if (performanceResult) {
      return performanceResult;
    }

    // Phase 3: Fallback - Should rarely happen
    return this.getFallbackRecommendation();
  }

  /**
   * Check if we need to continue fair testing phase
   */
  private checkFairTesting(statistics: PickupLineStatistics[]): RecommendationResult | null {
    // Find lines that haven't been tested enough
    const undertestedLines = PICKUP_LINES.filter(line => {
      const stat = statistics.find(s => s.pickupLineId === line.id);
      return !stat || stat.totalUses < this.MIN_ATTEMPTS_FOR_FAIR_TESTING;
    });

    if (undertestedLines.length === 0) {
      return null; // Fair testing complete
    }

    // Recommend the line with the fewest attempts (or never tested)
    // Sort by attempts ascending, then by ID for consistency
    const sortedUndertested = undertestedLines.sort((a, b) => {
      const statA = statistics.find(s => s.pickupLineId === a.id);
      const statB = statistics.find(s => s.pickupLineId === b.id);
      
      const attemptsA = statA?.totalUses || 0;
      const attemptsB = statB?.totalUses || 0;
      
      if (attemptsA !== attemptsB) {
        return attemptsA - attemptsB;
      }
      
      // If same attempts, sort by ID for consistency
      return a.id.localeCompare(b.id);
    });
    
    const leastTestedLine = sortedUndertested[0];

    return {
      recommendedLine: leastTestedLine,
      reason: 'fair_testing',
      confidence: 'low'
    };
  }

  /**
   * Get recommendation based on performance data
   */
  private getPerformanceBasedRecommendation(statistics: PickupLineStatistics[]): RecommendationResult | null {
    // Filter to lines with sufficient data
    const testedLines = statistics.filter(stat => 
      stat.totalUses >= this.MIN_ATTEMPTS_FOR_FAIR_TESTING
    );

    if (testedLines.length === 0) {
      return null;
    }

    // Sort by success rate descending
    const sortedByPerformance = testedLines.sort((a, b) => b.successRate - a.successRate);
    const bestPerformer = sortedByPerformance[0];

    // Check if current best performer is declining
    const isCurrentBestDeclining = this.isPerformanceDeclining(bestPerformer, statistics);
    
    if (isCurrentBestDeclining && sortedByPerformance.length > 1) {
      // Switch to next best performer
      const nextBest = sortedByPerformance[1];
      const nextBestLine = PICKUP_LINES.find(line => line.id === nextBest.pickupLineId);
      
      if (nextBestLine) {
        return {
          recommendedLine: nextBestLine,
          reason: 'performance_decline',
          confidence: nextBest.totalUses >= this.MIN_ATTEMPTS_FOR_CONFIDENCE ? 'high' : 'medium'
        };
      }
    }

    // Recommend the best performer
    const bestLine = PICKUP_LINES.find(line => line.id === bestPerformer.pickupLineId);
    
    if (bestLine) {
      return {
        recommendedLine: bestLine,
        reason: 'best_performer',
        confidence: bestPerformer.totalUses >= this.MIN_ATTEMPTS_FOR_CONFIDENCE ? 'high' : 'medium'
      };
    }

    return null;
  }

  /**
   * Check if a pickup line's performance is declining
   */
  private isPerformanceDeclining(stat: PickupLineStatistics, allStatistics: PickupLineStatistics[]): boolean {
    // This is a simplified check - in a real implementation, you'd want to track
    // individual session outcomes to calculate recent performance
    // For now, we'll use a heuristic based on overall performance vs expected performance
    
    if (stat.totalUses < this.MIN_ATTEMPTS_FOR_CONFIDENCE * 2) {
      return false; // Not enough data to determine decline
    }

    // If success rate is significantly below the average of all tested lines
    const allTestedStats = allStatistics.filter(s => 
      s.totalUses >= this.MIN_ATTEMPTS_FOR_FAIR_TESTING && s.pickupLineId !== stat.pickupLineId
    );
    
    if (allTestedStats.length < 1) {
      return false; // Need at least one other line to compare
    }

    const averageSuccessRate = allTestedStats.reduce((sum, s) => sum + s.successRate, 0) / allTestedStats.length;
    const performanceGap = averageSuccessRate - stat.successRate;

    return performanceGap > this.PERFORMANCE_DECLINE_THRESHOLD;
  }

  /**
   * Fallback recommendation when no data is available
   */
  private getFallbackRecommendation(): RecommendationResult {
    // Default to the first pickup line
    return {
      recommendedLine: PICKUP_LINES[0],
      reason: 'fallback',
      confidence: 'low'
    };
  }

  /**
   * Get all pickup lines sorted by recommendation priority
   */
  getSortedPickupLines(statistics: PickupLineStatistics[]): PickupLine[] {
    const recommendation = this.getRecommendation(statistics);
    const recommendedId = recommendation.recommendedLine.id;

    // Put recommended line first, then sort others by performance
    return [...PICKUP_LINES].sort((a, b) => {
      if (a.id === recommendedId) return -1;
      if (b.id === recommendedId) return 1;

      // Sort others by success rate (if available)
      const statA = statistics.find(s => s.pickupLineId === a.id);
      const statB = statistics.find(s => s.pickupLineId === b.id);
      
      const rateA = statA?.successRate || 0;
      const rateB = statB?.successRate || 0;
      
      return rateB - rateA;
    });
  }

  /**
   * Get recommendation explanation for UI display
   */
  getRecommendationExplanation(result: RecommendationResult): string {
    switch (result.reason) {
      case 'fair_testing':
        return 'Testing for optimal performance';
      case 'best_performer':
        return `Top performer (${result.confidence} confidence)`;
      case 'performance_decline':
        return 'Switching to better alternative';
      case 'fallback':
        return 'Default recommendation';
      default:
        return 'Recommended';
    }
  }
}