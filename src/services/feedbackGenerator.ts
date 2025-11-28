// Feedback Generator - Generates feedback messages for agents
import type { Feedback, PickupLine } from '../domain/types';
import type { FeedbackGenerator, PerformanceAnalyzer } from './interfaces';
import { PICKUP_LINES } from '../domain/pickupLines';

/**
 * Generates feedback messages for agents based on call outcomes
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export class DefaultFeedbackGenerator implements FeedbackGenerator {
  private readonly performanceAnalyzer: PerformanceAnalyzer;

  constructor(performanceAnalyzer: PerformanceAnalyzer) {
    this.performanceAnalyzer = performanceAnalyzer;
  }

  /**
   * Generate feedback based on call outcome
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  generateFeedback(outcome: 'stayed' | 'left', currentPickupLine: PickupLine): Feedback {
    if (outcome === 'stayed') {
      return this.generatePositiveFeedback(currentPickupLine);
    } else {
      return this.generateNegativeFeedback(currentPickupLine);
    }
  }

  /**
   * Generate positive feedback for successful calls
   * Requirements: 4.1, 4.4
   */
  private generatePositiveFeedback(_pickupLine: PickupLine): Feedback {
    const messages = [
      'Great job! The client stayed on the call.',
      'Excellent work! Your opener kept them engaged.',
      'Nice! That pickup line worked well.',
      'Well done! The client is interested.',
      'Fantastic! Your approach was effective.',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return {
      type: 'positive',
      message: randomMessage,
      showCelebration: false, // Celebration removed per user request
    };
  }

  /**
   * Generate negative feedback with suggestions
   * Requirements: 4.2, 4.3
   */
  private generateNegativeFeedback(currentPickupLine: PickupLine): Feedback {
    const messages = [
      'The client left quickly. Let\'s try a different approach.',
      'That didn\'t quite land. Here\'s another option to consider.',
      'No worries! Try this alternative next time.',
      'Let\'s refine your approach with this suggestion.',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // Get recommended pickup lines (excluding low-performing ones)
    const recommendedLines = this.performanceAnalyzer.getRecommendedPickupLines();
    
    // Filter out the current pickup line from recommendations
    const alternatives = recommendedLines.filter(pl => pl.id !== currentPickupLine.id);
    
    // Pick a random alternative, or use the first recommended if no alternatives
    const suggestedPickupLine = alternatives.length > 0
      ? alternatives[Math.floor(Math.random() * alternatives.length)]
      : recommendedLines[0] || PICKUP_LINES[0];

    return {
      type: 'negative',
      message: randomMessage,
      suggestedPickupLine,
      showCelebration: false,
    };
  }
}
