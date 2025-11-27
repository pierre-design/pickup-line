// Error handling utilities for the Pickup Line Coach application

/**
 * Error types for different failure scenarios
 */
export const ErrorType = {
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  STORAGE_FAILED: 'STORAGE_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  MATCHING_AMBIGUOUS: 'MATCHING_AMBIGUOUS',
  NO_MATCH_FOUND: 'NO_MATCH_FOUND',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Application error with type and recovery suggestions
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly recoverable: boolean;
  public readonly userMessage?: string;

  constructor(
    message: string,
    type: ErrorType,
    recoverable: boolean = true,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.recoverable = recoverable;
    this.userMessage = userMessage;
  }
}

/**
 * Error handler with retry logic and user-friendly messages
 */
export class ErrorHandler {
  private errorLog: AppError[] = [];
  private readonly maxLogSize = 50;

  /**
   * Handle an error and return user-friendly message
   */
  handleError(error: unknown): {
    message: string;
    recoverable: boolean;
    type: ErrorType;
  } {
    const appError = this.normalizeError(error);
    this.logError(appError);

    return {
      message: appError.userMessage || this.getDefaultUserMessage(appError.type),
      recoverable: appError.recoverable,
      type: appError.type,
    };
  }

  /**
   * Convert any error to AppError
   */
  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to infer error type from message
      const type = this.inferErrorType(error.message);
      return new AppError(error.message, type, true, this.getDefaultUserMessage(type));
    }

    return new AppError(
      String(error),
      ErrorType.UNKNOWN,
      true,
      'An unexpected error occurred. Please try again.'
    );
  }

  /**
   * Infer error type from error message
   */
  private inferErrorType(message: string): ErrorType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('transcription') || lowerMessage.includes('audio')) {
      return ErrorType.TRANSCRIPTION_FAILED;
    }
    if (lowerMessage.includes('storage') || lowerMessage.includes('quota')) {
      return ErrorType.STORAGE_FAILED;
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (lowerMessage.includes('ambiguous') || lowerMessage.includes('multiple matches')) {
      return ErrorType.MATCHING_AMBIGUOUS;
    }
    if (lowerMessage.includes('no match') || lowerMessage.includes('not found')) {
      return ErrorType.NO_MATCH_FOUND;
    }
    if (lowerMessage.includes('invalid state') || lowerMessage.includes('no active session')) {
      return ErrorType.INVALID_STATE;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly message for error type
   */
  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.TRANSCRIPTION_FAILED:
        return 'Unable to detect speech. Please speak clearly and try again.';
      case ErrorType.STORAGE_FAILED:
        return 'Storage limit reached. Some historical data may be lost.';
      case ErrorType.NETWORK_ERROR:
        return 'Connection issue detected. Switching to offline mode.';
      case ErrorType.INVALID_STATE:
        return 'Session state error. Please start a new session.';
      case ErrorType.MATCHING_AMBIGUOUS:
        return 'Multiple pickup lines matched. Please confirm your selection.';
      case ErrorType.NO_MATCH_FOUND:
        return 'No pickup line detected. Please use one of the recognized openers.';
      case ErrorType.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error for debugging
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${error.type}] ${error.message}`, error);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): AppError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.TRANSCRIPTION_FAILED]: 0,
      [ErrorType.STORAGE_FAILED]: 0,
      [ErrorType.NETWORK_ERROR]: 0,
      [ErrorType.INVALID_STATE]: 0,
      [ErrorType.MATCHING_AMBIGUOUS]: 0,
      [ErrorType.NO_MATCH_FOUND]: 0,
      [ErrorType.UNKNOWN]: 0,
    };

    for (const error of this.errorLog) {
      stats[error.type]++;
    }

    return stats;
  }
}

/**
 * Retry utility with exponential backoff
 */
export class RetryHandler {
  /**
   * Retry an async operation with exponential backoff
   * @param operation - The async operation to retry
   * @param maxRetries - Maximum number of retry attempts
   * @param baseDelay - Base delay in milliseconds
   * @param onRetry - Optional callback invoked before each retry
   * @returns Result of the operation
   * @throws Last error if all retries fail
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          
          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }

          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Retry with custom backoff strategy
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    backoffStrategy: (attempt: number) => number,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = backoffStrategy(attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(
    failureThreshold: number = 5,
    resetTimeout: number = 60000 // 1 minute
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new AppError(
          'Circuit breaker is open',
          ErrorType.NETWORK_ERROR,
          false,
          'Service temporarily unavailable. Please try again later.'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.lastFailureTime === null) {
      return false;
    }

    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
  }
}
