import type { AudioTranscriptionService } from './interfaces';

/**
 * Web Speech API implementation for real-time speech recognition
 * Uses the browser's built-in SpeechRecognition API (Chrome, Edge, Safari)
 */
export class WebSpeechTranscriptionService implements AudioTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private transcriptionCallback: ((text: string, speaker: 'agent' | 'client') => void) | null = null;
  private currentSpeaker: 'agent' | 'client' = 'agent';
  private restartTimeout: number | null = null;

  constructor() {
    // Check if Web Speech API is available
    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.setupRecognition();
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition
    this.recognition.continuous = true; // Keep listening
    this.recognition.interimResults = false; // Only final results
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Handle results
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResultIndex = event.results.length - 1;
      const result = event.results[lastResultIndex];
      
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        
        if (transcript && this.transcriptionCallback) {
          console.log(`[WebSpeech] Transcribed (${this.currentSpeaker}):`, transcript);
          this.transcriptionCallback(transcript, this.currentSpeaker);
        }
      }
    };

    // Handle errors
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[WebSpeech] Recognition error:', event.error);
      
      // Don't restart on certain errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      // Auto-restart on other errors if still supposed to be listening
      if (this.isListening && event.error !== 'not-allowed') {
        this.scheduleRestart();
      }
    };

    // Handle end event (recognition stopped)
    this.recognition.onend = () => {
      console.log('[WebSpeech] Recognition ended');
      
      // Auto-restart if we're still supposed to be listening
      if (this.isListening) {
        this.scheduleRestart();
      }
    };

    // Handle start event
    this.recognition.onstart = () => {
      console.log('[WebSpeech] Recognition started');
    };
  }

  private scheduleRestart(): void {
    // Clear any existing restart timeout
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    // Restart after a short delay to avoid rapid restarts
    this.restartTimeout = setTimeout(() => {
      if (this.isListening && this.recognition) {
        try {
          console.log('[WebSpeech] Auto-restarting recognition');
          this.recognition.start();
        } catch (error) {
          console.error('[WebSpeech] Failed to restart:', error);
        }
      }
    }, 100);
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Web Speech API not supported in this browser');
    }

    if (this.isListening) {
      console.warn('[WebSpeech] Already listening');
      return;
    }

    try {
      this.isListening = true;
      this.recognition.start();
      console.log('[WebSpeech] Started listening');
    } catch (error) {
      this.isListening = false;
      console.error('[WebSpeech] Failed to start listening:', error);
      throw new Error('Failed to start speech recognition');
    }
  }

  async stopListening(): Promise<void> {
    if (!this.recognition) {
      return;
    }

    if (!this.isListening) {
      console.warn('[WebSpeech] Not currently listening');
      return;
    }

    try {
      this.isListening = false;
      
      // Clear any pending restart
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }

      this.recognition.stop();
      console.log('[WebSpeech] Stopped listening');
    } catch (error) {
      console.error('[WebSpeech] Failed to stop listening:', error);
    }
  }

  onTranscription(callback: (text: string, speaker: 'agent' | 'client') => void): void {
    this.transcriptionCallback = callback;
  }

  /**
   * Set the current speaker for transcription attribution
   * In a real implementation, this could use voice recognition or timing heuristics
   */
  setSpeaker(speaker: 'agent' | 'client'): void {
    this.currentSpeaker = speaker;
    console.log(`[WebSpeech] Speaker set to: ${speaker}`);
  }

  /**
   * Check if Web Speech API is supported in the current browser
   */
  static isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }
}
