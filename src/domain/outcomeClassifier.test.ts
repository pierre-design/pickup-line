import { describe, it, expect } from 'vitest';
import { OutcomeClassifier } from './outcomeClassifier';

describe('OutcomeClassifier', () => {
  const classifier = new OutcomeClassifier();

  describe('classifyOutcome', () => {
    it('should classify as "left" when call duration is less than 10 seconds', () => {
      // Test various durations under 10 seconds
      expect(classifier.classifyOutcome(0, false)).toBe('left');
      expect(classifier.classifyOutcome(5, false)).toBe('left');
      expect(classifier.classifyOutcome(9, false)).toBe('left');
      expect(classifier.classifyOutcome(9.9, false)).toBe('left');
      
      // Even if client spoke, if duration < 10s, they left
      expect(classifier.classifyOutcome(5, true)).toBe('left');
      expect(classifier.classifyOutcome(9, true)).toBe('left');
    });

    it('should classify as "stayed" when call duration is 10+ seconds and client spoke', () => {
      expect(classifier.classifyOutcome(10, true)).toBe('stayed');
      expect(classifier.classifyOutcome(15, true)).toBe('stayed');
      expect(classifier.classifyOutcome(30, true)).toBe('stayed');
      expect(classifier.classifyOutcome(100, true)).toBe('stayed');
    });

    it('should classify as "left" when call duration is 10+ seconds but client did not speak', () => {
      expect(classifier.classifyOutcome(10, false)).toBe('left');
      expect(classifier.classifyOutcome(15, false)).toBe('left');
      expect(classifier.classifyOutcome(30, false)).toBe('left');
    });

    it('should handle boundary case at exactly 10 seconds', () => {
      // At exactly 10 seconds with client response = stayed
      expect(classifier.classifyOutcome(10, true)).toBe('stayed');
      
      // At exactly 10 seconds without client response = left
      expect(classifier.classifyOutcome(10, false)).toBe('left');
    });
  });
});
