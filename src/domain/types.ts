// Core domain types for the Pickup Line Coach application

/**
 * Represents a single pickup line from the library
 */
export interface PickupLine {
  id: string;
  text: string;
  category?: string;
}

/**
 * Represents a single call session between agent and client
 */
export interface CallSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  pickupLineUsed?: string; // Pickup line ID
  outcome?: 'stayed' | 'left';
  agentTranscription?: string;
  clientTranscription?: string;
}

/**
 * Performance statistics for a specific pickup line
 */
export interface PickupLineStatistics {
  pickupLineId: string;
  totalUses: number;
  successfulUses: number;
  successRate: number; // Calculated: successfulUses / totalUses
  lastUsed?: Date;
}

/**
 * Feedback provided to the agent after a call
 */
export interface Feedback {
  type: 'positive' | 'negative';
  message: string;
  suggestedPickupLine?: PickupLine;
  showCelebration: boolean;
}

/**
 * Result of a completed call session
 */
export interface CallSessionResult {
  session: CallSession;
  feedback: Feedback;
}
