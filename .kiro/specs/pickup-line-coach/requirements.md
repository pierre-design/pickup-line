# Requirements Document

## Introduction

The Pickup Line Coach is an application designed to help sales agents improve their call opening techniques through real-time feedback and performance tracking. The system listens to agents' opening lines, evaluates client responses, provides ratings, and suggests alternative openers when needed. The application features a Duolingo-inspired learning experience with Apple interface design aesthetics.

## Glossary

- **Agent**: A sales representative who initiates calls with clients
- **Pickup Line**: A scripted call opener used by agents to begin conversations with clients
- **Client**: The recipient of the sales call
- **Opener**: The initial statement or question used by an agent at the start of a call
- **Call Session**: A single interaction between an agent and a client, from start to finish
- **Success Rate**: The percentage of times a specific pickup line results in the client staying on the call
- **WhisperX**: The speech recognition system used to transcribe audio
- **System**: The Pickup Line Coach application

## Requirements

### Requirement 1

**User Story:** As an agent, I want to start a new call session, so that I can begin practicing my opening lines with real-time feedback.

#### Acceptance Criteria

1. WHEN an agent clicks the start button, THEN the System SHALL initialize a new call session and activate audio listening
2. WHEN a call session is initialized, THEN the System SHALL display a ready state indicator to the agent
3. WHEN audio listening is active, THEN the System SHALL continuously monitor for speech input from both agent and client

### Requirement 2

**User Story:** As an agent, I want the system to recognize which pickup line I used, so that I can receive accurate feedback on my performance.

#### Acceptance Criteria

1. WHEN an agent speaks an opener, THEN the System SHALL transcribe the audio using WhisperX
2. WHEN the System receives a transcription, THEN the System SHALL match it against the library of 15 pickup lines
3. WHEN a match is found, THEN the System SHALL record which pickup line was used for the current call session
4. WHEN no match is found, THEN the System SHALL prompt the agent to use one of the recognized pickup lines

### Requirement 3

**User Story:** As an agent, I want the system to detect how my client responds, so that I can understand if my opener was effective.

#### Acceptance Criteria

1. WHEN the client speaks after the agent's opener, THEN the System SHALL transcribe the client's response using WhisperX
2. WHEN the call continues beyond the initial response, THEN the System SHALL classify the outcome as client stayed
3. WHEN the call ends within 10 seconds of the opener, THEN the System SHALL classify the outcome as client left
4. WHEN the outcome is classified, THEN the System SHALL store the result associated with the pickup line used

### Requirement 4

**User Story:** As an agent, I want to receive immediate feedback on my opener, so that I can learn which approaches work best.

#### Acceptance Criteria

1. WHEN the client stays on the call, THEN the System SHALL display a positive rating message to the agent
2. WHEN the client leaves the call, THEN the System SHALL display a negative rating message to the agent
3. WHEN displaying a negative rating, THEN the System SHALL suggest an alternative pickup line from the library
4. WHEN displaying a positive rating, THEN the System SHALL display a celebration animation
5. WHEN suggesting an alternative pickup line, THEN the System SHALL exclude pickup lines with low success rates

### Requirement 5

**User Story:** As an agent, I want to see which pickup lines perform best, so that I can focus on using the most effective openers.

#### Acceptance Criteria

1. WHEN a call session completes, THEN the System SHALL update the success rate for the pickup line used
2. WHEN calculating success rate, THEN the System SHALL divide successful calls by total calls for that pickup line
3. WHEN displaying pickup lines, THEN the System SHALL show the current success rate for each line
4. WHEN the System has tracked at least 5 uses of a pickup line, THEN the System SHALL display the success rate as a percentage

### Requirement 6

**User Story:** As an agent, I want the system to stop recommending ineffective pickup lines, so that I can avoid wasting time on approaches that don't work.

#### Acceptance Criteria

1. WHEN a pickup line has been used at least 10 times, THEN the System SHALL calculate its performance trend
2. WHEN a pickup line's success rate falls below 30 percent, THEN the System SHALL stop suggesting it as an alternative
3. WHEN a pickup line is excluded from suggestions, THEN the System SHALL still allow manual selection by the agent
4. WHEN all pickup lines fall below the threshold, THEN the System SHALL suggest the pickup line with the highest success rate

### Requirement 7

**User Story:** As an agent, I want to view my performance history, so that I can track my improvement over time.

#### Acceptance Criteria

1. WHEN an agent requests performance data, THEN the System SHALL display total calls made
2. WHEN displaying performance data, THEN the System SHALL show overall success rate across all pickup lines
3. WHEN displaying performance data, THEN the System SHALL list each pickup line with its individual success rate
4. WHEN displaying pickup line statistics, THEN the System SHALL sort them by success rate in descending order

### Requirement 8

**User Story:** As an agent, I want an intuitive and encouraging interface, so that I feel motivated to practice and improve.

#### Acceptance Criteria

1. WHEN the System displays feedback, THEN the System SHALL use Duolingo-inspired visual elements and animations
2. WHEN the System displays interface elements, THEN the System SHALL follow Apple design guidelines for spacing, typography, and color
3. WHEN a positive outcome occurs, THEN the System SHALL display celebratory animations and encouraging messages
4. WHEN a negative outcome occurs, THEN the System SHALL display constructive feedback without discouraging language
