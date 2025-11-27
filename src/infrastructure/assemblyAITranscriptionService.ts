import type { AudioTranscriptionService } from './interfaces';

/**
 * AssemblyAI implementation for real-time speech recognition
 * This is a placeholder implementation - ready to be activated when needed
 * 
 * To use:
 * 1. Sign up at https://www.assemblyai.com/
 * 2. Get your API key
 * 3. Add VITE_ASSEMBLYAI_API_KEY to your .env file
 * 4. Update the service factory to use this implementation
 */
export class AssemblyAITranscriptionService implements AudioTranscriptionService {
  private apiKey: string;
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isListening = false;
  private transcriptionCallback: ((text: string, speaker: 'agent' | 'client') => void) | null = null;
  private currentSpeaker: 'agent' | 'client' = 'agent';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('AssemblyAI API key not provided. Set VITE_ASSEMBLYAI_API_KEY environment variable.');
    }
  }

  async startListening(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    if (this.isListening) {
      console.warn('[AssemblyAI] Already listening');
      return;
    }

    try {
      // Get temporary token from AssemblyAI
      const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`AssemblyAI API error: ${response.status}`);
      }

      const data = await response.json();
      const token = data.token;

      // Connect to WebSocket
      this.socket = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
      );

      this.setupWebSocket();

      // Wait for socket to open
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        this.socket.onopen = () => {
          console.log('[AssemblyAI] WebSocket connected');
          resolve();
        };

        this.socket.onerror = (error) => {
          console.error('[AssemblyAI] WebSocket error:', error);
          reject(new Error('Failed to connect to AssemblyAI'));
        };
      });

      // Start capturing audio
      await this.startAudioCapture();
      
      this.isListening = true;
      console.log('[AssemblyAI] Started listening');
    } catch (error) {
      console.error('[AssemblyAI] Failed to start listening:', error);
      throw error;
    }
  }

  private setupWebSocket(): void {
    if (!this.socket) return;

    this.socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      
      if (data.message_type === 'FinalTranscript') {
        const transcript = data.text.trim();
        
        if (transcript && this.transcriptionCallback) {
          console.log(`[AssemblyAI] Transcribed (${this.currentSpeaker}):`, transcript);
          this.transcriptionCallback(transcript, this.currentSpeaker);
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('[AssemblyAI] WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('[AssemblyAI] WebSocket closed');
      this.isListening = false;
    };
  }

  private async startAudioCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
          // Convert to base64 and send
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            this.socket?.send(JSON.stringify({
              audio_data: base64Audio,
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      // Send audio chunks every 100ms
      this.mediaRecorder.start(100);
      console.log('[AssemblyAI] Audio capture started');
    } catch (error) {
      console.error('[AssemblyAI] Failed to start audio capture:', error);
      throw new Error('Failed to access microphone');
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.warn('[AssemblyAI] Not currently listening');
      return;
    }

    try {
      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
      }

      // Close WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ terminate_session: true }));
        this.socket.close();
        this.socket = null;
      }

      this.isListening = false;
      console.log('[AssemblyAI] Stopped listening');
    } catch (error) {
      console.error('[AssemblyAI] Failed to stop listening:', error);
    }
  }

  onTranscription(callback: (text: string, speaker: 'agent' | 'client') => void): void {
    this.transcriptionCallback = callback;
  }

  setSpeaker(speaker: 'agent' | 'client'): void {
    this.currentSpeaker = speaker;
    console.log(`[AssemblyAI] Speaker set to: ${speaker}`);
  }

  static isConfigured(): boolean {
    return !!import.meta.env.VITE_ASSEMBLYAI_API_KEY;
  }
}
