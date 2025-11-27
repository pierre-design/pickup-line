import { useState, useEffect, useRef } from 'react';
import type { CallSession, Feedback, PickupLineStatistics } from './domain/types';
import {
  CallControlPanel,
  FeedbackCard,
  CelebrationAnimation,
  PerformanceDashboard,
  PickupLineCarousel,
} from './components';
import type { CallControlPanelRef } from './components';
import {
  DefaultCallSessionManager,
  DefaultPerformanceAnalyzer,
  DefaultFeedbackGenerator,
} from './services';
import { LocalStorageDataRepository, TranscriptionServiceFactory } from './infrastructure';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  const [statistics, setStatistics] = useState<PickupLineStatistics[]>([]);

  const callControlRef = useRef<CallControlPanelRef>(null);

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

    try {
      const outcome: 'stayed' | 'left' = Math.random() > 0.5 ? 'stayed' : 'left';
      
      sessionManager.recordOutcome(outcome);
      const result = sessionManager.endSession();

      if (currentSession.pickupLineUsed) {
        await performanceAnalyzer.updateStatistics(currentSession.pickupLineUsed, outcome);
        const updatedStats = performanceAnalyzer.getAllStatistics();
        setStatistics(updatedStats);
      }

      setFeedback(result.feedback);

      if (result.feedback.showCelebration) {
        setShowCelebration(true);
      }

      setCurrentSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
      setFeedback({
        type: 'negative',
        message: 'An error occurred while processing the call. Please try again.',
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

  // Get service info for status indicator
  const serviceInfo = TranscriptionServiceFactory.getAvailableServices();
  const isServiceActive = serviceInfo.current !== 'mock';

  return (
    <ErrorBoundary>
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#01150A]">
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow focus:text-black focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Section 1: Home / Call Control - Full viewport height */}
        <section className="min-h-screen h-screen bg-gradient-to-b from-[#04411F] to-[#01150A] flex flex-col snap-start snap-always pt-safe">
          <div className="flex-1 flex flex-col items-center px-6 md:px-8 lg:px-8 pt-8 pb-20 md:pb-8 min-h-0">
            {/* Header with Status Indicator */}
            <div className="w-full max-w-2xl mb-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-left">
                  Pickup Line Coach
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
            </div>

            {/* Pickup Line Carousel */}
            <div className="w-full max-w-2xl mb-6">
              <PickupLineCarousel statistics={statistics} />
            </div>

            {/* Call Control Panel */}
            <div className="w-full max-w-md mb-4">
              <CallControlPanel
                ref={callControlRef}
                sessionManager={sessionManager}
                transcriptionService={transcriptionService}
                onSessionStart={handleSessionStart}
                onSessionEnd={handleSessionEnd}
              />
            </div>

            {/* Description below button */}
            <p className="text-light-green text-center text-sm sm:text-base mb-6">
              Improve how you start your calls
            </p>

            {/* Quick Guide - Bottom Info Tile */}
            <div className="w-full max-w-2xl mt-auto mb-4">
              <div className="border-2 border-light-green rounded-lg p-6 bg-dark-green/30">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  Quick Guide
                </h3>
                <ol className="text-sm text-white/80 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-light-green/20 text-light-green flex items-center justify-center text-xs font-bold">1</span>
                    <span>Click "Start Call" to begin a new session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-light-green/20 text-light-green flex items-center justify-center text-xs font-bold">2</span>
                    <span>Use one of the pickup lines from your library</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-light-green/20 text-light-green flex items-center justify-center text-xs font-bold">3</span>
                    <span>Click "End Call" when the conversation concludes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-light-green/20 text-light-green flex items-center justify-center text-xs font-bold">4</span>
                    <span>Review your feedback and track your performance below</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Performance Dashboard - Content-based height */}
        <section className="min-h-screen bg-[#01150A] snap-start snap-always pb-20 md:pb-8">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-[#01150A] pt-safe pt-12 md:pt-20 pb-6 px-6 md:px-8 lg:px-8">
            <div className="w-full max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">
                Your best opening lines
              </h2>
              <PerformanceDashboard statistics={statistics} />
            </div>
          </div>
        </section>

        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} onDismiss={handleDismissFeedback} />

        {/* Celebration Animation */}
        <CelebrationAnimation show={showCelebration} onDismiss={handleDismissCelebration} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
