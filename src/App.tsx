import { useState, useEffect, useRef } from 'react';
import type { CallSession, Feedback, PickupLineStatistics, PickupLine } from './domain/types';
import {
  CallControlPanel,
  FeedbackCard,
  CelebrationAnimation,
  PerformanceDashboard,
  PickupLineCarousel,
  QuickGuideModal,
  OutcomeSelector,
} from './components';
import type { CallControlPanelRef } from './components';
import {
  DefaultCallSessionManager,
  DefaultPerformanceAnalyzer,
  DefaultFeedbackGenerator,
} from './services';
import { LocalStorageDataRepository, TranscriptionServiceFactory } from './infrastructure';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OutcomeDetector } from './domain/outcomeDetector';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  const [dataRepository] = useState(() => new LocalStorageDataRepository());
  const [transcriptionService] = useState(() => TranscriptionServiceFactory.create());
  const [performanceAnalyzer] = useState(() => new DefaultPerformanceAnalyzer(dataRepository));
  const [feedbackGenerator] = useState(() => new DefaultFeedbackGenerator(performanceAnalyzer));
  const [sessionManager] = useState(
    () => new DefaultCallSessionManager(feedbackGenerator, dataRepository)
  );

  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showOutcomeSelector, setShowOutcomeSelector] = useState(false);
  const [suggestedOutcome, setSuggestedOutcome] = useState<'stayed' | 'left' | null>(null);
  const [outcomeConfidence, setOutcomeConfidence] = useState<number>(0);
  const [statistics, setStatistics] = useState<PickupLineStatistics[]>([]);
  const [activePickupLine, setActivePickupLine] = useState<PickupLine | undefined>();

  const callControlRef = useRef<CallControlPanelRef>(null);
  const [outcomeDetector] = useState(() => new OutcomeDetector());

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await performanceAnalyzer.initialize();
        const stats = performanceAnalyzer.getAllStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [performanceAnalyzer]);

  const handleSessionStart = (session: CallSession) => {
    setCurrentSession(session);
    setFeedback(null);
    setShowCelebration(false);
  };

  const handleSessionEnd = async () => {
    if (!currentSession) {
      console.warn('No active session to end');
      return;
    }

    // Detect outcome using AI if we have client transcription
    if (currentSession.clientTranscription) {
      const callDuration = currentSession.endTime && currentSession.startTime
        ? (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / 1000
        : 0;

      const detection = outcomeDetector.detectOutcome(
        currentSession.clientTranscription,
        callDuration
      );

      setSuggestedOutcome(detection.suggestedOutcome);
      setOutcomeConfidence(detection.confidence);
      
      console.log('[AI Outcome Detection]', {
        suggested: detection.suggestedOutcome,
        confidence: detection.confidence,
        signals: detection.signals,
      });
    } else {
      // No transcription available, show manual selector without suggestion
      setSuggestedOutcome(null);
      setOutcomeConfidence(0);
    }

    // Show outcome selector
    setShowOutcomeSelector(true);
  };

  const handleOutcomeSelect = async (outcome: 'stayed' | 'left') => {
    setShowOutcomeSelector(false);

    if (!currentSession) {
      console.warn('No current session when selecting outcome');
      // Still stop listening if no session
      await callControlRef.current?.stopListening();
      return;
    }

    try {
      // Record the outcome
      sessionManager.recordOutcome(outcome);
      
      // End the session and get feedback
      const result = sessionManager.endSession();

      // Update statistics if a pickup line was used
      if (currentSession.pickupLineUsed) {
        console.log('Updating statistics for pickup line:', currentSession.pickupLineUsed, 'outcome:', outcome);
        try {
          await performanceAnalyzer.updateStatistics(currentSession.pickupLineUsed, outcome);
          const updatedStats = performanceAnalyzer.getAllStatistics();
          setStatistics(updatedStats);
          console.log('Statistics updated successfully:', updatedStats);
        } catch (statsError) {
          console.error('Error updating statistics:', statsError);
          // Continue anyway - don't fail the whole operation
        }
      } else {
        console.log('No pickup line was used in this session - statistics will not be updated');
      }

      // Show feedback
      setFeedback(result.feedback);

      // Celebration animation removed per user request
      // if (result.feedback.showCelebration) {
      //   setShowCelebration(true);
      // }

      setCurrentSession(null);
      
      // Stop microphone listening after all API calls are complete
      await callControlRef.current?.stopListening();
    } catch (error) {
      console.error('Error ending session:', error);
      console.error('Error details:', error);
      
      // Still clear the session and stop listening
      setCurrentSession(null);
      await callControlRef.current?.stopListening();
      
      setFeedback({
        type: 'negative',
        message: 'Call ended successfully, but there was an issue saving the results.',
        showCelebration: false,
      });
    }
  };

  const handleDismissFeedback = () => {
    setFeedback(null);
  };

  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  const handleShowQuickGuide = () => {
    setShowQuickGuide(true);
  };

  const handleDismissQuickGuide = () => {
    setShowQuickGuide(false);
  };

  // Get service info for status indicator
  const serviceInfo = TranscriptionServiceFactory.getAvailableServices();
  const isServiceActive = serviceInfo.webSpeech;

  return (
    <ErrorBoundary>
      <div className="min-h-screen overflow-y-auto bg-[#01150A]">
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow focus:text-black focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Section 1: Home / Call Control */}
        <section className="bg-gradient-to-b from-[#04411F] to-[#01150A] pt-8 pb-8 px-6 md:px-8 md:pt-20 lg:px-8 lg:pt-24" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}>
          <div className="max-w-2xl mx-auto">
            {/* Header with Status Indicator */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-white text-left">
                Pickup Lines
              </h1>
              
              {/* Status Chip */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isServiceActive 
                  ? 'border-medium-green bg-medium-green/10' 
                  : 'border-pink bg-pink/10'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isServiceActive 
                    ? 'bg-medium-green animate-pulse' 
                    : 'bg-pink'
                }`} />
                <span className={`text-xs font-semibold ${
                  isServiceActive ? 'text-medium-green' : 'text-pink'
                }`}>
                  {isServiceActive ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Pickup Line Carousel */}
            <div className="mb-4">
              <PickupLineCarousel 
                statistics={statistics}
                onActivePickupLineChange={setActivePickupLine}
              />
            </div>

            {/* Call Control Panel */}
            <div className="max-w-md mx-auto mb-3">
              <CallControlPanel
                ref={callControlRef}
                sessionManager={sessionManager}
                transcriptionService={transcriptionService}
                onSessionStart={handleSessionStart}
                onSessionEnd={handleSessionEnd}
                activePickupLine={activePickupLine}
              />
            </div>

            {/* Description below button */}
            <p className="text-light-green text-center text-sm sm:text-base mb-8">
              Improve how you start your calls
            </p>

            {/* Need Help Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleShowQuickGuide}
                className="px-4 py-2 border-2 border-light-green text-light-green rounded-lg text-sm font-semibold hover:bg-light-green/10 transition-colors"
                aria-label="Show quick guide"
              >
                Need Help?
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Performance Dashboard */}
        <section className="bg-[#01150A] py-12 px-6 md:px-8 lg:px-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">
              Your best pickup
            </h2>
            <PerformanceDashboard statistics={statistics} />
          </div>
        </section>

        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} onDismiss={handleDismissFeedback} />

        {/* Celebration Animation */}
        <CelebrationAnimation show={showCelebration} onDismiss={handleDismissCelebration} />

        {/* Quick Guide Modal */}
        <QuickGuideModal show={showQuickGuide} onDismiss={handleDismissQuickGuide} />

        {/* Outcome Selector */}
        <OutcomeSelector 
          show={showOutcomeSelector} 
          onSelect={handleOutcomeSelect}
          suggestedOutcome={suggestedOutcome}
          confidence={outcomeConfidence}
        />
        
        {/* Vercel Analytics */}
        <Analytics />
      </div>
    </ErrorBoundary>
  );
}

export default App;
