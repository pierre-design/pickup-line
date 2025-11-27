import type { AudioTranscriptionService } from './interfaces';

/**
 * Mock implementation of AudioTranscriptionService for development and testing.
 * Simulates transcription with configurable delays and allows manual triggering.
 * Includes error handling and retry logic with exponential backoff.
 */
export class MockAudioTranscriptionService implements AudioTranscriptionService {
  private isListening = false;
  private transcriptionCallback: ((text: string, speaker: 'agent' | 'client') => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private transcriptionDelay: number;
  private shouldSimulateFailure = false;
  private failureCount = 0;
  private maxRetries = 3;
  private baseRetryDelay = 1000; // 1 second
  private pendingTranscriptions: AbortController[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceDelay = 300; // 300ms debounce as per requirements
  private audioChunks: string[] = [];

  /**
   * Creates a new mock audio transcription service
   * @param delay - Delay in milliseconds before simulated transcription (default: 500ms)
   */
  constructor(delay: number = 500) {
    this.transcriptionDelay = delay;
  }

  /**
   * Starts listening for audio input
   * @throws Error if service fails to initialize after retries
   */
  async startListening(): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        // Simulate potential initialization failure
        if (this.shouldSimulateFailure && attempt < 2) {
          throw new Error('Failed to initialize audio transcription service');
        }
        
        this.isListening = true;
        this.failureCount = 0; // Reset failure count on success
        return;
      } catch (error) {
        attempt++;
        
        if (attempt >= this.maxRetries) {
          const finalError = new Error(
            `Failed to start audio transcription after ${this.maxRetries} attempts`
          );
          this.notifyError(finalError);
          throw finalError;
        }
        
        // Exponential backoff: wait before retrying
        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Stops listening for audio input
   * Cancels any pending transcription requests
   */
  async stopListening(): Promise<void> {
    this.isListening = false;
    
    // Cancel debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Cancel all pending transcriptions
    this.pendingTranscriptions.forEach(controller => controller.abort());
    this.pendingTranscriptions = [];
    
    // Clear audio chunks
    this.audioChunks = [];
  }

  /**
   * Registers a callback to be invoked when transcription is available
   * @param callback - Function to call with transcribed text and speaker identification
   */
  onTranscription(callback: (text: string, speaker: 'agent' | 'client') => void): void {
    this.transcriptionCallback = callback;
  }

  /**
   * Registers a callback to be invoked when transcription errors occur
   * @param callback - Function to call with error information
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Notify registered error callback
   */
  private notifyError(error: Error): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    } else {
      console.error('Transcription error:', error);
    }
  }

  /**
   * Manually triggers a transcription event (for testing purposes)
   * Includes retry logic with exponential backoff for simulated failures
   * @param text - The transcribed text
   * @param speaker - Who spoke ('agent' or 'client')
   * @param useDelay - Whether to apply the configured delay (default: true)
   * @param skipDebounce - Whether to skip debouncing (for testing, default: false)
   */
  async simulateTranscription(
    text: string, 
    speaker: 'agent' | 'client', 
    useDelay: boolean = true,
    skipDebounce: boolean = false
  ): Promise<void> {
    if (!this.isListening) {
      console.warn('MockAudioTranscriptionService: Not listening, transcription ignored');
      return;
    }

    if (!this.transcriptionCallback) {
      console.warn('MockAudioTranscriptionService: No callback registered');
      return;
    }

    // Skip debouncing for tests or immediate processing
    if (skipDebounce) {
      const abortController = new AbortController();
      this.pendingTranscriptions.push(abortController);

      try {
        await this.transcribeWithRetry(text, speaker, useDelay, abortController.signal);
      } finally {
        const index = this.pendingTranscriptions.indexOf(abortController);
        if (index > -1) {
          this.pendingTranscriptions.splice(index, 1);
        }
      }
      return;
    }

    // Add to audio chunks (simulating streaming)
    this.audioChunks.push(text);

    // Debounce transcription results (300ms)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processAudioChunks(speaker, useDelay);
    }, this.debounceDelay);
  }

  /**
   * Process accumulated audio chunks
   */
  private async processAudioChunks(speaker: 'agent' | 'client', useDelay: boolean): Promise<void> {
    if (this.audioChunks.length === 0) {
      return;
    }

    // Combine chunks
    const combinedText = this.audioChunks.join(' ');
    this.audioChunks = [];

    // Create abort controller for this transcription
    const abortController = new AbortController();
    this.pendingTranscriptions.push(abortController);

    try {
      await this.transcribeWithRetry(combinedText, speaker, useDelay, abortController.signal);
    } finally {
      // Remove from pending list
      const index = this.pendingTranscriptions.indexOf(abortController);
      if (index > -1) {
        this.pendingTranscriptions.splice(index, 1);
      }
    }
  }

  /**
   * Internal method to handle transcription with retry logic
   */
  private async transcribeWithRetry(
    text: string,
    speaker: 'agent' | 'client',
    useDelay: boolean,
    signal: AbortSignal
  ): Promise<void> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      if (signal.aborted) {
        console.log('Transcription cancelled');
        return;
      }

      try {
        // Simulate potential transcription failure
        if (this.shouldSimulateFailure && this.failureCount < 2) {
          this.failureCount++;
          throw new Error('Transcription service temporarily unavailable');
        }

        // Apply delay if requested
        if (useDelay) {
          await new Promise(resolve => setTimeout(resolve, this.transcriptionDelay));
        }

        // Check if cancelled during delay
        if (signal.aborted) {
          console.log('Transcription cancelled during delay');
          return;
        }

        // Simulate empty transcription result (edge case)
        if (text.trim() === '') {
          console.warn('Empty transcription result received');
          this.notifyError(new Error('Empty transcription result'));
          return;
        }

        // Success - invoke callback
        if (this.transcriptionCallback) {
          this.transcriptionCallback(text, speaker);
        }
        
        this.failureCount = 0; // Reset on success
        return;
      } catch (error) {
        attempt++;
        
        if (attempt >= this.maxRetries) {
          const finalError = new Error(
            `Transcription failed after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          this.notifyError(finalError);
          throw finalError;
        }

        // Exponential backoff
        const retryDelay = this.baseRetryDelay * Math.pow(2, attempt - 1);
        console.log(`Transcription attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Checks if the service is currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Updates the transcription delay
   * @param delay - New delay in milliseconds
   */
  setTranscriptionDelay(delay: number): void {
    this.transcriptionDelay = delay;
  }

  /**
   * Gets the current transcription delay
   */
  getTranscriptionDelay(): number {
    return this.transcriptionDelay;
  }

  /**
   * Enable failure simulation for testing error handling
   * @param shouldFail - Whether to simulate failures
   */
  setSimulateFailure(shouldFail: boolean): void {
    this.shouldSimulateFailure = shouldFail;
    this.failureCount = 0;
  }

  /**
   * Configure retry behavior
   * @param maxRetries - Maximum number of retry attempts
   * @param baseDelay - Base delay in milliseconds for exponential backoff
   */
  setRetryConfig(maxRetries: number, baseDelay: number): void {
    this.maxRetries = maxRetries;
    this.baseRetryDelay = baseDelay;
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): { maxRetries: number; baseRetryDelay: number } {
    return {
      maxRetries: this.maxRetries,
      baseRetryDelay: this.baseRetryDelay,
    };
  }
}
