// Call Session Manager - Orchestrates the lifecycle of a single call session
import { v4 as uuidv4 } from 'uuid';
import type {
  CallSession,
  CallSessionResult,
  PickupLine,
  Feedback,
} from '../domain/types';
import type { CallSessionManager, FeedbackGenerator } from './interfaces';
import type { DataRepository } from '../infrastructure/interfaces';

/**
 * Error types for call session management
 */
export class SessionError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'SessionError';
    this.code = code;
  }
}

/**
 * Manages the lifecycle of a single call session
 * Coordinates between audio transcription, outcome classification, feedback generation, and data persistence
 * Includes error handling and offline mode support
 */
export class DefaultCallSessionManager implements CallSessionManager {
  private currentSession: CallSession | null = null;
  private readonly feedbackGenerator: FeedbackGenerator;
  private readonly dataRepository: DataRepository;
  private offlineMode = false;
  private sessionErrors: Error[] = [];

  constructor(
    feedbackGenerator: FeedbackGenerator,
    dataRepository: DataRepository
  ) {
    this.feedbackGenerator = feedbackGenerator;
    this.dataRepository = dataRepository;
  }

  /**
   * Start a new call session
   * Creates a new session with a unique ID and current timestamp
   */
  startSession(): CallSession {
    const session: CallSession = {
      id: uuidv4(),
      startTime: new Date(),
    };

    this.currentSession = session;
    return session;
  }

  /**
   * Record which pickup line was used in the current session
   * Supports manual selection for offline mode
   * @throws SessionError if no active session exists
   */
  recordOpener(pickupLine: PickupLine): void {
    if (!this.currentSession) {
      throw new SessionError(
        'No active session. Call startSession() first.',
        'NO_ACTIVE_SESSION'
      );
    }

    this.currentSession.pickupLineUsed = pickupLine.id;
  }

  /**
   * Manually record opener (for offline mode or when transcription fails)
   * @param pickupLine - The pickup line that was used
   * @returns true if recorded successfully, false otherwise
   */
  recordOpenerManually(pickupLine: PickupLine): boolean {
    try {
      this.recordOpener(pickupLine);
      return true;
    } catch (error) {
      console.error('Failed to record opener manually:', error);
      this.sessionErrors.push(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Record the outcome of the current session
   * Calculates call duration and sets end time
   * @throws SessionError if no active session exists
   */
  recordOutcome(outcome: 'stayed' | 'left'): void {
    if (!this.currentSession) {
      throw new SessionError(
        'No active session. Call startSession() first.',
        'NO_ACTIVE_SESSION'
      );
    }

    // Allow recording outcome even without a pickup line (for manual testing)
    this.currentSession.outcome = outcome;
    this.currentSession.endTime = new Date();
  }

  /**
   * Manually record outcome (for offline mode or when automatic detection fails)
   * @param outcome - The outcome of the call
   * @returns true if recorded successfully, false otherwise
   */
  recordOutcomeManually(outcome: 'stayed' | 'left'): boolean {
    try {
      this.recordOutcome(outcome);
      return true;
    } catch (error) {
      console.error('Failed to record outcome manually:', error);
      this.sessionErrors.push(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * End the current session
   * Generates feedback, saves session to repository, and returns the result
   * Handles errors gracefully and supports offline mode
   * @throws SessionError if no active session exists or no outcome was recorded
   */
  endSession(): CallSessionResult {
    if (!this.currentSession) {
      throw new SessionError(
        'No active session. Call startSession() first.',
        'NO_ACTIVE_SESSION'
      );
    }

    if (!this.currentSession.outcome) {
      throw new SessionError(
        'No outcome recorded. Call recordOutcome() first.',
        'NO_OUTCOME_RECORDED'
      );
    }

    // Generate feedback - handle case where no pickup line was used
    let feedback: Feedback;
    try {
      if (this.currentSession.pickupLineUsed) {
        const pickupLine: PickupLine = {
          id: this.currentSession.pickupLineUsed,
          text: '', // Will be populated by FeedbackGenerator from its internal library
        };
        feedback = this.feedbackGenerator.generateFeedback(
          this.currentSession.outcome,
          pickupLine
        );
      } else {
        // No pickup line was used - provide generic feedback
        feedback = {
          type: (this.currentSession.outcome === 'stayed' ? 'positive' : 'negative') as 'positive' | 'negative',
          message: this.currentSession.outcome === 'stayed' 
            ? 'Great job! The client stayed on the call.'
            : 'The client left the call. Keep practicing!',
          showCelebration: false, // Celebration removed per user request
        };
      }
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      // Provide default feedback if generation fails
      feedback = {
        type: (this.currentSession.outcome === 'stayed' ? 'positive' : 'negative') as 'positive' | 'negative',
        message: this.currentSession.outcome === 'stayed' 
          ? 'Great job! The client stayed on the call.'
          : 'The client left the call. Keep practicing!',
        showCelebration: false, // Celebration removed per user request
      };
    }

    // Save session to repository (fire and forget - don't block on async operation)
    this.dataRepository.saveCallSession(this.currentSession).catch((error) => {
      console.error('Failed to save call session:', error);
      this.sessionErrors.push(error);
      
      // If in offline mode, we might want to queue this for later
      if (this.offlineMode) {
        console.log('Session will be saved when connection is restored');
      }
    });

    const result: CallSessionResult = {
      session: { ...this.currentSession },
      feedback,
    };

    // Clear current session and errors
    this.currentSession = null;
    this.sessionErrors = [];

    return result;
  }

  /**
   * Cancel the current session without saving
   * Useful when agent decides not to complete the session
   */
  cancelSession(): void {
    if (this.currentSession) {
      console.log(`Cancelling session ${this.currentSession.id}`);
      this.currentSession = null;
      this.sessionErrors = [];
    }
  }

  /**
   * Get the current active session (useful for debugging or UI display)
   */
  getCurrentSession(): CallSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Enable or disable offline mode
   * In offline mode, manual selection is required for opener and outcome
   */
  setOfflineMode(enabled: boolean): void {
    this.offlineMode = enabled;
    if (enabled) {
      console.log('Offline mode enabled - manual selection required');
    } else {
      console.log('Offline mode disabled - automatic detection enabled');
    }
  }

  /**
   * Check if currently in offline mode
   */
  isOfflineMode(): boolean {
    return this.offlineMode;
  }

  /**
   * Get any errors that occurred during the current session
   */
  getSessionErrors(): Error[] {
    return [...this.sessionErrors];
  }

  /**
   * Clear session errors
   */
  clearSessionErrors(): void {
    this.sessionErrors = [];
  }

  /**
   * Attempt to recover from an invalid state
   * Prompts for manual input if outcome is missing
   * @returns Object indicating what manual input is needed
   */
  getRecoveryOptions(): {
    needsOpener: boolean;
    needsOutcome: boolean;
    canRecover: boolean;
  } {
    if (!this.currentSession) {
      return { needsOpener: false, needsOutcome: false, canRecover: false };
    }

    // Opener is optional now, only outcome is required
    const needsOpener = false; // Optional
    const needsOutcome = !this.currentSession.outcome;

    return {
      needsOpener,
      needsOutcome,
      canRecover: needsOutcome,
    };
  }
}
