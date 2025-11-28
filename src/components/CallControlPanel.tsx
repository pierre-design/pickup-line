import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import type { CallSession, PickupLine } from '../domain/types';
import type { CallSessionManager } from '../services/interfaces';
import type { AudioTranscriptionService } from '../infrastructure/interfaces';
import { PickupLineMatcher } from '../domain/pickupLineMatcher';
import { PICKUP_LINES } from '../domain/pickupLines';

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

      {/* Manual Pickup Line Selection (for testing when transcription fails) */}
      {isSessionActive && !detectedPickupLine && !isListening && (
        <div className="mt-6 p-4 glass rounded-xl border border-yellow/30">
          <p className="text-xs font-semibold text-yellow uppercase tracking-wide mb-3">
            Select Pickup Line Used (Testing Mode)
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PICKUP_LINES.slice(0, 3).map((line) => (
              <button
                key={line.id}
                onClick={() => {
                  setDetectedPickupLine(line);
                  try {
                    sessionManager.recordOpener(line);
                    console.log('Manually recorded pickup line:', line.id);
                  } catch (error) {
                    console.error('Failed to record pickup line:', error);
                  }
                }}
                className="text-left p-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {line.text.length > 60 ? `${line.text.substring(0, 60)}...` : line.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
