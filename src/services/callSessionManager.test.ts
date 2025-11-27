import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefaultCallSessionManager } from './callSessionManager';
import type { FeedbackGenerator } from './interfaces';
import type { DataRepository } from '../infrastructure/interfaces';
import type { PickupLine, Feedback } from '../domain/types';

describe('DefaultCallSessionManager', () => {
  let manager: DefaultCallSessionManager;
  let mockFeedbackGenerator: FeedbackGenerator;
  let mockDataRepository: DataRepository;

  const testPickupLine: PickupLine = {
    id: 'test-line-1',
    text: 'Are you a magician? Because whenever I look at you, everyone else disappears.',
  };

  const mockFeedback: Feedback = {
    type: 'positive',
    message: 'Great job!',
    showCelebration: true,
  };

  beforeEach(() => {
    // Create mock feedback generator
    mockFeedbackGenerator = {
      generateFeedback: vi.fn().mockReturnValue(mockFeedback),
    };

    // Create mock data repository
    mockDataRepository = {
      saveCallSession: vi.fn().mockResolvedValue(undefined),
      getCallSessions: vi.fn().mockResolvedValue([]),
      getPickupLineStatistics: vi.fn().mockResolvedValue([]),
      updatePickupLineStatistics: vi.fn().mockResolvedValue(undefined),
    };

    manager = new DefaultCallSessionManager(mockFeedbackGenerator, mockDataRepository);
  });

  describe('startSession', () => {
    it('should create a new session with unique ID and start time', () => {
      const session = manager.startSession();

      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 format
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.endTime).toBeUndefined();
      expect(session.pickupLineUsed).toBeUndefined();
      expect(session.outcome).toBeUndefined();
    });

    it('should create sessions with different IDs', () => {
      const session1 = manager.startSession();
      const session2 = manager.startSession();

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('recordOpener', () => {
    it('should record the pickup line ID in the current session', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);

      const currentSession = manager.getCurrentSession();
      expect(currentSession?.pickupLineUsed).toBe(testPickupLine.id);
    });

    it('should throw error if no active session exists', () => {
      expect(() => {
        manager.recordOpener(testPickupLine);
      }).toThrow('No active session. Call startSession() first.');
    });
  });

  describe('recordOutcome', () => {
    it('should record the outcome and set end time', () => {
      const startTime = new Date();
      manager.startSession();
      manager.recordOpener(testPickupLine);
      
      manager.recordOutcome('stayed');

      const currentSession = manager.getCurrentSession();
      expect(currentSession?.outcome).toBe('stayed');
      expect(currentSession?.endTime).toBeInstanceOf(Date);
      expect(currentSession?.endTime!.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    });

    it('should throw error if no active session exists', () => {
      expect(() => {
        manager.recordOutcome('stayed');
      }).toThrow('No active session. Call startSession() first.');
    });

    it('should throw error if no pickup line was recorded', () => {
      manager.startSession();

      expect(() => {
        manager.recordOutcome('stayed');
      }).toThrow('No pickup line recorded. Call recordOpener() first.');
    });
  });

  describe('endSession', () => {
    it('should generate feedback and return session result', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');

      const result = manager.endSession();

      expect(result.session).toBeDefined();
      expect(result.session.id).toBeDefined();
      expect(result.session.pickupLineUsed).toBe(testPickupLine.id);
      expect(result.session.outcome).toBe('stayed');
      expect(result.feedback).toEqual(mockFeedback);
      expect(mockFeedbackGenerator.generateFeedback).toHaveBeenCalledWith(
        'stayed',
        expect.objectContaining({ id: testPickupLine.id })
      );
    });

    it('should save session to repository', async () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('left');

      manager.endSession();

      // Wait a bit for the async save to be called
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDataRepository.saveCallSession).toHaveBeenCalledWith(
        expect.objectContaining({
          pickupLineUsed: testPickupLine.id,
          outcome: 'left',
        })
      );
    });

    it('should clear current session after ending', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');

      manager.endSession();

      expect(manager.getCurrentSession()).toBeNull();
    });

    it('should throw error if no active session exists', () => {
      expect(() => {
        manager.endSession();
      }).toThrow('No active session. Call startSession() first.');
    });

    it('should throw error if no pickup line was recorded', () => {
      manager.startSession();

      expect(() => {
        manager.endSession();
      }).toThrow('No pickup line recorded. Call recordOpener() first.');
    });

    it('should throw error if no outcome was recorded', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);

      expect(() => {
        manager.endSession();
      }).toThrow('No outcome recorded. Call recordOutcome() first.');
    });

    it('should handle repository save errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDataRepository.saveCallSession = vi.fn().mockRejectedValue(new Error('Storage error'));

      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');

      const result = manager.endSession();

      // Should still return result even if save fails
      expect(result.session).toBeDefined();
      expect(result.feedback).toBeDefined();

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save call session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('complete session flow', () => {
    it('should handle a complete session lifecycle', () => {
      // Start session
      const session = manager.startSession();
      expect(session.id).toBeDefined();

      // Record opener
      manager.recordOpener(testPickupLine);
      expect(manager.getCurrentSession()?.pickupLineUsed).toBe(testPickupLine.id);

      // Record outcome
      manager.recordOutcome('stayed');
      expect(manager.getCurrentSession()?.outcome).toBe('stayed');

      // End session
      const result = manager.endSession();
      expect(result.session.id).toBe(session.id);
      expect(result.feedback).toEqual(mockFeedback);
      expect(manager.getCurrentSession()).toBeNull();
    });
  });
});

describe('DefaultCallSessionManager - Error Handling', () => {
  let manager: DefaultCallSessionManager;
  let mockFeedbackGenerator: FeedbackGenerator;
  let mockDataRepository: DataRepository;

  const testPickupLine: PickupLine = {
    id: 'test-line-1',
    text: 'Test pickup line',
  };

  beforeEach(() => {
    mockFeedbackGenerator = {
      generateFeedback: vi.fn().mockReturnValue({
        type: 'positive',
        message: 'Great!',
        showCelebration: true,
      }),
    };

    mockDataRepository = {
      saveCallSession: vi.fn().mockResolvedValue(undefined),
      getCallSessions: vi.fn().mockResolvedValue([]),
      getPickupLineStatistics: vi.fn().mockResolvedValue([]),
      updatePickupLineStatistics: vi.fn().mockResolvedValue(undefined),
    };

    manager = new DefaultCallSessionManager(mockFeedbackGenerator, mockDataRepository);
  });

  describe('offline mode', () => {
    it('should enable offline mode', () => {
      manager.setOfflineMode(true);
      expect(manager.isOfflineMode()).toBe(true);
    });

    it('should disable offline mode', () => {
      manager.setOfflineMode(true);
      manager.setOfflineMode(false);
      expect(manager.isOfflineMode()).toBe(false);
    });
  });

  describe('manual recording', () => {
    it('should record opener manually', () => {
      manager.startSession();
      const result = manager.recordOpenerManually(testPickupLine);
      
      expect(result).toBe(true);
      const session = manager.getCurrentSession();
      expect(session?.pickupLineUsed).toBe(testPickupLine.id);
    });

    it('should return false when manual recording fails', () => {
      // No active session
      const result = manager.recordOpenerManually(testPickupLine);
      
      expect(result).toBe(false);
      const errors = manager.getSessionErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should record outcome manually', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      const result = manager.recordOutcomeManually('stayed');
      
      expect(result).toBe(true);
      const session = manager.getCurrentSession();
      expect(session?.outcome).toBe('stayed');
    });

    it('should return false when manual outcome recording fails', () => {
      manager.startSession();
      // No opener recorded
      const result = manager.recordOutcomeManually('stayed');
      
      expect(result).toBe(false);
      const errors = manager.getSessionErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('session cancellation', () => {
    it('should cancel active session', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      
      manager.cancelSession();
      
      expect(manager.getCurrentSession()).toBeNull();
    });

    it('should not throw when cancelling non-existent session', () => {
      expect(() => manager.cancelSession()).not.toThrow();
    });

    it('should clear errors on cancellation', () => {
      manager.startSession();
      manager.recordOpenerManually(testPickupLine); // This might add errors
      
      manager.cancelSession();
      
      expect(manager.getSessionErrors()).toHaveLength(0);
    });
  });

  describe('error tracking', () => {
    it('should track session errors', () => {
      // Try to record without session
      manager.recordOpenerManually(testPickupLine);
      
      const errors = manager.getSessionErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should clear session errors', () => {
      manager.recordOpenerManually(testPickupLine);
      expect(manager.getSessionErrors().length).toBeGreaterThan(0);
      
      manager.clearSessionErrors();
      expect(manager.getSessionErrors()).toHaveLength(0);
    });

    it('should clear errors after successful session end', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');
      
      // Add some errors
      manager.recordOpenerManually(testPickupLine);
      
      manager.endSession();
      
      // Errors should be cleared
      expect(manager.getSessionErrors()).toHaveLength(0);
    });
  });

  describe('recovery options', () => {
    it('should indicate no recovery needed when no session', () => {
      const options = manager.getRecoveryOptions();
      
      expect(options.canRecover).toBe(false);
      expect(options.needsOpener).toBe(false);
      expect(options.needsOutcome).toBe(false);
    });

    it('should indicate opener needed', () => {
      manager.startSession();
      
      const options = manager.getRecoveryOptions();
      
      expect(options.canRecover).toBe(true);
      expect(options.needsOpener).toBe(true);
      expect(options.needsOutcome).toBe(true); // Both are needed when session just starts
    });

    it('should indicate outcome needed', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      
      const options = manager.getRecoveryOptions();
      
      expect(options.canRecover).toBe(true);
      expect(options.needsOpener).toBe(false);
      expect(options.needsOutcome).toBe(true);
    });

    it('should indicate no recovery needed when session complete', () => {
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');
      
      const options = manager.getRecoveryOptions();
      
      expect(options.canRecover).toBe(false);
      expect(options.needsOpener).toBe(false);
      expect(options.needsOutcome).toBe(false);
    });
  });

  describe('graceful error handling', () => {
    it('should handle feedback generation failure', () => {
      mockFeedbackGenerator.generateFeedback = vi.fn().mockImplementation(() => {
        throw new Error('Feedback generation failed');
      });
      
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');
      
      const result = manager.endSession();
      
      // Should provide default feedback
      expect(result.feedback).toBeDefined();
      expect(result.feedback.type).toBe('positive');
      expect(result.feedback.message).toContain('Great job');
    });

    it('should handle storage failure gracefully', async () => {
      mockDataRepository.saveCallSession = vi.fn().mockRejectedValue(new Error('Storage failed'));
      
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('stayed');
      
      // Should not throw
      expect(() => manager.endSession()).not.toThrow();
      
      // Wait a bit for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should provide default negative feedback on generation failure', () => {
      mockFeedbackGenerator.generateFeedback = vi.fn().mockImplementation(() => {
        throw new Error('Failed');
      });
      
      manager.startSession();
      manager.recordOpener(testPickupLine);
      manager.recordOutcome('left');
      
      const result = manager.endSession();
      
      expect(result.feedback.type).toBe('negative');
      expect(result.feedback.message).toContain('left');
    });
  });
});
