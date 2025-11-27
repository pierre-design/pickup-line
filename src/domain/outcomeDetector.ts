/**
 * Outcome Detector - Analyzes conversation transcripts to detect if client stayed or left
 */

export interface OutcomeDetection {
  suggestedOutcome: 'stayed' | 'left';
  confidence: number; // 0-1 scale
  signals: string[]; // List of detected signals
}

export class OutcomeDetector {
  // Phrases that indicate the client left
  private readonly leftSignals = [
    'not interested',
    'no thank',
    'remove me',
    'take me off',
    'stop calling',
    'don\'t call',
    'not now',
    'busy right now',
    'bad time',
    'have to go',
    'goodbye',
    'bye',
    'hang up',
    'end call',
    'leave me alone',
    'unsubscribe',
  ];

  // Phrases that indicate the client stayed engaged
  private readonly stayedSignals = [
    'tell me more',
    'interested',
    'how much',
    'what are the',
    'benefits',
    'coverage',
    'premium',
    'cost',
    'price',
    'when can',
    'how do i',
    'sign up',
    'sounds good',
    'okay',
    'yes',
    'sure',
    'go ahead',
    'continue',
    'explain',
    'what if',
    'can you',
    'would i',
  ];

  /**
   * Analyze a conversation transcript to detect the outcome
   * @param clientTranscript - The client's speech during the call
   * @param callDuration - Duration of the call in seconds
   * @returns OutcomeDetection with suggested outcome and confidence
   */
  detectOutcome(clientTranscript: string, callDuration: number): OutcomeDetection {
    const normalizedTranscript = clientTranscript.toLowerCase().trim();
    
    // If no client speech or very short call, likely they left
    if (!normalizedTranscript || callDuration < 10) {
      return {
        suggestedOutcome: 'left',
        confidence: 0.8,
        signals: ['Very short call duration', 'No client response'],
      };
    }

    const detectedLeftSignals: string[] = [];
    const detectedStayedSignals: string[] = [];

    // Check for "left" signals
    for (const signal of this.leftSignals) {
      if (normalizedTranscript.includes(signal)) {
        detectedLeftSignals.push(signal);
      }
    }

    // Check for "stayed" signals
    for (const signal of this.stayedSignals) {
      if (normalizedTranscript.includes(signal)) {
        detectedStayedSignals.push(signal);
      }
    }

    // Calculate scores
    const leftScore = detectedLeftSignals.length;
    const stayedScore = detectedStayedSignals.length;

    // Factor in call duration (longer calls usually mean they stayed)
    const durationBonus = callDuration > 60 ? 2 : callDuration > 30 ? 1 : 0;
    const adjustedStayedScore = stayedScore + durationBonus;

    // Determine outcome
    if (leftScore > adjustedStayedScore) {
      const confidence = Math.min(0.95, 0.6 + (leftScore * 0.1));
      return {
        suggestedOutcome: 'left',
        confidence,
        signals: detectedLeftSignals,
      };
    } else if (adjustedStayedScore > leftScore) {
      const confidence = Math.min(0.95, 0.6 + (adjustedStayedScore * 0.1));
      return {
        suggestedOutcome: 'stayed',
        confidence,
        signals: [...detectedStayedSignals, ...(durationBonus > 0 ? ['Long call duration'] : [])],
      };
    } else {
      // Tie or no clear signals - use call duration as tiebreaker
      if (callDuration > 45) {
        return {
          suggestedOutcome: 'stayed',
          confidence: 0.5,
          signals: ['Call duration suggests engagement'],
        };
      } else {
        return {
          suggestedOutcome: 'left',
          confidence: 0.5,
          signals: ['Short call duration'],
        };
      }
    }
  }

  /**
   * Get a simple outcome suggestion without detailed analysis
   * Useful for quick decisions
   */
  quickDetect(clientTranscript: string, callDuration: number): 'stayed' | 'left' {
    return this.detectOutcome(clientTranscript, callDuration).suggestedOutcome;
  }
}
