import { useState, useEffect, useRef } from 'react';
import type { CallSession, Feedback, PickupLineStatistics } from './domain/types';
import {
  CallControlPanel,
  FeedbackCard,
  CelebrationAnimation,
  PerformanceDashboard,
  PickupLineLibrary,
  TranscriptionServiceInfo,
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

/**
 * Main App Component
 * Integrates all components and manages application-level state
 * Requirements: All
 */
function App() {
  // Initialize services
  const [dataRepository] = useState(() => new LocalStorageDataRepository());
  const [transcriptionService] = useState(() => TranscriptionServiceFactory.create());
  const [performanceAnalyzer] = useState(() => new DefaultPerformanceAnalyzer(dataRepository));
  const [feedbackGenerator] = useState(() => new DefaultFeedbackGenerator(performanceAnalyzer));
  const [sessionManager] = useState(
    () => new DefaultCallSessionManager(feedbackGenerator, dataRepository)
  );

  // Application state
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [statistics, setStatistics] = useState<PickupLineStatistics[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'performance' | 'library'>('control');

  // Ref for CallControlPanel
  const callControlRef = useRef<CallControlPanelRef>(null);

  // Initialize performance analyzer and load statistics
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

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard navigation when focus is on tab buttons
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') !== 'tab') return;

      const tabs: ('control' | 'performance' | 'library')[] = ['control', 'performance', 'library'];
      const currentIndex = tabs.indexOf(activeTab);

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
          break;
        case 'Home':
          event.preventDefault();
          setActiveTab(tabs[0]);
          break;
        case 'End':
          event.preventDefault();
          setActiveTab(tabs[tabs.length - 1]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Handle session start
  const handleSessionStart = (session: CallSession) => {
    setCurrentSession(session);
    setFeedback(null);
    setShowCelebration(false);
  };

  // Handle session end
  const handleSessionEnd = async () => {
    if (!currentSession) {
      console.warn('No active session to end');
      return;
    }

    try {
      // Simulate outcome classification (in real app, this would come from audio analysis)
      // For now, we'll randomly determine outcome for demonstration
      const outcome: 'stayed' | 'left' = Math.random() > 0.5 ? 'stayed' : 'left';
      
      sessionManager.recordOutcome(outcome);
      const result = sessionManager.endSession();

      // Update statistics
      if (currentSession.pickupLineUsed) {
        await performanceAnalyzer.updateStatistics(currentSession.pickupLineUsed, outcome);
        const updatedStats = performanceAnalyzer.getAllStatistics();
        setStatistics(updatedStats);
      }

      // Show feedback
      setFeedback(result.feedback);

      // Show celebration if positive outcome
      if (result.feedback.showCelebration) {
        setShowCelebration(true);
      }

      // Clear current session
      setCurrentSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
      // Show error feedback
      setFeedback({
        type: 'negative',
        message: 'An error occurred while processing the call. Please try again.',
        showCelebration: false,
      });
    }
  };

  // Handle feedback dismissal
  const handleDismissFeedback = () => {
    setFeedback(null);
  };

  // Handle celebration dismissal
  const handleDismissCelebration = () => {
    setShowCelebration(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Pickup Line Coach
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Improve your call opening techniques with real-time feedback
            </p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-gray-200 overflow-x-auto" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 sm:space-x-8" role="tablist">
              <button
                onClick={() => setActiveTab('control')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeTab === 'control'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === 'control'}
                aria-controls="control-panel"
                id="control-tab"
              >
                Call Control
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === 'performance'}
                aria-controls="performance-panel"
                id="performance-tab"
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeTab === 'library'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === 'library'}
                aria-controls="library-panel"
                id="library-tab"
              >
                Library
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {activeTab === 'control' && (
            <div 
              className="space-y-4 sm:space-y-6 lg:space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0" 
              role="tabpanel" 
              id="control-panel" 
              aria-labelledby="control-tab"
            >
              <div className="lg:col-span-1">
                <CallControlPanel
                  ref={callControlRef}
                  sessionManager={sessionManager}
                  transcriptionService={transcriptionService}
                  onSessionStart={handleSessionStart}
                  onSessionEnd={handleSessionEnd}
                />
              </div>
              
              {/* Instructions and Service Info */}
              <div className="lg:col-span-1 max-w-md mx-auto lg:mx-0 space-y-4">
                {/* Transcription Service Info */}
                <TranscriptionServiceInfo />
                
                {/* Instructions */}
                <div className="p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
                    How to use
                  </h3>
                  <ol className="text-xs sm:text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Click "Start Call" to begin a new session</li>
                    <li>Use one of the pickup lines from the library</li>
                    <li>Click "End Call" when the conversation concludes</li>
                    <li>Review your feedback and track your performance</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div 
              role="tabpanel" 
              id="performance-panel" 
              aria-labelledby="performance-tab"
            >
              <PerformanceDashboard statistics={statistics} />
            </div>
          )}

          {activeTab === 'library' && (
            <div 
              role="tabpanel" 
              id="library-panel" 
              aria-labelledby="library-tab"
            >
              <PickupLineLibrary statistics={statistics} />
            </div>
          )}
        </main>

        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} onDismiss={handleDismissFeedback} />

        {/* Celebration Animation */}
        <CelebrationAnimation show={showCelebration} onDismiss={handleDismissCelebration} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
