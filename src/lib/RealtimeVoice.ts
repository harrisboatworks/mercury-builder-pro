// Audio recorder for capturing microphone input at 24kHz PCM
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Encode Float32Array to base64 PCM16
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Audio queue for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer.slice(0) as ArrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

// Check microphone permission state (not all browsers support this)
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
    // Fallback: assume we need to prompt
    return 'prompt';
  } catch {
    // Some browsers don't support querying microphone permission
    return 'prompt';
  }
}

// Request microphone permission immediately (iOS Safari requirement)
// Must be called directly from user gesture before any async operations
export async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    console.log('Microphone permission granted');
    return stream;
  } catch (error: any) {
    console.error('Microphone permission error:', error);
    
    // Provide user-friendly error messages
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Microphone access denied. Please allow microphone access in your browser settings and try again.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No microphone found. Please connect a microphone and try again.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Microphone is in use by another application. Please close other apps using your microphone.');
    } else {
      throw new Error(`Could not access microphone: ${error.message || 'Unknown error'}`);
    }
  }
}

// Shared AudioContext for output audio - unlocked on first user gesture
let sharedOutputAudioContext: AudioContext | null = null;
let audioUnlocked = false;

/**
 * Unlock audio output on Safari/iOS. MUST be called directly from a user gesture (click/tap).
 * This creates or resumes the shared AudioContext and plays a tiny silent buffer
 * to satisfy autoplay policies.
 */
export async function unlockAudioOutput(): Promise<AudioContext> {
  console.log('🔓 Attempting to unlock audio output...');
  
  if (!sharedOutputAudioContext) {
    sharedOutputAudioContext = new AudioContext({ sampleRate: 24000 });
    console.log('🔓 Created shared AudioContext, state:', sharedOutputAudioContext.state);
  }
  
  // Resume if suspended (Safari requires this from user gesture)
  if (sharedOutputAudioContext.state === 'suspended') {
    console.log('🔓 Resuming suspended AudioContext...');
    await sharedOutputAudioContext.resume();
    console.log('🔓 AudioContext resumed, state:', sharedOutputAudioContext.state);
  }
  
  // Play an audible 0.2s test beep to confirm speakers work
  if (!audioUnlocked) {
    try {
      const oscillator = sharedOutputAudioContext.createOscillator();
      const gainNode = sharedOutputAudioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note - clearly audible
      gainNode.gain.value = 0.3; // Audible but not too loud
      oscillator.connect(gainNode);
      gainNode.connect(sharedOutputAudioContext.destination);
      oscillator.start();
      oscillator.stop(sharedOutputAudioContext.currentTime + 0.2); // 0.2 second beep
      audioUnlocked = true;
      console.log('🔓 Audio output unlocked with test beep');
    } catch (e) {
      console.warn('🔓 Test beep failed:', e);
    }
  }
  
  return sharedOutputAudioContext;
}

// Diagnostic state exposed for debugging
export interface VoiceDiagnostics {
  micPermission: boolean;
  tokenReceived: boolean;
  sessionCreatedReceived: boolean;
  sdpExchanged: boolean;
  webrtcState: string;
  dataChannelOpen: boolean;
  remoteTrackReceived: boolean;
  audioPlaying: boolean;
  inboundAudioBytes: number;
  lastError: string | null;
}

// Main realtime voice chat class using WebRTC
export class RealtimeVoiceChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueue | null = null;
  private mediaStream: MediaStream | null = null;
  private webAudioSource: MediaStreamAudioSourceNode | null = null;

  // Diagnostics / UX
  private hasReceivedRemoteTrack = false;
  private hasSentGreeting = false;
  private sessionCreatedReceived = false;
  private audioIsPlaying = false;
  private inboundAudioBytes = 0;
  private lastPlayError: string | null = null;
  private watchdogTimeout: ReturnType<typeof setTimeout> | null = null;
  private tokenReceived = false;

  constructor(
    private onTranscript: (text: string, isFinal: boolean) => void,
    private onSpeakingChange: (isSpeaking: boolean) => void,
    private onError: (error: Error) => void,
    private onConnectionChange: (connected: boolean) => void,
    private onDiagnosticsChange?: (diagnostics: VoiceDiagnostics) => void,
    private onAudioIssue?: () => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.audioEl.muted = false;
    this.audioEl.volume = 1;
    // iOS Safari requires playsinline attribute
    this.audioEl.setAttribute('playsinline', 'true');
    // Add to DOM - some browsers need this for audio to work
    this.audioEl.style.display = 'none';
    document.body.appendChild(this.audioEl);
  }

  getDiagnostics(): VoiceDiagnostics {
    return {
      micPermission: !!this.mediaStream,
      tokenReceived: this.tokenReceived,
      sessionCreatedReceived: this.sessionCreatedReceived,
      sdpExchanged: !!this.pc?.remoteDescription,
      webrtcState: this.pc?.connectionState || 'none',
      dataChannelOpen: this.dc?.readyState === 'open',
      remoteTrackReceived: this.hasReceivedRemoteTrack,
      audioPlaying: this.audioIsPlaying,
      inboundAudioBytes: this.inboundAudioBytes,
      lastError: this.lastPlayError,
    };
  }

  private updateDiagnostics() {
    this.onDiagnosticsChange?.(this.getDiagnostics());
  }

  async connect(motorContext?: any, currentPage?: string, existingStream?: MediaStream) {
    try {
      // Use existing stream if provided (iOS Safari - permission already granted)
      // Otherwise request permission now (desktop browsers)
      this.mediaStream = existingStream || await requestMicrophonePermission();
      this.updateDiagnostics();
      
      // Use the shared unlocked AudioContext for output
      this.audioContext = sharedOutputAudioContext || new AudioContext({ sampleRate: 24000 });
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming AudioContext in connect...');
        await this.audioContext.resume();
      }
      this.audioQueue = new AudioQueue(this.audioContext);
      
      // Get ephemeral token from edge function
      const tokenResponse = await fetch(
        `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/realtime-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motorContext, currentPage })
        }
      );
      
      const data = await tokenResponse.json();
      
      if (!data.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      this.tokenReceived = true;
      console.log('✅ Ephemeral token received');
      this.updateDiagnostics();

      // Create peer connection (explicit STUN improves reliability on some networks)
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Ensure we explicitly negotiate receiving remote audio
      // (some browsers won't fire ontrack reliably without a transceiver)
      try {
        this.pc.addTransceiver('audio', { direction: 'sendrecv' });
        console.log('🎛️ Added audio transceiver (sendrecv)');
      } catch (e) {
        console.log('Audio transceiver not added (non-fatal):', e);
      }

      // ICE candidate logging
      this.pc.onicecandidate = (e) => {
        if (e.candidate) {
          console.log('🧊 ICE candidate:', e.candidate.type, e.candidate.protocol, e.candidate.address || '(no address)');
        } else {
          console.log('🧊 ICE gathering complete (null candidate)');
        }
      };

      this.pc.addEventListener('connectionstatechange', () => {
        console.log('RTCPeerConnection state:', this.pc?.connectionState);
        this.updateDiagnostics();
        if (this.pc?.connectionState === 'failed') {
          this.onError(new Error('Voice connection failed (network/WebRTC).'));
        }
      });

      this.pc.addEventListener('iceconnectionstatechange', () => {
        console.log('ICE connection state:', this.pc?.iceConnectionState);
      });

      // Start monitoring audio transmission stats
      const statsInterval = setInterval(() => {
        if (!this.pc || this.pc.connectionState === 'closed') {
          clearInterval(statsInterval);
          return;
        }
        
        // Monitor outbound audio (mic → OpenAI)
        this.pc.getSenders().forEach(sender => {
          if (sender.track?.kind === 'audio') {
            sender.getStats().then(stats => {
              stats.forEach(report => {
                if (report.type === 'outbound-rtp' && report.bytesSent !== undefined) {
                  console.log('📤 Audio OUT:', report.bytesSent, 'bytes,', report.packetsSent, 'packets');
                }
              });
            });
          }
        });
        
        // Monitor inbound audio (OpenAI → us)
        this.pc.getReceivers().forEach(receiver => {
          if (receiver.track?.kind === 'audio') {
            receiver.getStats().then(stats => {
              stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.bytesReceived !== undefined) {
                  this.inboundAudioBytes = report.bytesReceived as number;
                  console.log('📥 Audio IN:', report.bytesReceived, 'bytes,', report.packetsReceived, 'packets');
                  this.updateDiagnostics();
                }
              });
            });
          }
        });
      }, 3000);

      // Set up remote audio - this receives AI's voice via WebRTC
      this.pc.ontrack = (e) => {
        this.hasReceivedRemoteTrack = true;
        console.log(
          '🎧 Received remote track:',
          e.track.kind,
          'readyState:',
          e.track.readyState,
          'streams:',
          e.streams.length
        );
        console.log(
          '🎧 Track details - id:',
          e.track.id,
          'label:',
          e.track.label,
          'muted:',
          e.track.muted
        );
        this.updateDiagnostics();

        const remoteStream = e.streams?.[0] ?? new MediaStream([e.track]);
        if (!e.streams?.[0]) {
          console.warn('🎧 ontrack fired without streams; using MediaStream([track]) fallback');
        }

        console.log('Setting audio srcObject with stream:', remoteStream.id);

        // PRIMARY: Route through Web Audio API (more reliable on Safari/Mac)
        if (this.audioContext && this.audioContext.state === 'running') {
          try {
            // Disconnect previous source if any
            this.webAudioSource?.disconnect();

            this.webAudioSource = this.audioContext.createMediaStreamSource(remoteStream);
            this.webAudioSource.connect(this.audioContext.destination);
            console.log('✅ Remote audio routed through Web Audio API');
            this.audioIsPlaying = true;
            this.updateDiagnostics();
          } catch (err: any) {
            console.error('❌ Web Audio routing failed:', err);
            this.lastPlayError = err?.message || 'Web Audio routing failed';
            this.updateDiagnostics();
          }
        }

        // FALLBACK: Also set on audio element (some browsers prefer this)
        this.audioEl.srcObject = remoteStream;
        console.log('🔊 Audio element srcObject set');

        // Play with comprehensive error handling
        this.audioEl
          .play()
          .then(() => {
            console.log('✅ Audio element playback started successfully');
            this.audioIsPlaying = true;
            this.lastPlayError = null;
            this.updateDiagnostics();
          })
          .catch((err) => {
            console.error('❌ Audio element play failed:', err);
            this.lastPlayError = err?.message || 'Audio element play failed';
            this.updateDiagnostics();

            // Try playing on next user interaction (autoplay policy)
            const playOnInteraction = () => {
              this.audioEl
                .play()
                .then(() => {
                  console.log('✅ Audio playback started after user interaction');
                  this.audioIsPlaying = true;
                  this.lastPlayError = null;
                  this.updateDiagnostics();
                })
                .catch((e2) => console.error('Still failed:', e2));
            };
            document.addEventListener('click', playOnInteraction, { once: true });
          });
      };

      // Add local audio track from our stream (microphone → AI)
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track available from microphone');
      }
      const sender = this.pc.addTrack(audioTrack, this.mediaStream);
      console.log('🎤 Added local audio track:', audioTrack.label, 'enabled:', audioTrack.enabled);

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        console.log("Data channel opened");
        this.onConnectionChange(true);
        this.updateDiagnostics();

        // DON'T send greeting here - wait for session.created event in handleEvent
        // This ensures the session is fully established before we try to trigger a response

        // Start audio watchdog - if no audio received after 8s, notify user
        this.watchdogTimeout = setTimeout(() => {
          if (this.inboundAudioBytes === 0 && !this.audioIsPlaying) {
            console.warn('⚠️ Watchdog: No audio received after 8s');
            this.onAudioIssue?.();
          }
        }, 8000);
      });
      
      this.dc.addEventListener("close", () => {
        console.log("Data channel closed");
        this.onConnectionChange(false);
        this.updateDiagnostics();
      });
      
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        this.handleEvent(event);
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for ICE candidates to be gathered (critical for some networks/browsers)
      console.log('Waiting for ICE gathering to complete...');
      await new Promise<void>((resolve) => {
        if (!this.pc) return resolve();
        if (this.pc.iceGatheringState === 'complete') return resolve();

        const onStateChange = () => {
          console.log('ICE gathering state:', this.pc?.iceGatheringState);
          if (this.pc?.iceGatheringState === 'complete') {
            this.pc?.removeEventListener('icegatheringstatechange', onStateChange);
            resolve();
          }
        };

        this.pc.addEventListener('icegatheringstatechange', onStateChange);

        // Safety timeout: don't hang forever
        setTimeout(() => {
          this.pc?.removeEventListener('icegatheringstatechange', onStateChange);
          console.log('ICE gathering wait timed out; continuing');
          resolve();
        }, 2000);
      });

      const localSdp = this.pc.localDescription?.sdp;
      if (!localSdp) {
        throw new Error('Failed to generate local SDP');
      }

      // Exchange SDP via edge function proxy (avoids CORS issues)
      console.log('Exchanging SDP via edge function proxy...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      try {
        const sdpResponse = await fetch(
          'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/realtime-sdp-exchange',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sdpOffer: localSdp,
              ephemeralKey: EPHEMERAL_KEY,
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);

        if (!sdpResponse.ok) {
          const errorData = await sdpResponse.text();
          console.error('SDP exchange failed:', sdpResponse.status, errorData);
          throw new Error(`OpenAI connection failed: ${sdpResponse.status}`);
        }

        var answerSdp = await sdpResponse.text();
        console.log('SDP exchange successful');
        this.updateDiagnostics();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Connection timed out. Please try again.');
        }
        throw err;
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: answerSdp,
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC SDP exchange complete, waiting for connection...");
      
      // Wait for WebRTC connection to be fully established
      await new Promise<void>((resolve, reject) => {
        if (!this.pc) return reject(new Error('No peer connection'));
        
        if (this.pc.connectionState === 'connected') {
          console.log('✅ WebRTC already connected');
          return resolve();
        }
        
        const onConnectionChange = () => {
          console.log('Connection state changed to:', this.pc?.connectionState);
          if (this.pc?.connectionState === 'connected') {
            this.pc.removeEventListener('connectionstatechange', onConnectionChange);
            console.log('✅ WebRTC fully connected - audio should now flow');
            resolve();
          } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
            this.pc.removeEventListener('connectionstatechange', onConnectionChange);
            reject(new Error('WebRTC connection failed'));
          }
        };
        
        this.pc.addEventListener('connectionstatechange', onConnectionChange);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          this.pc?.removeEventListener('connectionstatechange', onConnectionChange);
          // If still connecting, proceed anyway (data channel may still work)
          if (this.pc?.connectionState === 'connecting') {
            console.log('Connection still in progress, proceeding...');
            resolve();
          } else if (this.pc?.connectionState !== 'connected') {
            reject(new Error('WebRTC connection timed out'));
          }
        }, 10000);
      });

    } catch (error) {
      console.error("Error connecting:", error);
      this.onError(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  private handleEvent(event: any) {
    console.log("Received event:", event.type);
    
    switch (event.type) {
      case 'session.created':
        console.log('✅ Session created - now configuring and sending greeting');
        this.sessionCreatedReceived = true;
        this.updateDiagnostics();
        
        // Send session.update with explicit audio configuration
        if (this.dc?.readyState === 'open') {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              }
            }
          };
          console.log('📤 Sending session.update with audio config');
          this.dc.send(JSON.stringify(sessionUpdate));
          
          // Now send the initial greeting
          if (!this.hasSentGreeting) {
            this.hasSentGreeting = true;
            console.log('👋 Triggering initial AI voice greeting...');
            
            // Send a conversation item first, then request response
            this.dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{
                  type: 'input_text',
                  text: '[System: User just connected to voice chat. Greet them warmly as Harris in 1 short sentence.]'
                }]
              }
            }));
            
            this.dc.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text']
              }
            }));

            // Extra diagnostics check after greeting
            setTimeout(() => {
              const d = this.getDiagnostics();
              console.log('🧪 Post-greeting diagnostics:', d);
              if (!d.remoteTrackReceived && d.inboundAudioBytes === 0) {
                console.warn('⚠️ No remote audio track/bytes after greeting request');
                this.onAudioIssue?.();
              }
            }, 3000);
          }
        }
        break;
        
      case 'session.updated':
        console.log('✅ Session updated successfully');
        break;
        
      case 'response.audio.delta':
        // In WebRTC mode, audio comes through ontrack (RTCPeerConnection), NOT here
        // This event is only sent in WebSocket mode
        // Just update the speaking state indicator
        this.onSpeakingChange(true);
        console.log('📢 response.audio.delta received (WebRTC audio flows via ontrack)');
        break;
        
      case 'response.audio.done':
        setTimeout(() => this.onSpeakingChange(false), 500);
        break;
        
      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.onTranscript(event.delta, false);
        }
        break;
        
      case 'response.audio_transcript.done':
        if (event.transcript) {
          this.onTranscript(event.transcript, true);
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log("User started speaking");
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log("User stopped speaking");
        break;
        
      case 'error':
        console.error("Realtime API error:", event.error);
        this.onError(new Error(event.error?.message || 'Unknown error'));
        break;
    }
  }

  sendTextMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  updateContext(motorContext?: { model: string; hp: number; price?: number } | null, currentPage?: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.log('Cannot update context: data channel not ready');
      return;
    }

    const contextParts: string[] = [];
    if (motorContext) {
      contextParts.push(`User is now viewing ${motorContext.model} (${motorContext.hp}HP) priced at $${motorContext.price?.toLocaleString() || 'N/A'}`);
    }
    if (currentPage) {
      contextParts.push(`Current page: ${currentPage}`);
    }

    if (contextParts.length === 0) return;

    const contextMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: `[Context Update: ${contextParts.join('. ')}]`
        }]
      }
    };

    console.log('Sending context update:', contextMessage);
    this.dc.send(JSON.stringify(contextMessage));
  }

  /**
   * Retry audio playback - call this from a user gesture if audio didn't start
   */
  async retryAudioPlayback() {
    console.log('🔁 Retrying audio playback...');
    
    // Re-unlock audio context
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed');
    }
    
    // Retry audio element play
    try {
      await this.audioEl.play();
      console.log('Audio element play succeeded on retry');
      this.audioIsPlaying = true;
      this.lastPlayError = null;
      this.updateDiagnostics();
    } catch (e) {
      console.error('Audio element play failed on retry:', e);
    }
  }

  disconnect() {
    console.log('Disconnecting voice chat...');
    
    // Clear watchdog
    if (this.watchdogTimeout) {
      clearTimeout(this.watchdogTimeout);
      this.watchdogTimeout = null;
    }
    
    this.recorder?.stop();
    this.audioQueue?.clear();
    this.webAudioSource?.disconnect();
    this.webAudioSource = null;
    this.dc?.close();
    this.pc?.close();
    // Don't close the shared audioContext - it can be reused
    // this.audioContext?.close();
    // Stop all tracks on the media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.audioEl.srcObject = null;
    // Remove audio element from DOM
    if (this.audioEl.parentNode) {
      this.audioEl.parentNode.removeChild(this.audioEl);
    }
    
    // Reset state
    this.hasReceivedRemoteTrack = false;
    this.hasSentGreeting = false;
    this.sessionCreatedReceived = false;
    this.audioIsPlaying = false;
    this.inboundAudioBytes = 0;
    this.lastPlayError = null;
    
    this.onConnectionChange(false);
  }
}
