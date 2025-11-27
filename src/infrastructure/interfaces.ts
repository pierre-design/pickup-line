// Infrastructure layer interfaces for external services and data persistence
import type { CallSession, PickupLineStatistics } from '../domain/types';

/**
 * Audio transcription service interface (e.g., WhisperX)
 */
export interface AudioTranscriptionService {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  onTranscription(callback: (text: string, speaker: 'agent' | 'client') => void): void;
}

/**
 * Data repository interface for persisting and retrieving data
 */
export interface DataRepository {
  saveCallSession(session: CallSession): Promise<void>;
  getCallSessions(): Promise<CallSession[]>;
  getPickupLineStatistics(): Promise<PickupLineStatistics[]>;
  updatePickupLineStatistics(stats: PickupLineStatistics): Promise<void>;
}
