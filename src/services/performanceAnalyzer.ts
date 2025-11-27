// Performance Analyzer - Analyzes performance data and provides recommendations
import type { PickupLine, PickupLineStatistics } from '../domain/types';
import type { PerformanceAnalyzer } from './interfaces';
import type { DataRepository } from '../infrastructure/interfaces';
import { PICKUP_LINES } from '../domain/pickupLines';

/**
 * Analyzes performance data and provides recommendations for pickup lines
 * Requirements: 4.5, 5.1, 6.1, 6.2, 6.4, 7.3, 7.4
 */
export class DefaultPerformanceAnalyzer implements PerformanceAnalyzer {
  private readonly dataRepository: DataRepository;
  private statisticsCache: PickupLineStatistics[] = [];
  private recommendedLinesCache: PickupLine[] | null = null;
  private sortedStatisticsCache: PickupLineStatistics[] | null = null;
  private cacheVersion = 0;

  constructor(dataRepository: DataRepository) {
    this.dataRepository = dataRepository;
  }

  /**
   * Update statistics for a pickup line after a call session
   * Requirements: 5.1
   */
  async updateStatistics(pickupLineId: string, outcome: 'stayed' | 'left'): Promise<void> {
    const allStats = await this.dataRepository.getPickupLineStatistics();
    const existingStat = allStats.find(s => s.pickupLineId === pickupLineId);

    let updatedStat: PickupLineStatistics;

    if (existingStat) {
      // Update existing statistics
      const newTotalUses = existingStat.totalUses + 1;
      const newSuccessfulUses = existingStat.successfulUses + (outcome === 'stayed' ? 1 : 0);
      
      updatedStat = {
        pickupLineId,
        totalUses: newTotalUses,
        successfulUses: newSuccessfulUses,
        successRate: this.calculateSuccessRate(newSuccessfulUses, newTotalUses),
        lastUsed: new Date(),
      };
    } else {
      // Create new statistics entry
      const successfulUses = outcome === 'stayed' ? 1 : 0;
      
      updatedStat = {
        pickupLineId,
        totalUses: 1,
        successfulUses,
        successRate: this.calculateSuccessRate(successfulUses, 1),
        lastUsed: new Date(),
      };
    }

    await this.dataRepository.updatePickupLineStatistics(updatedStat);
    
    // Update cache
    await this.refreshCache();
  }

  /**
   * Get success rate for a specific pickup line
   * Requirements: 5.2
   */
  getSuccessRate(pickupLineId: string): number {
    const stat = this.statisticsCache.find(s => s.pickupLineId === pickupLineId);
    return stat ? stat.successRate : 0;
  }

  /**
   * Get recommended pickup lines (excluding low-performing ones)
   * Requirements: 4.5, 6.2, 6.4
   * Memoized for performance
   */
  getRecommendedPickupLines(): PickupLine[] {
    // Return cached result if available
    if (this.recommendedLinesCache !== null) {
      return this.recommendedLinesCache;
    }

    // Filter out lines with success rate < 30% and at least 10 uses
    const excludedIds = this.statisticsCache
      .filter(stat => stat.totalUses >= 10 && stat.successRate < 0.3)
      .map(stat => stat.pickupLineId);

    const recommended = PICKUP_LINES.filter(pl => !excludedIds.includes(pl.id));

    // If all lines are excluded, return the line with highest success rate
    if (recommended.length === 0) {
      const sortedBySuccessRate = [...this.statisticsCache].sort(
        (a, b) => b.successRate - a.successRate
      );
      
      if (sortedBySuccessRate.length > 0) {
        const bestLine = PICKUP_LINES.find(
          pl => pl.id === sortedBySuccessRate[0].pickupLineId
        );
        this.recommendedLinesCache = bestLine ? [bestLine] : PICKUP_LINES;
        return this.recommendedLinesCache;
      }
      
      this.recommendedLinesCache = PICKUP_LINES;
      return this.recommendedLinesCache;
    }

    // Sort by success rate descending
    const sorted = recommended.sort((a, b) => {
      const statA = this.statisticsCache.find(s => s.pickupLineId === a.id);
      const statB = this.statisticsCache.find(s => s.pickupLineId === b.id);
      
      const rateA = statA ? statA.successRate : 0;
      const rateB = statB ? statB.successRate : 0;
      
      return rateB - rateA;
    });

    this.recommendedLinesCache = sorted;
    return sorted;
  }

  /**
   * Get all statistics sorted by success rate descending
   * Requirements: 7.3, 7.4
   * Memoized for performance
   */
  getAllStatistics(): PickupLineStatistics[] {
    // Return cached result if available
    if (this.sortedStatisticsCache !== null) {
      return this.sortedStatisticsCache;
    }

    // Return all statistics sorted by success rate descending
    this.sortedStatisticsCache = [...this.statisticsCache].sort((a, b) => b.successRate - a.successRate);
    return this.sortedStatisticsCache;
  }

  /**
   * Calculate success rate
   * Requirements: 5.2
   */
  private calculateSuccessRate(successfulUses: number, totalUses: number): number {
    if (totalUses === 0) {
      return 0;
    }
    return successfulUses / totalUses;
  }

  /**
   * Refresh the statistics cache from the repository
   * Invalidates memoized caches
   */
  private async refreshCache(): Promise<void> {
    this.statisticsCache = await this.dataRepository.getPickupLineStatistics();
    this.invalidateCaches();
  }

  /**
   * Invalidate all memoized caches
   */
  private invalidateCaches(): void {
    this.recommendedLinesCache = null;
    this.sortedStatisticsCache = null;
    this.cacheVersion++;
  }

  /**
   * Initialize the analyzer by loading statistics from repository
   */
  async initialize(): Promise<void> {
    await this.refreshCache();
  }
}
