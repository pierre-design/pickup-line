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
    <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 hover-lift">
      {/* Session Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="relative" 
            role="status" 
            aria-live="polite"
            aria-label={isSessionActive ? 'Call session is active' : 'Ready to start call'}
          >
            {isSessionActive ? (
              <>
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" aria-hidden="true" />
                <div className="relative w-4 h-4 rounded-full bg-primary shadow-glow-primary" aria-hidden="true" />
              </>
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/20" aria-hidden="true" />
            )}
          </div>
          <div>
            <span className="text-sm font-semibold text-white block" aria-hidden="true">
              {isSessionActive ? 'Live Call' : 'Ready'}
            </span>
            {isSessionActive && (
              <span className="text-xs text-white/60">Recording in progress</span>
            )}
          </div>
        </div>
        
        {isSessionActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">REC</span>
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <button
        onClick={isSessionActive ? handleEndCall : handleStartCall}
        className={`
          w-full py-5 px-6 rounded-xl font-bold text-lg
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          min-h-[60px] touch-manipulation
          relative overflow-hidden group
          ${
            isSessionActive
              ? 'bg-gradient-to-r from-error to-red-600 hover:from-red-600 hover:to-error text-white focus:ring-error shadow-hard'
              : 'bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-primary text-white focus:ring-primary shadow-glow-primary'
          }
        `}
        aria-label={isSessionActive ? 'End current call session' : 'Start new call session'}
        aria-pressed={isSessionActive}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          <span className="text-2xl">{isSessionActive ? '⏹️' : '▶️'}</span>
          <span>{isSessionActive ? 'End Call' : 'Start Call'}</span>
        </span>
        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
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

      {/* Tips when not active */}
      {!isSessionActive && !detectedPickupLine && (
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-white/60 text-center">
            Click Start Call to begin practicing your opening lines
          </p>
        </div>
      )}
    </div>
  );
});
