
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

export class GeminiLiveService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private activeSession: any = null;
  private mediaStream: MediaStream | null = null;

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async connect(onInterrupted?: () => void, onMessage?: (text: string) => void) {
    // 1. Check for MediaDevices support (requires secure context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Voice mode requires a secure context (HTTPS) and browser support for MediaDevices.");
    }

    // 2. Initialize new AI instance per connection
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. Setup Audio Contexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure contexts are running (required by some browsers even within user gesture)
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    // 4. Request Media Stream
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
    } catch (err: any) {
      this.disconnect();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error("Microphone access denied. Please allow microphone permissions in your browser settings to use Voice Mode.");
      }
      throw err;
    }

    const sessionPromise = (ai as any).live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          if (!this.inputAudioContext || !this.mediaStream) return;
          const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
          const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(this.inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            onMessage?.(message.serverContent.outputTranscription.text);
          }

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64EncodedAudioString && this.outputAudioContext) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await this.decodeAudioData(
              this.decode(base64EncodedAudioString),
              this.outputAudioContext,
              24000,
              1,
            );
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });
            source.start(this.nextStartTime);
            this.nextStartTime = this.nextStartTime + audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.interrupted) {
            this.stopAudioPlayback();
            onInterrupted?.();
          }
        },
        onclose: () => {
          this.disconnect();
        },
        onerror: (e: any) => {
          console.error('Live session error:', e);
          this.disconnect();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: SYSTEM_INSTRUCTION + "\nYou are in voice mode. Provide concise, expert Luau advice. Focus on modern standards like 'task' library.",
      },
    });

    this.activeSession = await sessionPromise;
    return this.activeSession;
  }

  private stopAudioPlayback() {
    for (const source of this.sources.values()) {
      try { source.stop(); } catch (e) {}
      this.sources.delete(source);
    }
    this.nextStartTime = 0;
  }

  disconnect() {
    this.stopAudioPlayback();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    if (this.activeSession) {
      try { this.activeSession.close(); } catch (e) {}
      this.activeSession = null;
    }
  }
}

export const geminiLiveService = new GeminiLiveService();
