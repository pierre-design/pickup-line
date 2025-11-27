// Tests for LocalStorageDataRepository
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageDataRepository } from './dataRepository';
import type { CallSession, PickupLineStatistics } from '../domain/types';

describe('LocalStorageDataRepository', () => {
  let repository: LocalStorageDataRepository;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    repository = new LocalStorageDataRepository();
  });

  describe('saveCallSession and getCallSessions', () => {
    it('should save and retrieve a call session', async () => {
      const session: CallSession = {
        id: 'session-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:05:00Z'),
        pickupLineUsed: 'pl-1',
        outcome: 'stayed',
      };

      await repository.saveCallSession(session);
      const sessions = await repository.getCallSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].outcome).toBe('stayed');
      expect(sessions[0].startTime).toBeInstanceOf(Date);
      expect(sessions[0].endTime).toBeInstanceOf(Date);
    });

    it('should save multiple sessions', async () => {
      const session1: CallSession = {
        id: 'session-1',
        startTime: new Date('2024-01-01T10:00:00Z'),
        pickupLineUsed: 'pl-1',
        outcome: 'stayed',
      };

      const session2: CallSession = {
        id: 'session-2',
        startTime: new Date('2024-01-01T11:00:00Z'),
        pickupLineUsed: 'pl-2',
        outcome: 'left',
      };

      await repository.saveCallSession(session1);
      await repository.saveCallSession(session2);
      
      const sessions = await repository.getCallSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[1].id).toBe('session-2');
    });

    it('should auto-prune sessions when exceeding 100', async () => {
      // Create 105 sessions
      for (let i = 0; i < 105; i++) {
        const session: CallSession = {
          id: `session-${i}`,
          startTime: new Date(),
          pickupLineUsed: 'pl-1',
          outcome: 'stayed',
        };
        await repository.saveCallSession(session);
      }

      const sessions = await repository.getCallSessions();
      
      // Should only keep last 100
      expect(sessions).toHaveLength(100);
      // First session should be session-5 (0-4 were pruned)
      expect(sessions[0].id).toBe('session-5');
      // Last session should be session-104
      expect(sessions[99].id).toBe('session-104');
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await repository.getCallSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('getPickupLineStatistics and updatePickupLineStatistics', () => {
    it('should save and retrieve pickup line statistics', async () => {
      const stats: PickupLineStatistics = {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
        lastUsed: new Date('2024-01-01T10:00:00Z'),
      };

      await repository.updatePickupLineStatistics(stats);
      const allStats = await repository.getPickupLineStatistics();

      expect(allStats).toHaveLength(1);
      expect(allStats[0].pickupLineId).toBe('pl-1');
      expect(allStats[0].totalUses).toBe(10);
      expect(allStats[0].successfulUses).toBe(7);
      expect(allStats[0].successRate).toBe(0.7);
      expect(allStats[0].lastUsed).toBeInstanceOf(Date);
    });

    it('should update existing statistics', async () => {
      const initialStats: PickupLineStatistics = {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
      };

      await repository.updatePickupLineStatistics(initialStats);

      const updatedStats: PickupLineStatistics = {
        pickupLineId: 'pl-1',
        totalUses: 11,
        successfulUses: 8,
        successRate: 0.727,
      };

      await repository.updatePickupLineStatistics(updatedStats);
      const allStats = await repository.getPickupLineStatistics();

      expect(allStats).toHaveLength(1);
      expect(allStats[0].totalUses).toBe(11);
      expect(allStats[0].successfulUses).toBe(8);
    });

    it('should handle multiple pickup line statistics', async () => {
      const stats1: PickupLineStatistics = {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
      };

      const stats2: PickupLineStatistics = {
        pickupLineId: 'pl-2',
        totalUses: 5,
        successfulUses: 2,
        successRate: 0.4,
      };

      await repository.updatePickupLineStatistics(stats1);
      await repository.updatePickupLineStatistics(stats2);

      const allStats = await repository.getPickupLineStatistics();
      expect(allStats).toHaveLength(2);
    });

    it('should return empty array when no statistics exist', async () => {
      const stats = await repository.getPickupLineStatistics();
      expect(stats).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded by clearing old data', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      let callCount = 0;
      
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, key: string, value: string) {
        callCount++;
        if (callCount === 1) {
          // First call throws quota exceeded
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw error;
        }
        // Subsequent calls succeed
        return originalSetItem.call(this, key, value);
      });

      // Add some sessions first
      for (let i = 0; i < 60; i++) {
        const session: CallSession = {
          id: `session-${i}`,
          startTime: new Date(),
          pickupLineUsed: 'pl-1',
          outcome: 'stayed',
        };
        await repository.saveCallSession(session);
      }

      // Reset call count
      callCount = 0;

      // This should trigger quota exceeded, then clear old data
      const newSession: CallSession = {
        id: 'new-session',
        startTime: new Date(),
        pickupLineUsed: 'pl-1',
        outcome: 'stayed',
      };

      await repository.saveCallSession(newSession);

      // Should have fallen back to memory mode
      const sessions = await repository.getCallSessions();
      expect(sessions.length).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });

    it('should fallback to memory mode when storage fails completely', async () => {
      // Mock localStorage to always throw errors
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const session: CallSession = {
        id: 'session-1',
        startTime: new Date(),
        pickupLineUsed: 'pl-1',
        outcome: 'stayed',
      };

      // Should not throw, should use memory fallback
      await repository.saveCallSession(session);
      
      const sessions = await repository.getCallSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');

      vi.restoreAllMocks();
    });
  });

  describe('clearAllData', () => {
    it('should clear all stored data', async () => {
      const session: CallSession = {
        id: 'session-1',
        startTime: new Date(),
        pickupLineUsed: 'pl-1',
        outcome: 'stayed',
      };

      const stats: PickupLineStatistics = {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
      };

      await repository.saveCallSession(session);
      await repository.updatePickupLineStatistics(stats);

      await repository.clearAllData();

      const sessions = await repository.getCallSessions();
      const allStats = await repository.getPickupLineStatistics();

      expect(sessions).toEqual([]);
      expect(allStats).toEqual([]);
    });
  });
});
