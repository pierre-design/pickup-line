# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize React + TypeScript project with Vite
  - Install dependencies: Tailwind CSS, Framer Motion, fast-check, Vitest
  - Configure Tailwind with Apple-inspired design tokens
  - Set up project directory structure (components, services, domain, infrastructure)
  - _Requirements: All_

- [x] 2. Implement core data models and types
  - Create TypeScript interfaces for CallSession, PickupLine, PickupLineStatistics, Feedback
  - Define service interfaces (AudioTranscriptionService, DataRepository, etc.)
  - Create constants file with the 15 pickup lines library
  - _Requirements: 2.2, 5.1, 5.2_

- [x] 3. Implement Outcome Classifier
  - Write OutcomeClassifier class with classifyOutcome method
  - Implement logic: duration < 10s = 'left', duration >= 10s + client spoke = 'stayed'
  - _Requirements: 3.2, 3.3_

- [ ] 3.1 Write property test for outcome classification
  - **Property 6: Call duration determines outcome classification**
  - **Validates: Requirements 3.2, 3.3**
  - Use fast-check to generate random call durations and client response states
  - Verify classification logic holds across all valid inputs

- [x] 4. Implement Success Rate Calculator
  - Write function to calculate success rate: successfulUses / totalUses
  - Handle edge case: return 0 when totalUses is 0
  - _Requirements: 5.2_

- [ ] 4.1 Write property test for success rate calculation
  - **Property 13: Success rate calculation is correct**
  - **Validates: Requirements 5.2**
  - Generate random statistics with varying successful/total uses
  - Verify success rate = successfulUses / totalUses for all inputs
  - Verify edge case: totalUses = 0 returns 0

- [x] 5. Implement Pickup Line Matcher
  - Write PickupLineMatcher class with fuzzy string matching (Levenshtein distance)
  - Set similarity threshold at 80%
  - Implement match() method that returns PickupLine or null
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 5.1 Write property test for pickup line matching
  - **Property 3: Transcriptions trigger matching**
  - **Validates: Requirements 2.2**
  - Generate random transcriptions with varying similarity to pickup lines
  - Verify that exact matches always succeed
  - Verify that matches above threshold succeed, below threshold fail

- [x] 6. Implement Performance Analyzer
  - Write PerformanceAnalyzer class with updateStatistics method
  - Implement getSuccessRate method using success rate calculator
  - Implement getRecommendedPickupLines with filtering logic (exclude lines with <30% success rate and >=10 uses)
  - Implement fallback: if all excluded, return line with highest success rate
  - Implement getAllStatistics with sorting by success rate descending
  - _Requirements: 4.5, 5.1, 6.1, 6.2, 6.4, 7.3, 7.4_

- [ ] 6.1 Write property test for statistics updates
  - **Property 12: Session completion updates statistics**
  - **Validates: Requirements 5.1**
  - Generate random call sessions with outcomes
  - Verify statistics are correctly incremented after each session
  - Verify success rate recalculation is correct

- [ ] 6.2 Write property test for recommendation filtering
  - **Property 11: Suggestions exclude low-performing lines**
  - **Validates: Requirements 4.5, 6.2**
  - Generate random statistics with varying success rates and usage counts
  - Verify lines with <30% success rate and >=10 uses are excluded
  - Verify fallback returns highest success rate when all excluded

- [ ] 6.3 Write property test for statistics sorting
  - **Property 18: Statistics are sorted by success rate**
  - **Validates: Requirements 7.4**
  - Generate random statistics arrays
  - Verify getAllStatistics returns items sorted by success rate descending

- [x] 7. Implement Feedback Generator
  - Write FeedbackGenerator class with generateFeedback method
  - Generate positive feedback for 'stayed' outcome with celebration flag
  - Generate negative feedback for 'left' outcome with suggested pickup line
  - Use PerformanceAnalyzer to get recommended pickup line for suggestions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7.1 Write property test for feedback correspondence
  - **Property 8: Feedback corresponds to outcome**
  - **Validates: Requirements 4.1, 4.2**
  - Generate random outcomes ('stayed' or 'left')
  - Verify 'stayed' always produces positive feedback
  - Verify 'left' always produces negative feedback

- [ ] 7.2 Write property test for negative feedback suggestions
  - **Property 9: Negative feedback includes suggestions**
  - **Validates: Requirements 4.3**
  - Generate random 'left' outcomes with various pickup lines
  - Verify all negative feedback includes a suggested pickup line
  - Verify suggested line is different from current line when possible

- [ ] 7.3 Write property test for positive outcome celebrations
  - **Property 10: Positive outcomes trigger celebrations**
  - **Validates: Requirements 4.4, 8.3**
  - Generate random 'stayed' outcomes
  - Verify all positive feedback has showCelebration = true

- [x] 8. Implement Data Repository with LocalStorage
  - Write DataRepository class implementing the repository interface
  - Implement saveCallSession, getCallSessions methods
  - Implement getPickupLineStatistics, updatePickupLineStatistics methods
  - Add auto-pruning logic (keep last 100 sessions)
  - Handle storage errors gracefully (try to clear old data, fallback to memory)
  - _Requirements: 3.4, 5.1, 7.1, 7.2, 7.3_

- [ ] 8.1 Write property test for outcome persistence
  - **Property 7: Classified outcomes are persisted**
  - **Validates: Requirements 3.4**
  - Generate random call sessions with outcomes
  - Save sessions and verify they can be retrieved
  - Verify retrieved sessions match saved sessions (round-trip property)

- [x] 9. Implement Call Session Manager
  - Write CallSessionManager class with session lifecycle methods
  - Implement startSession: create new session, generate UUID, set startTime
  - Implement recordOpener: store pickup line in current session
  - Implement recordOutcome: store outcome, calculate duration, end session
  - Implement endSession: generate feedback using FeedbackGenerator, save to repository
  - _Requirements: 1.1, 2.3, 3.4, 4.1, 4.2, 5.1_

- [ ] 9.1 Write property test for session initialization
  - **Property 1: Session initialization activates system**
  - **Validates: Requirements 1.1, 1.2, 1.3**
  - Generate random initial states
  - Verify startSession always creates valid session with ID and startTime
  - Verify each session has unique ID

- [x] 10. Implement mock Audio Transcription Service
  - Create mock AudioTranscriptionService for development and testing
  - Implement startListening, stopListening, onTranscription methods
  - Simulate transcription with configurable delay
  - Allow manual triggering of transcription events for testing
  - _Requirements: 2.1, 3.1_

- [ ] 10.1 Write property test for audio transcription triggering
  - **Property 2: Audio triggers transcription**
  - **Validates: Requirements 2.1, 3.1**
  - Generate random audio inputs (simulated)
  - Verify transcription callback is invoked for all inputs when listening
  - Verify no callbacks when not listening

- [x] 11. Build Call Control Panel component
  - Create CallControlPanel React component
  - Implement "Start Call" button with Apple styling
  - Add session status indicator (pulsing dot when active)
  - Display detected pickup line when matched
  - Wire up to CallSessionManager
  - _Requirements: 1.1, 1.2, 2.3_

- [x] 12. Build Feedback Card component
  - Create FeedbackCard React component
  - Implement slide-in animation with Framer Motion
  - Style success feedback (green, checkmark, positive message)
  - Style failure feedback (orange, lightbulb, constructive message)
  - Display suggested pickup line in highlighted box for failures
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 13. Build Celebration Animation component
  - Create CelebrationAnimation React component using Framer Motion
  - Implement Duolingo-style confetti particles
  - Add bouncing checkmark animation
  - Set duration to 2 seconds with auto-dismiss
  - Make dismissible by clicking anywhere
  - _Requirements: 4.4_

- [x] 14. Build Performance Dashboard component
  - Create PerformanceDashboard React component
  - Display overall statistics at top (total calls, overall success rate)
  - Implement scrollable list of pickup lines with statistics
  - Show success rate with color-coded progress bar
  - Implement sorting (by success rate descending)
  - Use virtualization for long lists
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14.1 Write property test for performance data display
  - **Property 17: Performance data displays aggregate statistics**
  - **Validates: Requirements 7.1, 7.2, 7.3**
  - Generate random statistics arrays
  - Verify total calls = sum of all totalUses
  - Verify overall success rate = sum(successfulUses) / sum(totalUses)

- [x] 15. Build Pickup Line Library component
  - Create PickupLineLibrary React component
  - Display all 15 pickup lines in card layout
  - Show success rate badge for lines with >=5 uses
  - Add visual indicator for excluded lines (grayed out with info icon)
  - Implement tap to view detailed statistics
  - _Requirements: 5.3, 5.4, 6.3_

- [ ] 15.1 Write property test for success rate display
  - **Property 14: Success rates are displayed**
  - **Validates: Requirements 5.3, 5.4**
  - Generate random statistics with varying usage counts
  - Verify success rate badge appears only for lines with >=5 uses
  - Verify badge shows correct percentage

- [ ] 15.2 Write property test for excluded line availability
  - **Property 16: Excluded lines remain manually selectable**
  - **Validates: Requirements 6.3**
  - Generate statistics with some lines below 30% threshold
  - Verify excluded lines are still present in library
  - Verify excluded lines can still be selected

- [x] 16. Build main App component and integrate all pieces
  - Create App component with state management
  - Integrate CallControlPanel, FeedbackCard, CelebrationAnimation, PerformanceDashboard
  - Implement application-level state (current session, statistics, feedback)
  - Wire up all components to CallSessionManager and PerformanceAnalyzer
  - Add error boundary for graceful error handling
  - _Requirements: All_

- [x] 17. Implement error handling and edge cases
  - Add error handling for transcription failures
  - Implement retry logic with exponential backoff
  - Add offline mode fallback (manual selection)
  - Handle storage errors with graceful degradation
  - Implement matching ambiguity resolution (confidence score comparison)
  - _Requirements: 2.4_

- [x] 18. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation
  - Add focus indicators
  - Test color contrast ratios (4.5:1 minimum)
  - Add prefers-reduced-motion support
  - _Requirements: 8.2_

- [x] 19. Implement responsive design
  - Add mobile-first responsive styles
  - Ensure minimum touch target size (44x44px)
  - Optimize for portrait orientation
  - Add tablet two-column layout
  - Test on various screen sizes
  - _Requirements: 8.2_

- [x] 20. Performance optimization
  - Implement audio streaming in chunks
  - Add debouncing for transcription results (300ms)
  - Memoize expensive calculations (success rates, sorting)
  - Virtualize long lists
  - Lazy load historical data
  - _Requirements: 5.1, 7.3_

- [x] 21. Final checkpoint - Run all tests and verify property coverage
  - Run all unit tests and ensure they pass
  - Run all property-based tests and ensure they pass (minimum 100 iterations each)
  - Verify each correctness property from design.md has a corresponding test
  - Ensure all tests pass, ask the user if questions arise
