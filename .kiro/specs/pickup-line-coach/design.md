# Design Document

## Overview

The Pickup Line Coach is a real-time feedback application that helps sales agents improve their call opening techniques. The system uses speech recognition to identify which pickup line an agent uses, detects client responses, provides immediate feedback, and tracks performance metrics to adaptively recommend the most effective openers.

The application architecture separates concerns into distinct layers: audio processing, business logic, data persistence, and user interface. This separation enables independent testing and future extensibility.

## Architecture

The system follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - Call Controls                    │
│  - Feedback Display                 │
│  - Performance Dashboard            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │
│  - Call Session Manager             │
│  - Feedback Generator               │
│  - Performance Analyzer             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Domain Layer                  │
│  - Pickup Line Matcher              │
│  - Outcome Classifier               │
│  - Success Rate Calculator          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Infrastructure Layer             │
│  - Audio Transcription (WhisperX)   │
│  - Data Repository (LocalStorage)   │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Audio Transcription Service

**Responsibility:** Convert speech to text using WhisperX

**Interface:**
```typescript
interface AudioTranscriptionService {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  onTranscription(callback: (text: string, speaker: 'agent' | 'client') => void): void;
}
```

### 2. Pickup Line Matcher

**Responsibility:** Match transcribed text against the library of 15 pickup lines

**Interface:**
```typescript
interface PickupLineMatcher {
  match(transcription: string): PickupLine | null;
  getAllPickupLines(): PickupLine[];
}

interface PickupLine {
  id: string;
  text: string;
  category?: string;
}
```

**Matching Strategy:** Use fuzzy string matching (Levenshtein distance) with a threshold of 80% similarity to account for transcription variations and natural speech patterns.

### 3. Outcome Classifier

**Responsibility:** Determine if client stayed or left based on call duration and interaction

**Interface:**
```typescript
interface OutcomeClassifier {
  classifyOutcome(callDuration: number, hasClientResponse: boolean): 'stayed' | 'left';
}
```

**Classification Logic:**
- If call duration < 10 seconds after opener: classify as 'left'
- If call duration >= 10 seconds and client spoke: classify as 'stayed'

### 4. Call Session Manager

**Responsibility:** Orchestrate the flow of a single call session

**Interface:**
```typescript
interface CallSessionManager {
  startSession(): CallSession;
  recordOpener(pickupLine: PickupLine): void;
  recordOutcome(outcome: 'stayed' | 'left'): void;
  endSession(): CallSessionResult;
}

interface CallSession {
  id: string;
  startTime: Date;
  pickupLineUsed?: PickupLine;
  outcome?: 'stayed' | 'left';
}

interface CallSessionResult {
  session: CallSession;
  feedback: Feedback;
}
```

### 5. Performance Analyzer

**Responsibility:** Calculate success rates and determine which pickup lines to recommend

**Interface:**
```typescript
interface PerformanceAnalyzer {
  updateStatistics(pickupLineId: string, outcome: 'stayed' | 'left'): void;
  getSuccessRate(pickupLineId: string): number;
  getRecommendedPickupLines(): PickupLine[];
  getAllStatistics(): PickupLineStatistics[];
}

interface PickupLineStatistics {
  pickupLine: PickupLine;
  totalUses: number;
  successfulUses: number;
  successRate: number;
}
```

**Recommendation Logic:**
- Exclude pickup lines with success rate < 30% and at least 10 uses
- Sort remaining lines by success rate descending
- If all lines are excluded, return the line with highest success rate

### 6. Feedback Generator

**Responsibility:** Generate appropriate feedback messages and suggestions

**Interface:**
```typescript
interface FeedbackGenerator {
  generateFeedback(outcome: 'stayed' | 'left', currentPickupLine: PickupLine): Feedback;
}

interface Feedback {
  type: 'positive' | 'negative';
  message: string;
  suggestedPickupLine?: PickupLine;
  showCelebration: boolean;
}
```

### 7. Data Repository

**Responsibility:** Persist and retrieve performance data

**Interface:**
```typescript
interface DataRepository {
  saveCallSession(session: CallSession): Promise<void>;
  getCallSessions(): Promise<CallSession[]>;
  getPickupLineStatistics(): Promise<PickupLineStatistics[]>;
  updatePickupLineStatistics(stats: PickupLineStatistics): Promise<void>;
}
```

## Data Models

### CallSession
```typescript
{
  id: string;              // UUID
  startTime: Date;
  endTime?: Date;
  pickupLineUsed?: string; // Pickup line ID
  outcome?: 'stayed' | 'left';
  agentTranscription?: string;
  clientTranscription?: string;
}
```

### PickupLine
```typescript
{
  id: string;
  text: string;
  category?: string;
}
```

### PickupLineStatistics
```typescript
{
  pickupLineId: string;
  totalUses: number;
  successfulUses: number;
  successRate: number;     // Calculated: successfulUses / totalUses
  lastUsed?: Date;
}
```

### Feedback
```typescript
{
  type: 'positive' | 'negative';
  message: string;
  suggestedPickupLine?: PickupLine;
  showCelebration: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Session initialization activates system
*For any* initial system state, when an agent starts a new call session, the system should create a new session object, activate audio listening, and display a ready state indicator.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Audio triggers transcription
*For any* audio input (agent or client), when the audio is received during an active session, the system should invoke the transcription service.
**Validates: Requirements 2.1, 3.1**

### Property 3: Transcriptions trigger matching
*For any* transcription received from an agent, the system should attempt to match it against the library of 15 pickup lines.
**Validates: Requirements 2.2**

### Property 4: Successful matches are recorded
*For any* pickup line that matches the agent's transcription, the system should record that pickup line ID in the current call session.
**Validates: Requirements 2.3**

### Property 5: Non-matches trigger prompts
*For any* agent transcription that does not match any pickup line in the library, the system should display a prompt asking the agent to use a recognized pickup line.
**Validates: Requirements 2.4**

### Property 6: Call duration determines outcome classification
*For any* call session, if the call duration is less than 10 seconds after the opener, the outcome should be classified as 'left'; if the call duration is 10 seconds or more and the client spoke, the outcome should be classified as 'stayed'.
**Validates: Requirements 3.2, 3.3**

### Property 7: Classified outcomes are persisted
*For any* call session with a classified outcome, the system should store the outcome associated with the pickup line used, and that data should be retrievable from storage.
**Validates: Requirements 3.4**

### Property 8: Feedback corresponds to outcome
*For any* call session outcome, if the outcome is 'stayed', the system should display a positive rating message; if the outcome is 'left', the system should display a negative rating message.
**Validates: Requirements 4.1, 4.2**

### Property 9: Negative feedback includes suggestions
*For any* negative rating displayed, the system should suggest an alternative pickup line from the library.
**Validates: Requirements 4.3**

### Property 10: Positive outcomes trigger celebrations
*For any* positive rating displayed, the system should show a celebration animation.
**Validates: Requirements 4.4, 8.3**

### Property 11: Suggestions exclude low-performing lines
*For any* pickup line suggestion, if a pickup line has a success rate below 30% and has been used at least 10 times, it should not be included in the suggested alternatives.
**Validates: Requirements 4.5, 6.2**

### Property 12: Session completion updates statistics
*For any* completed call session, the system should recalculate and update the success rate for the pickup line that was used.
**Validates: Requirements 5.1**

### Property 13: Success rate calculation is correct
*For any* pickup line with recorded usage data, the success rate should equal the number of successful calls (client stayed) divided by the total number of calls using that pickup line.
**Validates: Requirements 5.2**

### Property 14: Success rates are displayed
*For any* pickup line with at least 5 uses, when displaying that pickup line, the system should show its success rate formatted as a percentage.
**Validates: Requirements 5.3, 5.4**

### Property 15: Performance trends are calculated for sufficient data
*For any* pickup line that has been used at least 10 times, the system should calculate its performance trend.
**Validates: Requirements 6.1**

### Property 16: Excluded lines remain manually selectable
*For any* pickup line that is excluded from automatic suggestions due to low performance, the pickup line should still appear in the full library list for manual selection by the agent.
**Validates: Requirements 6.3**

### Property 17: Performance data displays aggregate statistics
*For any* performance data request, the system should display the total number of calls made, the overall success rate across all pickup lines, and a list of each pickup line with its individual success rate.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 18: Statistics are sorted by success rate
*For any* display of pickup line statistics, the list should be sorted in descending order by success rate (highest to lowest).
**Validates: Requirements 7.4**

## Error Handling

### Audio Transcription Errors

**Scenario:** WhisperX fails to transcribe audio or returns empty results

**Handling:**
- Log the error with timestamp and audio metadata
- Display a user-friendly message: "Unable to detect speech. Please speak clearly and try again."
- Do not create or update call session data
- Allow the agent to retry without penalty

### Network/API Errors

**Scenario:** WhisperX API is unavailable or times out

**Handling:**
- Implement exponential backoff retry logic (3 attempts)
- Cache audio locally for retry attempts
- Display status message: "Connecting to transcription service..."
- If all retries fail, allow offline mode where agent can manually select pickup line used and outcome

### Data Persistence Errors

**Scenario:** LocalStorage is full or unavailable

**Handling:**
- Attempt to clear old session data (keep only last 100 sessions)
- If clearing fails, operate in memory-only mode for current session
- Display warning: "Storage limit reached. Some historical data may be lost."
- Ensure current session data is preserved in memory until successfully saved

### Invalid State Errors

**Scenario:** Agent attempts to end session before recording an opener

**Handling:**
- Prompt agent: "No pickup line detected. Did you use one of the recognized openers?"
- Offer options: "Select pickup line manually" or "Cancel session"
- Do not record session if cancelled
- If manual selection made, proceed with outcome classification

### Matching Ambiguity

**Scenario:** Agent's transcription matches multiple pickup lines with similar confidence

**Handling:**
- Select the match with highest confidence score
- If confidence scores are within 5% of each other, prompt agent to confirm: "Did you use: [Pickup Line A] or [Pickup Line B]?"
- Record the confirmed selection

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests. Unit tests will focus on:

1. **Core Logic Functions:**
   - Success rate calculation with various input combinations
   - Outcome classification with boundary conditions (exactly 10 seconds, 9 seconds, 11 seconds)
   - Pickup line matching with fuzzy string matching edge cases
   - Recommendation filtering logic with various success rate scenarios

2. **Component Behavior:**
   - Call session state transitions
   - Feedback message generation for different outcomes
   - Statistics sorting and filtering

3. **Edge Cases:**
   - Empty pickup line library
   - All pickup lines below threshold (fallback to highest)
   - Division by zero in success rate calculation (0 total uses)
   - Negative or invalid call durations

### Property-Based Testing

The application will use **fast-check** as the property-based testing library. Property-based tests will verify universal properties across randomly generated inputs:

1. **Configuration:**
   - Each property-based test will run a minimum of 100 iterations
   - Tests will use fast-check's built-in generators and custom generators for domain objects

2. **Test Tagging:**
   - Each property-based test will include a comment tag in this format:
   - `// Feature: pickup-line-coach, Property {number}: {property description}`
   - Example: `// Feature: pickup-line-coach, Property 13: Success rate calculation is correct`

3. **Property Coverage:**
   - Each correctness property listed above will be implemented as a single property-based test
   - Tests will generate random valid inputs (call sessions, pickup lines, statistics) to verify properties hold universally

4. **Generators:**
   - Custom generators for: CallSession, PickupLine, PickupLineStatistics, call durations, transcription text
   - Generators will produce both typical and edge-case values

### Integration Testing

Integration tests will verify:
- End-to-end flow from session start to feedback display
- Audio transcription service integration with mock WhisperX responses
- Data persistence and retrieval through the repository layer
- UI component integration with application state

### Testing Approach

The dual testing approach ensures comprehensive coverage:
- **Unit tests** catch specific bugs in individual functions and components
- **Property-based tests** verify that core business logic holds true across all possible inputs
- Together, they provide confidence that the system behaves correctly in both common and edge-case scenarios

## UI/UX Design

### Design System

**Framework:** React with TypeScript
**Styling:** Tailwind CSS with custom Apple-inspired design tokens
**Animation:** Framer Motion for smooth transitions and celebrations

### Design Tokens

```typescript
const designTokens = {
  colors: {
    primary: '#007AFF',      // Apple blue
    success: '#34C759',      // Apple green
    warning: '#FF9500',      // Apple orange
    error: '#FF3B30',        // Apple red
    background: '#F2F2F7',   // Apple light gray
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      xxl: '34px',
    },
  },
};
```

### Key UI Components

#### 1. Call Control Panel
- Large, prominent "Start Call" button (Apple blue, rounded)
- Session status indicator (pulsing dot when active)
- Current pickup line display (if detected)

#### 2. Feedback Card
- Animated card that slides in from bottom
- Success: Green background, checkmark icon, encouraging message
- Failure: Orange background (not red - less harsh), lightbulb icon, constructive message
- Suggested pickup line displayed in a highlighted box

#### 3. Celebration Animation
- Duolingo-style: Confetti particles, bouncing checkmark, sound effect (optional)
- Duration: 2 seconds
- Dismissible by tapping anywhere

#### 4. Performance Dashboard
- Card-based layout with rounded corners
- Overall stats at top (total calls, overall success rate)
- Scrollable list of pickup lines with:
  - Pickup line text
  - Success rate with color-coded progress bar
  - Number of uses
- Sort toggle (success rate / most used / alphabetical)

#### 5. Pickup Line Library
- Grid or list view toggle
- Each line shows: text, category tag, success rate badge
- Tap to view detailed statistics
- Visual indicator for excluded lines (grayed out with info icon)

### Responsive Design

- Mobile-first approach (primary use case: agents on phones/tablets)
- Minimum touch target size: 44x44px (Apple HIG standard)
- Optimized for portrait orientation
- Tablet: Two-column layout (controls + dashboard)

### Accessibility

- WCAG 2.1 AA compliance
- Sufficient color contrast ratios (4.5:1 for text)
- Screen reader support with ARIA labels
- Keyboard navigation support
- Focus indicators on all interactive elements
- Reduced motion option (respects prefers-reduced-motion)

## Performance Considerations

### Audio Processing
- Stream audio in chunks to WhisperX (don't wait for full recording)
- Implement debouncing for transcription results (300ms)
- Cancel pending transcription requests when new audio starts

### Data Storage
- Limit stored sessions to last 100 calls (auto-prune older data)
- Lazy load historical data (only when dashboard is opened)
- Index sessions by date for efficient querying

### UI Rendering
- Virtualize long lists (pickup line library, session history)
- Memoize expensive calculations (success rates, sorting)
- Debounce search/filter inputs (300ms)
- Use React.memo for static components

## Security Considerations

### Data Privacy
- All data stored locally (no server transmission)
- No PII collected (only pickup line IDs and outcomes)
- Option to clear all data (settings menu)

### Audio Handling
- Audio streams not persisted to disk
- Transcriptions stored temporarily (cleared after session)
- WhisperX API calls over HTTPS only

## Future Extensibility

### Potential Enhancements
1. **Custom Pickup Lines:** Allow agents to add their own openers
2. **A/B Testing:** Compare two pickup lines head-to-head
3. **Context Awareness:** Recommend lines based on time of day, client type
4. **Team Analytics:** Aggregate performance across multiple agents
5. **Voice Tone Analysis:** Analyze confidence, pace, tone of delivery
6. **Multi-language Support:** Support pickup lines in different languages

### Architecture Support
- Plugin system for new transcription providers
- Event-driven architecture allows easy addition of new analytics
- Repository pattern enables switching storage backends (IndexedDB, remote DB)
