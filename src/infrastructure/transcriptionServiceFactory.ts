import type { AudioTranscriptionService } from './interfaces';
import { WebSpeechTranscriptionService } from './webSpeechTranscriptionService';
import { MockAudioTranscriptionService } from './mockAudioTranscriptionService';

/**
 * Factory for creating the appropriate transcription service
 * Uses Web Speech API (browser native) with mock service as fallback
 */
export class TranscriptionServiceFactory {
  /**
   * Create the best available transcription service
   */
  static create(): AudioTranscriptionService {
    // Check for Web Speech API support (works in modern browsers)
    if (WebSpeechTranscriptionService.isSupported()) {
      console.log('[Factory] Using Web Speech API transcription service');
      return new WebSpeechTranscriptionService();
    }

    // Fallback to mock service for unsupported browsers
    console.log('[Factory] Using Mock transcription service (Web Speech API not supported)');
    return new MockAudioTranscriptionService();
  }

  /**
   * Create a specific transcription service (useful for testing)
   */
  static createSpecific(type: 'web-speech' | 'mock'): AudioTranscriptionService {
    switch (type) {
      case 'web-speech':
        if (!WebSpeechTranscriptionService.isSupported()) {
          throw new Error('Web Speech API not supported in this browser');
        }
        return new WebSpeechTranscriptionService();
      
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
    current: string;
  } {
    const webSpeech = WebSpeechTranscriptionService.isSupported();
    
    const current = webSpeech ? 'web-speech' : 'mock';

    return {
      webSpeech,
      current,
    };
  }
}
