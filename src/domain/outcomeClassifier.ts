/**
 * OutcomeClassifier
 * 
 * Determines whether a client stayed on the call or left based on
 * call duration and whether the client spoke.
 * 
 * Classification Logic:
 * - If call duration < 10 seconds: classify as 'left'
 * - If call duration >= 10 seconds AND client spoke: classify as 'stayed'
 */

export type Outcome = 'stayed' | 'left';

export class OutcomeClassifier {
  /**
   * Classifies the outcome of a call based on duration and client interaction
   * 
   * @param callDuration - Duration of the call in seconds after the opener
   * @param hasClientResponse - Whether the client spoke during the call
   * @returns 'stayed' if client engaged, 'left' if client disconnected quickly
   */
  classifyOutcome(callDuration: number, hasClientResponse: boolean): Outcome {
    // If call ended within 10 seconds, client left
    if (callDuration < 10) {
      return 'left';
    }
    
    // If call lasted 10+ seconds and client spoke, they stayed
    if (callDuration >= 10 && hasClientResponse) {
      return 'stayed';
    }
    
    // Default to 'left' if client didn't speak even after 10 seconds
    return 'left';
  }
}
