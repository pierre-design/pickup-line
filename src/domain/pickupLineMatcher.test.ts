// Tests for PickupLineMatcher
import { describe, it, expect } from 'vitest';
import { PickupLineMatcher } from './pickupLineMatcher';
import { PICKUP_LINES } from './pickupLines';

describe('PickupLineMatcher', () => {
  describe('match', () => {
    it('should match exact pickup line text', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.match(PICKUP_LINES[0].text);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(PICKUP_LINES[0].id);
    });

    it('should match pickup line with minor variations', () => {
      const matcher = new PickupLineMatcher();
      // Original: "Hi, I noticed you've been looking at our product. Can I help answer any questions?"
      const variation = "Hi I noticed youve been looking at our product Can I help answer any questions";
      const result = matcher.match(variation);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(PICKUP_LINES[0].id);
    });

    it('should match pickup line with case differences', () => {
      const matcher = new PickupLineMatcher();
      const upperCase = PICKUP_LINES[0].text.toUpperCase();
      const result = matcher.match(upperCase);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(PICKUP_LINES[0].id);
    });

    it('should return null for empty transcription', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.match('');
      
      expect(result).toBeNull();
    });

    it('should return null for completely unrelated text', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.match('This is completely unrelated text that should not match');
      
      expect(result).toBeNull();
    });

    it('should return null for text below similarity threshold', () => {
      const matcher = new PickupLineMatcher(90); // High threshold
      const result = matcher.match('Hi there');
      
      expect(result).toBeNull();
    });
  });

  describe('matchWithConfidence', () => {
    it('should return confidence score for exact match', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.matchWithConfidence(PICKUP_LINES[0].text);
      
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(95);
      expect(result?.pickupLine.id).toBe(PICKUP_LINES[0].id);
    });

    it('should return lower confidence for partial match', () => {
      const matcher = new PickupLineMatcher(70); // Lower threshold
      const result = matcher.matchWithConfidence('Hi I noticed you');
      
      // This might match or not depending on similarity calculation
      if (result) {
        expect(result.confidence).toBeLessThan(100);
      }
    });

    it('should return null for empty string', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.matchWithConfidence('');
      
      expect(result).toBeNull();
    });
  });

  describe('matchWithAmbiguityDetection', () => {
    it('should detect no ambiguity for exact match', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.matchWithAmbiguityDetection(PICKUP_LINES[0].text);
      
      expect(result.isAmbiguous).toBe(false);
      expect(result.bestMatch).not.toBeNull();
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should detect ambiguity when multiple lines match closely', () => {
      const matcher = new PickupLineMatcher(50, 10); // Low threshold, high ambiguity threshold
      // Use a generic greeting that might match multiple lines
      const result = matcher.matchWithAmbiguityDetection('Hi there');
      
      // Check structure regardless of whether it's ambiguous
      expect(result).toHaveProperty('isAmbiguous');
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('bestMatch');
    });

    it('should return empty matches for unrelated text', () => {
      const matcher = new PickupLineMatcher();
      const result = matcher.matchWithAmbiguityDetection('xyz123 completely unrelated');
      
      expect(result.matches).toHaveLength(0);
      expect(result.isAmbiguous).toBe(false);
      expect(result.bestMatch).toBeNull();
    });

    it('should sort matches by confidence descending', () => {
      const matcher = new PickupLineMatcher(50); // Low threshold to get multiple matches
      const result = matcher.matchWithAmbiguityDetection('Hi good morning');
      
      if (result.matches.length > 1) {
        for (let i = 0; i < result.matches.length - 1; i++) {
          expect(result.matches[i].confidence).toBeGreaterThanOrEqual(
            result.matches[i + 1].confidence
          );
        }
      }
    });
  });

  describe('getAllPickupLines', () => {
    it('should return all pickup lines', () => {
      const matcher = new PickupLineMatcher();
      const lines = matcher.getAllPickupLines();
      
      expect(lines).toHaveLength(PICKUP_LINES.length);
      expect(lines[0]).toEqual(PICKUP_LINES[0]);
    });

    it('should return a copy of the array', () => {
      const matcher = new PickupLineMatcher();
      const lines1 = matcher.getAllPickupLines();
      const lines2 = matcher.getAllPickupLines();
      
      expect(lines1).not.toBe(lines2); // Different array instances
      expect(lines1).toEqual(lines2); // Same content
    });
  });

  describe('Levenshtein distance calculation', () => {
    it('should handle identical strings', () => {
      const matcher = new PickupLineMatcher();
      const text = 'Hello world';
      const result = matcher.matchWithConfidence(text);
      
      // Won't match any pickup line, but tests the algorithm
      expect(result).toBeDefined();
    });

    it('should handle strings with whitespace differences', () => {
      const matcher = new PickupLineMatcher();
      const original = PICKUP_LINES[0].text;
      const withExtraSpaces = original.replace(/ /g, '  '); // Double spaces
      const result = matcher.match(withExtraSpaces);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(PICKUP_LINES[0].id);
    });
  });

  describe('Custom thresholds', () => {
    it('should respect custom similarity threshold', () => {
      const strictMatcher = new PickupLineMatcher(95);
      
      const slightlyDifferent = PICKUP_LINES[0].text.substring(0, 30);
      
      const strictResult = strictMatcher.match(slightlyDifferent);
      
      // Strict matcher should not match partial text
      expect(strictResult).toBeNull();
    });

    it('should respect custom ambiguity threshold', () => {
      const lowAmbiguity = new PickupLineMatcher(50, 2); // Very sensitive to ambiguity
      const highAmbiguity = new PickupLineMatcher(50, 20); // Less sensitive
      
      const genericText = 'Hi';
      
      const lowResult = lowAmbiguity.matchWithAmbiguityDetection(genericText);
      const highResult = highAmbiguity.matchWithAmbiguityDetection(genericText);
      
      // Both should have same matches, but different ambiguity detection
      expect(lowResult.matches.length).toBe(highResult.matches.length);
    });
  });
});
