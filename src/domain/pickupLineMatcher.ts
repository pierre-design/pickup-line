// Pickup Line Matcher - Matches transcribed text against the library using fuzzy matching
import type { PickupLine } from './types';
import { PICKUP_LINES } from './pickupLines';

/**
 * Result of a pickup line match attempt with confidence score
 */
export interface MatchResult {
  pickupLine: PickupLine;
  confidence: number; // 0-1 scale
  similarity: number; // Levenshtein similarity percentage
}

/**
 * Matches transcribed text against the pickup line library
 * Uses Levenshtein distance for fuzzy string matching
 */
export class PickupLineMatcher {
  private readonly similarityThreshold: number;
  private readonly ambiguityThreshold: number; // If two matches are within this % of each other, it's ambiguous

  /**
   * Creates a new pickup line matcher
   * @param similarityThreshold - Minimum similarity percentage (0-100) to consider a match (default: 80)
   * @param ambiguityThreshold - Maximum confidence difference (0-100) to consider matches ambiguous (default: 5)
   */
  constructor(similarityThreshold: number = 80, ambiguityThreshold: number = 5) {
    this.similarityThreshold = similarityThreshold;
    this.ambiguityThreshold = ambiguityThreshold;
  }

  /**
   * Match transcribed text against the pickup line library
   * Returns the best match if confidence is above threshold, null otherwise
   * @param transcription - The transcribed text to match
   * @returns PickupLine if a confident match is found, null otherwise
   */
  match(transcription: string): PickupLine | null {
    const result = this.matchWithConfidence(transcription);
    return result ? result.pickupLine : null;
  }

  /**
   * Match transcribed text and return detailed match information
   * @param transcription - The transcribed text to match
   * @returns MatchResult with confidence score, or null if no match above threshold
   */
  matchWithConfidence(transcription: string): MatchResult | null {
    if (!transcription || transcription.trim() === '') {
      return null;
    }

    const normalizedTranscription = this.normalizeText(transcription);
    const matches: MatchResult[] = [];

    // Calculate similarity for each pickup line
    for (const pickupLine of PICKUP_LINES) {
      const normalizedPickupLine = this.normalizeText(pickupLine.text);
      const similarity = this.calculateSimilarity(normalizedTranscription, normalizedPickupLine);

      if (similarity >= this.similarityThreshold) {
        matches.push({
          pickupLine,
          confidence: similarity,
          similarity,
        });
      }
    }

    // No matches above threshold
    if (matches.length === 0) {
      return null;
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    // Return the best match
    return matches[0];
  }

  /**
   * Match transcribed text and detect ambiguity
   * Returns all matches above threshold and indicates if there's ambiguity
   * @param transcription - The transcribed text to match
   * @returns Object with matches array and ambiguous flag
   */
  matchWithAmbiguityDetection(transcription: string): {
    matches: MatchResult[];
    isAmbiguous: boolean;
    bestMatch: MatchResult | null;
  } {
    if (!transcription || transcription.trim() === '') {
      return { matches: [], isAmbiguous: false, bestMatch: null };
    }

    const normalizedTranscription = this.normalizeText(transcription);
    const matches: MatchResult[] = [];

    // Calculate similarity for each pickup line
    for (const pickupLine of PICKUP_LINES) {
      const normalizedPickupLine = this.normalizeText(pickupLine.text);
      const similarity = this.calculateSimilarity(normalizedTranscription, normalizedPickupLine);

      if (similarity >= this.similarityThreshold) {
        matches.push({
          pickupLine,
          confidence: similarity,
          similarity,
        });
      }
    }

    // No matches
    if (matches.length === 0) {
      return { matches: [], isAmbiguous: false, bestMatch: null };
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    // Check for ambiguity: if top two matches are within threshold
    const isAmbiguous =
      matches.length >= 2 &&
      matches[0].confidence - matches[1].confidence <= this.ambiguityThreshold;

    return {
      matches,
      isAmbiguous,
      bestMatch: matches[0],
    };
  }

  /**
   * Get all pickup lines in the library
   */
  getAllPickupLines(): PickupLine[] {
    return [...PICKUP_LINES];
  }

  /**
   * Normalize text for comparison
   * - Convert to lowercase
   * - Remove extra whitespace
   * - Remove punctuation
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns a percentage (0-100) where 100 is identical
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) {
      return 100; // Both strings are empty
    }

    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of single-character edits required to change one string into the other
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first column and row
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[len1][len2];
  }
}
