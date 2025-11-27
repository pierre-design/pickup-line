import type { AudioTranscriptionService } from './interfaces';
import { WebSpeechTranscriptionService } from './webSpeechTranscriptionService';
import { AssemblyAITranscriptionService } from './assemblyAITranscriptionService';
import { MockAudioTranscriptionService } from './mockAudioTranscriptionService';

/**
 * Factory for creating the appropriate transcription service
 * Priority:
 * 1. AssemblyAI (if API key is configured)
 * 2. Web Speech API (if supported by browser)
 * 3. Mock service (fallback for testing/development)
 */
export class TranscriptionServiceFactory {
  /**
   * Create the best available transcription service
   */
  static create(): AudioTranscriptionService {
    // Check for AssemblyAI API key (now uses backend proxy)
    if (AssemblyAITranscriptionService.isConfigured()) {
      console.log('[Factory] Using AssemblyAI transcription service (via proxy)');
      return new AssemblyAITranscriptionService();
    }

    // Check for Web Speech API support (works in browser)
    if (WebSpeechTranscriptionService.isSupported()) {
      console.log('[Factory] Using Web Speech API transcription service');
      return new WebSpeechTranscriptionService();
    }

    // Fallback to mock service
    console.log('[Factory] Using Mock transcription service (no real transcription available)');
    return new MockAudioTranscriptionService();
  }

  /**
   * Create a specific transcription service (useful for testing)
   */
  static createSpecific(type: 'web-speech' | 'assemblyai' | 'mock'): AudioTranscriptionService {
    switch (type) {
      case 'web-speech':
        if (!WebSpeechTranscriptionService.isSupported()) {
          throw new Error('Web Speech API not supported in this browser');
        }
        return new WebSpeechTranscriptionService();
      
      case 'assemblyai':
        if (!AssemblyAITranscriptionService.isConfigured()) {
          throw new Error('AssemblyAI API key not configured');
        }
        return new AssemblyAITranscriptionService();
      
      case 'mock':
        return new MockAudioTranscriptionService();
      
      default:
        throw new Error(`Unknown transcription service type: ${type}`);
    }
  }

  /**
   * Get information about available services
   */
  static getAvailableServices(): {
    webSpeech: boolean;
    assemblyAI: boolean;
    current: string;
  } {
    const webSpeech = WebSpeechTranscriptionService.isSupported();
    const assemblyAI = AssemblyAITranscriptionService.isConfigured();
    
    let current = 'mock';
    if (assemblyAI) current = 'assemblyai';
    else if (webSpeech) current = 'web-speech';

    return {
      webSpeech,
      assemblyAI,
      current,
    };
  }
}
