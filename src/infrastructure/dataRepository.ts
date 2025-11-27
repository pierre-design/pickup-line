// LocalStorage-based implementation of DataRepository
import type { CallSession, PickupLineStatistics } from '../domain/types';
import type { DataRepository } from './interfaces';

const STORAGE_KEYS = {
  CALL_SESSIONS: 'pickup-coach:call-sessions',
  PICKUP_LINE_STATS: 'pickup-coach:pickup-line-stats',
} as const;

const MAX_SESSIONS = 100;

/**
 * LocalStorage-based data repository implementation
 * Handles persistence of call sessions and pickup line statistics
 */
export class LocalStorageDataRepository implements DataRepository {
  private memoryFallback: {
    sessions: CallSession[];
    statistics: PickupLineStatistics[];
  } = {
    sessions: [],
    statistics: [],
  };
  private useMemoryMode = false;
  private sessionsCache: CallSession[] | null = null;
  private statisticsCache: PickupLineStatistics[] | null = null;
  private sessionsCacheTimestamp = 0;
  private statisticsCacheTimestamp = 0;
  private readonly cacheExpiryMs = 5000; // 5 seconds cache expiry

  /**
   * Save a call session to LocalStorage
   * Automatically prunes old sessions if limit exceeded
   */
  async saveCallSession(session: CallSession): Promise<void> {
    try {
      const sessions = await this.getCallSessions();
      
      // Add new session
      sessions.push(this.serializeSession(session));
      
      // Auto-prune: keep only last 100 sessions
      if (sessions.length > MAX_SESSIONS) {
        sessions.splice(0, sessions.length - MAX_SESSIONS);
      }
      
      this.setItem(STORAGE_KEYS.CALL_SESSIONS, JSON.stringify(sessions));
      
      // Invalidate cache
      this.sessionsCache = null;
    } catch (error) {
      await this.handleStorageError(error, 'saveCallSession');
      
      // Fallback to memory
      if (this.useMemoryMode) {
        this.memoryFallback.sessions.push(session);
        if (this.memoryFallback.sessions.length > MAX_SESSIONS) {
          this.memoryFallback.sessions.splice(0, this.memoryFallback.sessions.length - MAX_SESSIONS);
        }
      }
    }
  }

  /**
   * Retrieve all call sessions from LocalStorage
   * Lazy loads data with caching
   */
  async getCallSessions(): Promise<CallSession[]> {
    if (this.useMemoryMode) {
      return [...this.memoryFallback.sessions];
    }

    // Check if cache is valid
    const now = Date.now();
    if (this.sessionsCache !== null && (now - this.sessionsCacheTimestamp) < this.cacheExpiryMs) {
      return [...this.sessionsCache];
    }

    try {
      const data = this.getItem(STORAGE_KEYS.CALL_SESSIONS);
      if (!data) {
        this.sessionsCache = [];
        this.sessionsCacheTimestamp = now;
        return [];
      }
      
      const sessions = JSON.parse(data) as CallSession[];
      const deserialized = sessions.map(this.deserializeSession);
      
      // Update cache
      this.sessionsCache = deserialized;
      this.sessionsCacheTimestamp = now;
      
      return [...deserialized];
    } catch (error) {
      console.error('Error reading call sessions:', error);
      return [];
    }
  }

  /**
   * Retrieve all pickup line statistics from LocalStorage
   * Lazy loads data with caching
   */
  async getPickupLineStatistics(): Promise<PickupLineStatistics[]> {
    if (this.useMemoryMode) {
      return [...this.memoryFallback.statistics];
    }

    // Check if cache is valid
    const now = Date.now();
    if (this.statisticsCache !== null && (now - this.statisticsCacheTimestamp) < this.cacheExpiryMs) {
      return [...this.statisticsCache];
    }

    try {
      const data = this.getItem(STORAGE_KEYS.PICKUP_LINE_STATS);
      if (!data) {
        this.statisticsCache = [];
        this.statisticsCacheTimestamp = now;
        return [];
      }
      
      const stats = JSON.parse(data) as PickupLineStatistics[];
      const deserialized = stats.map(this.deserializeStatistics);
      
      // Update cache
      this.statisticsCache = deserialized;
      this.statisticsCacheTimestamp = now;
      
      return [...deserialized];
    } catch (error) {
      console.error('Error reading pickup line statistics:', error);
      return [];
    }
  }

  /**
   * Update statistics for a specific pickup line
   */
  async updatePickupLineStatistics(stats: PickupLineStatistics): Promise<void> {
    try {
      const allStats = await this.getPickupLineStatistics();
      
      // Find existing stats for this pickup line
      const existingIndex = allStats.findIndex(s => s.pickupLineId === stats.pickupLineId);
      
      if (existingIndex >= 0) {
        allStats[existingIndex] = this.serializeStatistics(stats);
      } else {
        allStats.push(this.serializeStatistics(stats));
      }
      
      this.setItem(STORAGE_KEYS.PICKUP_LINE_STATS, JSON.stringify(allStats));
      
      // Invalidate cache
      this.statisticsCache = null;
    } catch (error) {
      await this.handleStorageError(error, 'updatePickupLineStatistics');
      
      // Fallback to memory
      if (this.useMemoryMode) {
        const existingIndex = this.memoryFallback.statistics.findIndex(
          s => s.pickupLineId === stats.pickupLineId
        );
        
        if (existingIndex >= 0) {
          this.memoryFallback.statistics[existingIndex] = stats;
        } else {
          this.memoryFallback.statistics.push(stats);
        }
      }
    }
  }

  /**
   * Handle storage errors with graceful degradation
   */
  private async handleStorageError(error: unknown, operation: string): Promise<void> {
    console.error(`Storage error during ${operation}:`, error);
    
    // Check if it's a quota exceeded error
    if (this.isQuotaExceededError(error)) {
      console.warn('Storage quota exceeded. Attempting to clear old data...');
      
      try {
        // Try to clear old sessions
        const sessions = await this.getCallSessions();
        if (sessions.length > 50) {
          // Keep only last 50 sessions
          const recentSessions = sessions.slice(-50);
          this.setItem(STORAGE_KEYS.CALL_SESSIONS, JSON.stringify(recentSessions));
          console.log('Cleared old session data');
          return;
        }
      } catch (clearError) {
        console.error('Failed to clear old data:', clearError);
      }
    }
    
    // If we can't recover, switch to memory mode
    console.warn('Switching to memory-only mode');
    this.useMemoryMode = true;
    
    // Try to load existing data into memory before switching
    if (this.memoryFallback.sessions.length === 0) {
      try {
        const sessions = await this.getCallSessions();
        this.memoryFallback.sessions = sessions;
      } catch {
        // Ignore errors when loading into memory
      }
    }
    
    if (this.memoryFallback.statistics.length === 0) {
      try {
        const stats = await this.getPickupLineStatistics();
        this.memoryFallback.statistics = stats;
      } catch {
        // Ignore errors when loading into memory
      }
    }
  }

  /**
   * Check if error is a quota exceeded error
   */
  private isQuotaExceededError(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  /**
   * Serialize a CallSession for storage (convert Dates to strings)
   */
  private serializeSession(session: CallSession): CallSession {
    return {
      ...session,
      startTime: session.startTime,
      endTime: session.endTime,
    };
  }

  /**
   * Deserialize a CallSession from storage (convert strings to Dates)
   */
  private deserializeSession(session: CallSession): CallSession {
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    };
  }

  /**
   * Serialize PickupLineStatistics for storage (convert Dates to strings)
   */
  private serializeStatistics(stats: PickupLineStatistics): PickupLineStatistics {
    return {
      ...stats,
      lastUsed: stats.lastUsed,
    };
  }

  /**
   * Deserialize PickupLineStatistics from storage (convert strings to Dates)
   */
  private deserializeStatistics(stats: PickupLineStatistics): PickupLineStatistics {
    return {
      ...stats,
      lastUsed: stats.lastUsed ? new Date(stats.lastUsed) : undefined,
    };
  }

  /**
   * Wrapper for localStorage.getItem with error handling
   */
  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error accessing localStorage for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Wrapper for localStorage.setItem with error handling
   */
  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      throw error; // Re-throw to be handled by handleStorageError
    }
  }

  /**
   * Clear all stored data (useful for testing or user-requested data clearing)
   */
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.CALL_SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.PICKUP_LINE_STATS);
      this.memoryFallback = { sessions: [], statistics: [] };
      this.useMemoryMode = false;
      
      // Clear caches
      this.sessionsCache = null;
      this.statisticsCache = null;
      this.sessionsCacheTimestamp = 0;
      this.statisticsCacheTimestamp = 0;
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}
