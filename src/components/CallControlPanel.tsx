import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import type { CallSession, PickupLine } from '../domain/types';
import type { CallSessionManager } from '../services/interfaces';
import type { AudioTranscriptionService } from '../infrastructure/interfaces';
import { PickupLineMatcher } from '../domain/pickupLineMatcher';

interface CallControlPanelProps {
  sessionManager: CallSessionManager;
  transcriptionService: AudioTranscriptionService;
  onSessionStart?: (session: CallSession) => void;
  onSessionEnd?: () => void;
  activePickupLine?: PickupLine;
}

export interface CallControlPanelRef {
  setDetectedPickupLine: (pickupLine: PickupLine | null) => void;
  isSessionActive: () => boolean;
}

/**
 * Call Control Panel Component
 * Provides UI controls for starting/ending call sessions and displays session status
 * Requirements: 1.1, 1.2, 2.3
 */
export const CallControlPanel = forwardRef<CallControlPanelRef, CallControlPanelProps>(
  function CallControlPanel(
    { sessionManager, transcriptionService, onSessionStart, onSessionEnd, activePickupLine },
    ref
  ) {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [detectedPickupLine, setDetectedPickupLine] = useState<PickupLine | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [pickupLineMatcher] = useState(() => new PickupLineMatcher());

    useImperativeHandle(ref, () => ({
      setDetectedPickupLine,
      isSessionActive: () => isSessionActive,
    }));

    useEffect(() => {
      transcriptionService.onTranscription((text, speaker) => {
        console.log(`Transcription from ${speaker}:`, text);
        
        // Only process agent transcriptions for pickup line detection
        if (speaker === 'agent' && isSessionActive && !detectedPickupLine) {
          const matchedPickupLine = pickupLineMatcher.match(text);
          if (matchedPickupLine) {
            console.log('Detected pickup line:', matchedPickupLine.id);
            setDetectedPickupLine(matchedPickupLine);
            
            // Record the pickup line in the session
            try {
              sessionManager.recordOpener(matchedPickupLine);
              console.log('Pickup line recorded in session');
            } catch (error) {
              console.error('Failed to record pickup line:', error);
            }
          }
        }
      });
    }, [transcriptionService, isSessionActive, detectedPickupLine, pickupLineMatcher, sessionManager]);

    useEffect(() => {
      return () => {
        if (isListening) {
          transcriptionService.stopListening().catch(console.error);
        }
      };
    }, [isListening, transcriptionService]);

  const handleStartCall = async () => {
    try {
      const session = sessionManager.startSession();
      setIsSessionActive(true);
      setDetectedPickupLine(null);
      
      // Auto-record the active pickup line from carousel as fallback
      if (activePickupLine) {
        setDetectedPickupLine(activePickupLine);
        try {
          sessionManager.recordOpener(activePickupLine);
          console.log('Auto-recorded active pickup line from carousel:', activePickupLine.id);
        } catch (error) {
          console.error('Failed to record active pickup line:', error);
        }
      }
      
      // Try to start transcription, but don't fail if it's not available
      try {
        await transcriptionService.startListening();
        setIsListening(true);
      } catch (transcriptionError) {
        // Log but don't show error - the app works fine without real transcription
        console.log('Transcription not available, continuing without it:', transcriptionError);
        setIsListening(false);
      }
      
      onSessionStart?.(session);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsSessionActive(false);
    }
  };

  const handleEndCall = async () => {
    try {
      if (isListening) {
        await transcriptionService.stopListening();
        setIsListening(false);
      }
      
      setIsSessionActive(false);
      setDetectedPickupLine(null);
      onSessionEnd?.();
    } catch (error) {
      console.error('Failed to end call:', error);
      setIsSessionActive(false);
      setIsListening(false);
      onSessionEnd?.();
    }
  };

  return (
    <div className="w-full">
      {/* Main Action Button - Yellow with rounded corners */}
      <button
        onClick={isSessionActive ? handleEndCall : handleStartCall}
        className={`
          w-full py-4 px-6 rounded-2xl font-extrabold text-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-pink
          min-h-[60px] touch-manipulation
          ${
            isSessionActive
              ? 'bg-pink text-white hover:bg-[#F99191]'
              : 'bg-yellow text-black hover:bg-[#FFE44D]'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={isSessionActive ? 'End current call session' : 'Start new call session'}
        aria-pressed={isSessionActive}
      >
        {isSessionActive ? 'End Call' : 'Start Call'}
      </button>
    </div>
  );
});
