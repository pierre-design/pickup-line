import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import type { CallSession, PickupLine } from '../domain/types';
import type { CallSessionManager } from '../services/interfaces';
import type { AudioTranscriptionService } from '../infrastructure/interfaces';

interface CallControlPanelProps {
  sessionManager: CallSessionManager;
  transcriptionService: AudioTranscriptionService;
  onSessionStart?: (session: CallSession) => void;
  onSessionEnd?: () => void;
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
    { sessionManager, transcriptionService, onSessionStart, onSessionEnd },
    ref
  ) {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [detectedPickupLine, setDetectedPickupLine] = useState<PickupLine | null>(null);
    const [isListening, setIsListening] = useState(false);

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
      setDetectedPickupLine,
      isSessionActive: () => isSessionActive,
    }));

    // Set up transcription callback
    useEffect(() => {
      transcriptionService.onTranscription((text, speaker) => {
        console.log(`Transcription from ${speaker}:`, text);
        // TODO: Process transcription (match pickup lines, detect outcomes)
        // This will be handled by the session manager in a future update
      });
    }, [transcriptionService]);

    // Clean up transcription service on unmount
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
      
      // Start listening for audio
      await transcriptionService.startListening();
      setIsListening(true);
      
      onSessionStart?.(session);
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsSessionActive(false);
      alert('Failed to start audio transcription. Please check your microphone permissions.');
    }
  };

  const handleEndCall = async () => {
    try {
      // Stop listening
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
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-sm">
      {/* Session Status Indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="relative" 
            role="status" 
            aria-live="polite"
            aria-label={isSessionActive ? 'Call session is active' : 'Ready to start call'}
          >
            {isSessionActive && (
              <>
                {/* Pulsing dot animation */}
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" aria-hidden="true" />
                <div className="relative w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
              </>
            )}
            {!isSessionActive && (
              <div className="w-3 h-3 rounded-full bg-gray-300" aria-hidden="true" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700" aria-hidden="true">
            {isSessionActive ? 'Call Active' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Start/End Call Button */}
      <button
        onClick={isSessionActive ? handleEndCall : handleStartCall}
        className={`
          w-full py-4 sm:py-5 px-6 rounded-xl font-semibold text-base sm:text-lg
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          min-h-[44px] touch-manipulation
          ${
            isSessionActive
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-300'
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-300'
          }
        `}
        aria-label={isSessionActive ? 'End current call session' : 'Start new call session'}
        aria-pressed={isSessionActive}
      >
        {isSessionActive ? 'End Call' : 'Start Call'}
      </button>

      {/* Detected Pickup Line Display */}
      {detectedPickupLine && (
        <div 
          className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200"
          role="status"
          aria-live="polite"
          aria-label={`Detected opener: ${detectedPickupLine.text}`}
        >
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Detected Opener
          </p>
          <p className="text-sm sm:text-base text-gray-800">{detectedPickupLine.text}</p>
          {detectedPickupLine.category && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md">
              {detectedPickupLine.category}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
