// Service layer interfaces for the Pickup Line Coach application
import type { 
  CallSession, 
  CallSessionResult, 
  PickupLine, 
  PickupLineStatistics,
  Feedback 
} from '../domain/types';

/**
 * Manages the lifecycle of a single call session
 */
export interface CallSessionManager {
  startSession(): CallSession;
  recordOpener(pickupLine: PickupLine): void;
  recordOutcome(outcome: 'stayed' | 'left'): void;
  endSession(): CallSessionResult;
}

/**
 * Analyzes performance data and provides recommendations
 */
export interface PerformanceAnalyzer {
  updateStatistics(pickupLineId: string, outcome: 'stayed' | 'left'): void;
  getSuccessRate(pickupLineId: string): number;
  getRecommendedPickupLines(): PickupLine[];
  getAllStatistics(): PickupLineStatistics[];
}

/**
 * Generates feedback messages for agents
 */
export interface FeedbackGenerator {
  generateFeedback(outcome: 'stayed' | 'left', currentPickupLine: PickupLine): Feedback;
}

/**
 * Matches transcribed text against pickup line library
 */
export interface PickupLineMatcher {
  match(transcription: string): PickupLine | null;
  getAllPickupLines(): PickupLine[];
}

/**
 * Classifies call outcomes based on duration and interaction
 */
export interface OutcomeClassifier {
  classifyOutcome(callDuration: number, hasClientResponse: boolean): 'stayed' | 'left';
}
