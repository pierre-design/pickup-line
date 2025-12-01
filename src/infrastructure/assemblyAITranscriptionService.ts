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
      // Get temporary token from our proxy endpoint (avoids CORS)
      const response = await fetch('/api/assemblyai-token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 errors more gracefully (expected without API key)
        if (response.status === 401) {
          throw new Error('AssemblyAI API key not configured or invalid');
        }
        
        throw new Error(`Failed to get AssemblyAI token: ${errorData.error || response.status}`);
      }

      const data = await response.json();
      const token = data.token;

      // Connect to WebSocket using temporary token
      // Docs: https://www.assemblyai.com/docs/speech-to-text/streaming
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
      
      console.log('[AssemblyAI] Message received:', data);
      
      if (data.message_type === 'FinalTranscript') {
        const transcript = data.text.trim();
        
        if (transcript && this.transcriptionCallback) {
          console.log(`[AssemblyAI] Transcribed (${this.currentSpeaker}):`, transcript);
          this.transcriptionCallback(transcript, this.currentSpeaker);
        }
      } else if (data.error) {
        console.error('[AssemblyAI] Error from server:', data.error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('[AssemblyAI] WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log('[AssemblyAI] WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      this.isListening = false;
      
      // Clean up audio resources when WebSocket closes unexpectedly
      this.stopListening().catch(console.error);
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

      // Use AudioContext to get raw PCM audio data
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Convert to base64
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          
          this.socket?.send(JSON.stringify({
            audio_data: base64Audio,
          }));
        }
      };

      // Store references for cleanup
      (this as any).audioContext = audioContext;
      (this as any).processor = processor;
      (this as any).source = source;
      (this as any).stream = stream;

      console.log('[AssemblyAI] Audio capture started');
    } catch (error) {
      console.error('[AssemblyAI] Failed to start audio capture:', error);
      throw new Error('Failed to access microphone');
    }
  }

  async stopListening(): Promise<void> {
    try {
      // Always try to clean up audio resources, even if isListening is false
      // (WebSocket might have closed but audio is still running)
      const processor = (this as any).processor;
      const source = (this as any).source;
      const audioContext = (this as any).audioContext;
      const stream = (this as any).stream;

      let cleanedUp = false;

      if (processor) {
        processor.disconnect();
        (this as any).processor = null;
        cleanedUp = true;
      }
      
      if (source) {
        source.disconnect();
        (this as any).source = null;
        cleanedUp = true;
      }
      
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
        (this as any).audioContext = null;
        cleanedUp = true;
      }
      
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        (this as any).stream = null;
        cleanedUp = true;
      }

      // Close WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ terminate_session: true }));
        this.socket.close();
        this.socket = null;
        cleanedUp = true;
      }

      this.isListening = false;
      
      if (cleanedUp) {
        console.log('[AssemblyAI] Stopped listening and cleaned up resources');
      } else if (!this.isListening) {
        console.log('[AssemblyAI] Already stopped');
      }
    } catch (error) {
      console.error('[AssemblyAI] Failed to stop listening:', error);
      this.isListening = false;
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
