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

    useImperativeHandle(ref, () => ({
      setDetectedPickupLine,
      isSessionActive: () => isSessionActive,
    }));

    useEffect(() => {
      transcriptionService.onTranscription((text, speaker) => {
        console.log(`Transcription from ${speaker}:`, text);
      });
    }, [transcriptionService]);

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
          focus:outline-none focus:ring-2 focus:ring-yellow
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

      {/* Detected Pickup Line */}
      {detectedPickupLine && (
        <div 
          className="mt-6 p-4 glass rounded-xl border border-primary/30 animate-scale-in"
          role="status"
          aria-live="polite"
          aria-label={`Detected opener: ${detectedPickupLine.text}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Detected Opener
              </p>
              <p className="text-sm text-white font-medium leading-relaxed">
                {detectedPickupLine.text}
              </p>
              {detectedPickupLine.category && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-white/80 bg-white/10 rounded-md">
                  {detectedPickupLine.category}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
