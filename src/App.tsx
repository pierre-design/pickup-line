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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-glow-primary"
        >
          Skip to main content
        </a>

        {/* Header with glassmorphism */}
        <header className="glass border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                  <span className="gradient-text">Pickup Line Coach</span>
                </h1>
                <p className="text-sm sm:text-base text-white/60">
                  Master your call opening techniques
                </p>
              </div>
              
              {/* Stats badge */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="glass px-4 py-2 rounded-xl">
                  <div className="text-xs text-white/60">Total Calls</div>
                  <div className="text-xl font-bold text-white">
                    {statistics.reduce((sum, stat) => sum + stat.totalUses, 0)}
                  </div>
                </div>
                <div className="glass px-4 py-2 rounded-xl">
                  <div className="text-xs text-white/60">Success Rate</div>
                  <div className="text-xl font-bold text-primary">
                    {statistics.length > 0
                      ? Math.round(
                          (statistics.reduce((sum, stat) => sum + stat.successfulUses, 0) /
                            statistics.reduce((sum, stat) => sum + stat.totalUses, 0)) *
                            100
                        ) || 0
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs - Spotify style */}
        <nav className="glass border-b border-white/10 sticky top-[88px] sm:top-[104px] z-30 backdrop-blur-xl" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 sm:gap-4" role="tablist">
              {[
                { id: 'control', label: 'Control', icon: '🎙️' },
                { id: 'performance', label: 'Performance', icon: '📊' },
                { id: 'library', label: 'Library', icon: '📚' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    relative py-3 sm:py-4 px-4 sm:px-6 font-medium text-sm sm:text-base
                    transition-all duration-200 rounded-t-lg
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-900
                    ${
                      activeTab === tab.id
                        ? 'text-white bg-white/5'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  id={`${tab.id}-tab`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="animate-fade-in">
            {activeTab === 'control' && (
              <div 
                className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0" 
                role="tabpanel" 
                id="control-panel" 
                aria-labelledby="control-tab"
              >
                <div className="lg:col-span-1 animate-slide-up">
                  <CallControlPanel
                    ref={callControlRef}
                    sessionManager={sessionManager}
                    transcriptionService={transcriptionService}
                    onSessionStart={handleSessionStart}
                    onSessionEnd={handleSessionEnd}
                  />
                </div>
                
                <div className="lg:col-span-1 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <TranscriptionServiceInfo />
                  
                  <div className="glass p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>💡</span>
                      <span>Quick Guide</span>
                    </h3>
                    <ol className="text-sm text-white/80 space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                        <span>Click "Start Call" to begin a new session</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                        <span>Use one of the pickup lines from the library</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                        <span>Click "End Call" when the conversation concludes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
                        <span>Review your feedback and track your performance</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div 
                className="animate-slide-up"
                role="tabpanel" 
                id="performance-panel" 
                aria-labelledby="performance-tab"
              >
                <PerformanceDashboard statistics={statistics} />
              </div>
            )}

            {activeTab === 'library' && (
              <div 
                className="animate-slide-up"
                role="tabpanel" 
                id="library-panel" 
                aria-labelledby="library-tab"
              >
                <PickupLineLibrary statistics={statistics} />
              </div>
            )}
          </div>
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
