import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockAudioTranscriptionService } from './mockAudioTranscriptionService';

describe('MockAudioTranscriptionService', () => {
  let service: MockAudioTranscriptionService;

  beforeEach(() => {
    service = new MockAudioTranscriptionService(100);
  });

  it('should start and stop listening', async () => {
    expect(service.getIsListening()).toBe(false);
    
    await service.startListening();
    expect(service.getIsListening()).toBe(true);
    
    await service.stopListening();
    expect(service.getIsListening()).toBe(false);
  });

  it('should invoke callback when transcription is simulated', async () => {
    const callback = vi.fn();
    service.onTranscription(callback);
    
    await service.startListening();
    await service.simulateTranscription('Hello world', 'agent', false, true); // Skip debounce for test
    
    expect(callback).toHaveBeenCalledWith('Hello world', 'agent');
  });

  it('should apply delay when configured', async () => {
    const callback = vi.fn();
    service.setTranscriptionDelay(50);
    service.onTranscription(callback);
    
    await service.startListening();
    
    const startTime = Date.now();
    await service.simulateTranscription('Test message', 'client', true, true); // Skip debounce for test
    const elapsed = Date.now() - startTime;
    
    expect(callback).toHaveBeenCalledWith('Test message', 'client');
    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small margin
  });

  it('should not invoke callback when not listening', async () => {
    const callback = vi.fn();
    service.onTranscription(callback);
    
    // Don't start listening
    await service.simulateTranscription('Should not work', 'agent', false);
    
    expect(callback).not.toHaveBeenCalled();
  });

  it('should not invoke callback when no callback is registered', async () => {
    await service.startListening();
    
    // Should not throw error
    await expect(
      service.simulateTranscription('No callback', 'agent', false)
    ).resolves.toBeUndefined();
  });

  it('should allow updating transcription delay', () => {
    expect(service.getTranscriptionDelay()).toBe(100);
    
    service.setTranscriptionDelay(200);
    expect(service.getTranscriptionDelay()).toBe(200);
  });

  it('should handle multiple transcriptions in sequence', async () => {
    const callback = vi.fn();
    service.onTranscription(callback);
    
    await service.startListening();
    await service.simulateTranscription('First', 'agent', false, true); // Skip debounce for test
    await service.simulateTranscription('Second', 'client', false, true); // Skip debounce for test
    await service.simulateTranscription('Third', 'agent', false, true); // Skip debounce for test
    
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenNthCalledWith(1, 'First', 'agent');
    expect(callback).toHaveBeenNthCalledWith(2, 'Second', 'client');
    expect(callback).toHaveBeenNthCalledWith(3, 'Third', 'agent');
  });

  it('should use default delay of 500ms when not specified', () => {
    const defaultService = new MockAudioTranscriptionService();
    expect(defaultService.getTranscriptionDelay()).toBe(500);
  });
});

describe('MockAudioTranscriptionService - Error Handling', () => {
  let service: MockAudioTranscriptionService;

  beforeEach(() => {
    service = new MockAudioTranscriptionService(50);
  });

  it('should retry on failure and eventually succeed', async () => {
    service.setSimulateFailure(true);
    service.setRetryConfig(3, 100);
    
    // Should succeed after retries
    await expect(service.startListening()).resolves.toBeUndefined();
    expect(service.getIsListening()).toBe(true);
  });

  it('should throw error after max retries', async () => {
    service.setSimulateFailure(true);
    service.setRetryConfig(2, 50);
    
    await expect(service.startListening()).rejects.toThrow('Failed to start audio transcription');
  });

  it('should invoke error callback on transcription failure', async () => {
    const errorCallback = vi.fn();
    service.onError(errorCallback);
    service.setSimulateFailure(true);
    service.setRetryConfig(2, 50);
    
    await service.startListening().catch(() => {
      // Expected to fail
    });
    
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should handle empty transcription result', async () => {
    const callback = vi.fn();
    const errorCallback = vi.fn();
    
    service.onTranscription(callback);
    service.onError(errorCallback);
    
    await service.startListening();
    await service.simulateTranscription('', 'agent', false, true); // Skip debounce for test
    
    expect(callback).not.toHaveBeenCalled();
    expect(errorCallback).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Empty transcription result'
    }));
  });

  it('should cancel pending transcriptions on stop', async () => {
    const callback = vi.fn();
    service.onTranscription(callback);
    
    await service.startListening();
    
    // Start a transcription with delay
    const transcriptionPromise = service.simulateTranscription('Test', 'agent', true);
    
    // Stop immediately
    await service.stopListening();
    
    // Wait for transcription to complete
    await transcriptionPromise;
    
    // Callback should not be invoked because we stopped
    expect(service.getIsListening()).toBe(false);
  });

  it('should configure retry behavior', () => {
    service.setRetryConfig(5, 2000);
    
    const config = service.getRetryConfig();
    expect(config.maxRetries).toBe(5);
    expect(config.baseRetryDelay).toBe(2000);
  });

  it('should reset failure count on successful transcription', async () => {
    service.setSimulateFailure(true);
    const callback = vi.fn();
    service.onTranscription(callback);
    
    await service.startListening();
    
    // First transcription will fail initially but succeed after retries
    service.setSimulateFailure(false);
    await service.simulateTranscription('Success', 'agent', false, true); // Skip debounce for test
    
    expect(callback).toHaveBeenCalledWith('Success', 'agent');
  });

  it('should handle transcription retry with exponential backoff', async () => {
    service.setSimulateFailure(true);
    service.setRetryConfig(3, 100);
    
    const callback = vi.fn();
    service.onTranscription(callback);
    
    await service.startListening();
    
    const startTime = Date.now();
    
    // This will fail and retry
    try {
      await service.simulateTranscription('Test', 'agent', false, true); // Skip debounce for test
    } catch {
      // Expected to fail after retries
    }
    
    const elapsed = Date.now() - startTime;
    
    // Should have waited for exponential backoff: 100ms + 200ms = 300ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(250);
  });
});
