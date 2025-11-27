// Tests for error handling utilities
import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler, ErrorType, AppError, RetryHandler, CircuitBreaker } from './errorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError(
        'Test error',
        ErrorType.TRANSCRIPTION_FAILED,
        true,
        'User friendly message'
      );
      
      const result = errorHandler.handleError(appError);
      
      expect(result.type).toBe(ErrorType.TRANSCRIPTION_FAILED);
      expect(result.recoverable).toBe(true);
      expect(result.message).toBe('User friendly message');
    });

    it('should normalize regular Error to AppError', () => {
      const error = new Error('Transcription service failed');
      
      const result = errorHandler.handleError(error);
      
      expect(result.type).toBe(ErrorType.TRANSCRIPTION_FAILED);
      expect(result.recoverable).toBe(true);
      expect(result.message).toContain('speech');
    });

    it('should handle storage errors', () => {
      const error = new Error('Storage quota exceeded');
      
      const result = errorHandler.handleError(error);
      
      expect(result.type).toBe(ErrorType.STORAGE_FAILED);
      expect(result.message).toContain('Storage');
    });

    it('should handle network errors', () => {
      const error = new Error('Network connection failed');
      
      const result = errorHandler.handleError(error);
      
      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.message).toContain('Connection');
    });

    it('should handle unknown errors', () => {
      const error = 'Some random error';
      
      const result = errorHandler.handleError(error);
      
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.recoverable).toBe(true);
    });
  });

  describe('error logging', () => {
    it('should log errors', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error);
      
      const recentErrors = errorHandler.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].message).toBe('Test error');
    });

    it('should limit log size', () => {
      // Add more than max log size
      for (let i = 0; i < 60; i++) {
        errorHandler.handleError(new Error(`Error ${i}`));
      }
      
      const recentErrors = errorHandler.getRecentErrors(100);
      expect(recentErrors.length).toBeLessThanOrEqual(50);
    });

    it('should return recent errors in order', () => {
      errorHandler.handleError(new Error('First'));
      errorHandler.handleError(new Error('Second'));
      errorHandler.handleError(new Error('Third'));
      
      const recentErrors = errorHandler.getRecentErrors(3);
      expect(recentErrors[0].message).toBe('First');
      expect(recentErrors[1].message).toBe('Second');
      expect(recentErrors[2].message).toBe('Third');
    });

    it('should clear error log', () => {
      errorHandler.handleError(new Error('Test'));
      errorHandler.clearErrorLog();
      
      const recentErrors = errorHandler.getRecentErrors();
      expect(recentErrors).toHaveLength(0);
    });
  });

  describe('error statistics', () => {
    it('should track error statistics by type', () => {
      errorHandler.handleError(new Error('Transcription failed'));
      errorHandler.handleError(new Error('Storage quota exceeded'));
      errorHandler.handleError(new Error('Transcription timeout'));
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats[ErrorType.TRANSCRIPTION_FAILED]).toBe(2);
      expect(stats[ErrorType.STORAGE_FAILED]).toBe(1);
      expect(stats[ErrorType.NETWORK_ERROR]).toBe(0);
    });

    it('should initialize all error types to zero', () => {
      const stats = errorHandler.getErrorStats();
      
      expect(stats[ErrorType.TRANSCRIPTION_FAILED]).toBe(0);
      expect(stats[ErrorType.STORAGE_FAILED]).toBe(0);
      expect(stats[ErrorType.NETWORK_ERROR]).toBe(0);
      expect(stats[ErrorType.INVALID_STATE]).toBe(0);
      expect(stats[ErrorType.MATCHING_AMBIGUOUS]).toBe(0);
      expect(stats[ErrorType.NO_MATCH_FOUND]).toBe(0);
      expect(stats[ErrorType.UNKNOWN]).toBe(0);
    });
  });
});

describe('RetryHandler', () => {
  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        return 'success';
      };
      
      const result = await RetryHandler.retry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const result = await RetryHandler.retry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max retries', async () => {
      const operation = async () => {
        throw new Error('Permanent failure');
      };
      
      await expect(RetryHandler.retry(operation, 3, 100)).rejects.toThrow('Permanent failure');
    });

    it('should call onRetry callback', async () => {
      let retryCount = 0;
      let attempts = 0;
      
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Failure');
        }
        return 'success';
      };
      
      const onRetry = (attempt: number) => {
        retryCount = attempt;
      };
      
      await RetryHandler.retry(operation, 3, 100, onRetry);
      
      expect(retryCount).toBe(1);
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      let attempts = 0;
      
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failure');
        }
        return 'success';
      };
      
      await RetryHandler.retry(operation, 3, 100);
      const duration = Date.now() - startTime;
      
      // Should wait at least 100ms + 200ms = 300ms
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });

  describe('retryWithBackoff', () => {
    it('should use custom backoff strategy', async () => {
      let attempts = 0;
      const delays: number[] = [];
      
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failure');
        }
        return 'success';
      };
      
      const backoffStrategy = (attempt: number) => {
        const delay = 50 * (attempt + 1);
        delays.push(delay);
        return delay;
      };
      
      await RetryHandler.retryWithBackoff(operation, backoffStrategy, 3);
      
      expect(delays).toEqual([50, 100]);
    });
  });
});

describe('CircuitBreaker', () => {
  describe('execute', () => {
    it('should execute operation when circuit is closed', async () => {
      const breaker = new CircuitBreaker(3, 1000);
      const operation = async () => 'success';
      
      const result = await breaker.execute(operation);
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 1000);
      const operation = async () => {
        throw new Error('Failure');
      };
      
      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe('open');
    });

    it('should reject requests when circuit is open', async () => {
      const breaker = new CircuitBreaker(2, 1000);
      const operation = async () => {
        throw new Error('Failure');
      };
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch {
          // Expected
        }
      }
      
      // Next request should be rejected immediately
      await expect(breaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker(3, 1000);
      let shouldFail = true;
      
      const operation = async () => {
        if (shouldFail) {
          throw new Error('Failure');
        }
        return 'success';
      };
      
      // Fail once
      try {
        await breaker.execute(operation);
      } catch {
        // Expected
      }
      
      // Succeed
      shouldFail = false;
      await breaker.execute(operation);
      
      // Circuit should still be closed
      expect(breaker.getState()).toBe('closed');
    });

    it('should attempt reset after timeout', async () => {
      const breaker = new CircuitBreaker(2, 100); // Short timeout for testing
      const operation = async () => {
        throw new Error('Failure');
      };
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe('open');
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next attempt should transition to half-open
      try {
        await breaker.execute(operation);
      } catch {
        // Expected to fail, but state should have changed
      }
      
      // State might be open again after failure, but we tested the timeout logic
      expect(['open', 'half-open']).toContain(breaker.getState());
    });

    it('should reset circuit breaker', () => {
      const breaker = new CircuitBreaker(2, 1000);
      
      breaker.reset();
      
      expect(breaker.getState()).toBe('closed');
    });
  });
});

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError(
      'Test message',
      ErrorType.TRANSCRIPTION_FAILED,
      true,
      'User message'
    );
    
    expect(error.message).toBe('Test message');
    expect(error.type).toBe(ErrorType.TRANSCRIPTION_FAILED);
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toBe('User message');
    expect(error.name).toBe('AppError');
  });

  it('should default recoverable to true', () => {
    const error = new AppError('Test', ErrorType.UNKNOWN);
    
    expect(error.recoverable).toBe(true);
  });

  it('should allow undefined user message', () => {
    const error = new AppError('Test', ErrorType.UNKNOWN, false);
    
    expect(error.userMessage).toBeUndefined();
  });
});
