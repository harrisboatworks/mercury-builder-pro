import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceTestStep, type StepStatus } from '@/components/voice-test/VoiceTestStep';
import { VoiceTestReport } from '@/components/voice-test/VoiceTestReport';
import {
  checkAudioInputDevices,
  checkMicrophonePermission,
  requestMicrophonePermission,
  safeCreateAudioContext,
  unlockAudioOutput,
} from '@/lib/RealtimeVoice';
import { supabase } from '@/integrations/supabase/client';

interface TestStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  details: string | null;
}

const initialSteps: TestStep[] = [
  {
    id: 'browser',
    title: 'Browser Compatibility',
    description: 'Checking WebRTC, AudioContext, and MediaDevices support',
    status: 'pending',
    details: null,
  },
  {
    id: 'microphone',
    title: 'Microphone Permission',
    description: 'Requesting access to your microphone',
    status: 'pending',
    details: null,
  },
  {
    id: 'speaker',
    title: 'Speaker Test',
    description: 'Playing a test tone to verify audio output',
    status: 'pending',
    details: null,
  },
  {
    id: 'webrtc',
    title: 'WebRTC Connection',
    description: 'Connecting to voice server',
    status: 'pending',
    details: null,
  },
  {
    id: 'playback',
    title: 'AI Audio Playback',
    description: 'Testing audio playback from AI response',
    status: 'pending',
    details: null,
  },
];

export default function VoiceTest() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<TestStep[]>(initialSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [heardBeep, setHeardBeep] = useState<boolean | null>(null);

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const runBrowserTest = async (): Promise<boolean> => {
    updateStep('browser', { status: 'running' });
    
    const hasWebRTC = !!(window.RTCPeerConnection);
    const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    const hasMediaDevices = !!(navigator.mediaDevices?.getUserMedia);
    
    const details = [
      `WebRTC: ${hasWebRTC ? 'Supported' : 'Not supported'}`,
      `AudioContext: ${hasAudioContext ? 'Supported' : 'Not supported'}`,
      `MediaDevices: ${hasMediaDevices ? 'Supported' : 'Not supported'}`,
    ].join(' | ');
    
    const passed = hasWebRTC && hasAudioContext && hasMediaDevices;
    updateStep('browser', { 
      status: passed ? 'passed' : 'failed',
      details,
    });
    
    return passed;
  };

  const runMicrophoneTest = async (): Promise<boolean> => {
    updateStep('microphone', { status: 'running' });
    
    try {
      const { hasDevices, deviceCount } = await checkAudioInputDevices();
      
      if (!hasDevices) {
        updateStep('microphone', { 
          status: 'failed',
          details: 'No microphone detected',
        });
        return false;
      }
      
      const permission = await checkMicrophonePermission();
      
      if (permission === 'denied') {
        updateStep('microphone', { 
          status: 'failed',
          details: 'Microphone permission denied. Please enable in browser settings.',
        });
        return false;
      }
      
      // Request permission if not granted
      if (permission !== 'granted') {
        try {
          const stream = await requestMicrophonePermission();
          stream.getTracks().forEach(t => t.stop());
        } catch (e) {
          updateStep('microphone', { 
            status: 'failed',
            details: `Permission request failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
          });
          return false;
        }
      }
      
      updateStep('microphone', { 
        status: 'passed',
        details: `Permission: granted | Devices found: ${deviceCount}`,
      });
      return true;
    } catch (e) {
      updateStep('microphone', { 
        status: 'failed',
        details: e instanceof Error ? e.message : 'Unknown error',
      });
      return false;
    }
  };

  const runSpeakerTest = async (): Promise<boolean> => {
    updateStep('speaker', { status: 'running', details: 'Playing test tone...' });
    
    return new Promise((resolve) => {
      try {
        const audioContext = safeCreateAudioContext();
        if (!audioContext) {
          updateStep('speaker', { 
            status: 'failed',
            details: 'Could not create AudioContext',
          });
          resolve(false);
          return;
        }
        
        // Play a 440Hz beep for 0.5 seconds
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Ask user if they heard it
        updateStep('speaker', { 
          status: 'running',
          details: 'Did you hear the beep? Click Yes or No below.',
        });
        
        setHeardBeep(null);
        
        // Wait for user response (handled by button clicks)
      } catch (e) {
        updateStep('speaker', { 
          status: 'failed',
          details: e instanceof Error ? e.message : 'Failed to play audio',
        });
        resolve(false);
      }
    });
  };

  const confirmHeardBeep = (heard: boolean) => {
    setHeardBeep(heard);
    updateStep('speaker', { 
      status: heard ? 'passed' : 'failed',
      details: heard ? 'User confirmed: Heard beep' : 'User reported: Did not hear beep',
    });
  };

  const runWebRTCTest = async (): Promise<boolean> => {
    updateStep('webrtc', { status: 'running', details: 'Fetching token...' });
    
    try {
      // Fetch ephemeral token using the correct edge function
      const { data, error } = await supabase.functions.invoke('realtime-session');
      
      if (error || !data?.client_secret?.value) {
        updateStep('webrtc', { 
          status: 'failed',
          details: `Token error: ${error?.message || 'No token received'}`,
        });
        return false;
      }
      
      updateStep('webrtc', { status: 'running', details: 'Token received, testing SDP exchange via proxy...' });
      
      // Create a simple peer connection to test SDP exchange
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Add a transceiver for audio
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve();
        
        const onGatheringChange = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', onGatheringChange);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', onGatheringChange);
        setTimeout(() => {
          pc.removeEventListener('icegatheringstatechange', onGatheringChange);
          resolve();
        }, 2000);
      });
      
      const localSdp = pc.localDescription?.sdp;
      if (!localSdp) throw new Error('Failed to generate local SDP');
      
      // Use the SDP proxy edge function (matches production flow)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      try {
        const sdpResponse = await fetch(
          'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/realtime-sdp-exchange',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sdpOffer: localSdp,
              ephemeralKey: data.client_secret.value,
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeout);
        
        if (!sdpResponse.ok) {
          const errorText = await sdpResponse.text();
          throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText.slice(0, 100)}`);
        }
        
        const answerSdp = await sdpResponse.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
        
        pc.close();
        
        updateStep('webrtc', { 
          status: 'passed',
          details: 'Token: received | SDP Exchange (via proxy): success',
        });
        return true;
      } catch (e) {
        clearTimeout(timeout);
        pc.close();
        throw e;
      }
    } catch (e) {
      updateStep('webrtc', { 
        status: 'failed',
        details: e instanceof Error ? e.message : 'Connection failed',
      });
      return false;
    }
  };

  const runPlaybackTest = async (): Promise<boolean> => {
    updateStep('playback', { status: 'running', details: 'Connecting to AI for voice test...' });
    
    // Diagnostic state
    const diagnostics = {
      tokenReceived: false,
      dataChannelOpen: false,
      sessionCreated: false,
      sessionUpdated: false,
      trackReceived: false,
      audioElementPlaying: false,
      autoplayError: null as string | null,
      receivedAudioDelta: false,
      receivedTextOnly: false,
      pcConnectionState: 'new',
      iceConnectionState: 'new',
    };
    
    const updateDiagnosticDetails = () => {
      const parts = [
        `Token: ${diagnostics.tokenReceived ? '✓' : '✗'}`,
        `DataChannel: ${diagnostics.dataChannelOpen ? '✓' : '✗'}`,
        `Session: ${diagnostics.sessionCreated ? 'created' : 'waiting'}${diagnostics.sessionUpdated ? '/updated' : ''}`,
        `Track: ${diagnostics.trackReceived ? '✓' : '✗'}`,
        `Audio: ${diagnostics.audioElementPlaying ? 'playing' : diagnostics.autoplayError ? `blocked: ${diagnostics.autoplayError}` : 'waiting'}`,
        `PC: ${diagnostics.pcConnectionState}`,
      ];
      return parts.join(' | ');
    };
    
    try {
      // Fetch ephemeral token
      const { data, error } = await supabase.functions.invoke('realtime-session');
      
      if (error || !data?.client_secret?.value) {
        throw new Error('Failed to get session token');
      }
      
      diagnostics.tokenReceived = true;
      updateStep('playback', { status: 'running', details: 'Token received, establishing audio connection...' });
      
      const EPHEMERAL_KEY = data.client_secret.value;
      
      // Create peer connection with STUN servers (matches RealtimeVoice.ts)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Add transceiver for receiving audio
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.muted = false;
      audioEl.volume = 1;
      audioEl.style.position = 'fixed';
      audioEl.style.left = '-9999px';
      audioEl.style.top = '-9999px';
      document.body.appendChild(audioEl);

      // Ensure audio output is unlocked (helps on Safari/iOS)
      await unlockAudioOutput();

      let connectionTimeout: ReturnType<typeof setTimeout>;

      // Track connection state changes
      pc.onconnectionstatechange = () => {
        diagnostics.pcConnectionState = pc.connectionState;
        console.log('[VoiceTest] PC state:', pc.connectionState);
      };
      
      pc.oniceconnectionstatechange = () => {
        diagnostics.iceConnectionState = pc.iceConnectionState;
        console.log('[VoiceTest] ICE state:', pc.iceConnectionState);
      };

      audioEl.onplaying = () => {
        diagnostics.audioElementPlaying = true;
        console.log('[VoiceTest] Audio element is playing');
      };

      // Set up remote audio track
      pc.ontrack = (e) => {
        diagnostics.trackReceived = true;
        console.log('[VoiceTest] Received audio track:', e.track.kind, 'streams:', e.streams.length);
        
        const stream = e.streams[0] ?? new MediaStream([e.track]);
        audioEl.srcObject = stream;

        const playPromise = audioEl.play();
        if (playPromise) {
          playPromise.catch((err) => {
            diagnostics.autoplayError = err instanceof Error ? err.message : String(err);
            console.warn('[VoiceTest] audioEl.play() failed:', diagnostics.autoplayError);
          });
        }
      };
      
      // Add local audio track (required for bidirectional)
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);
      
      // Create data channel for sending messages
      const dc = pc.createDataChannel('oai-events');
      
      return new Promise((resolve) => {
        connectionTimeout = setTimeout(() => {
          pc.close();
          ms.getTracks().forEach(t => t.stop());
          audioEl.srcObject = null;
          audioEl.remove();
          updateStep('playback', { 
            status: 'failed',
            details: `Timeout after 20s. ${updateDiagnosticDetails()}`,
          });
          resolve(false);
        }, 20000);
        
        dc.addEventListener('open', () => {
          diagnostics.dataChannelOpen = true;
          console.log('[VoiceTest] Data channel open, waiting for session.created...');
          updateStep('playback', { status: 'running', details: 'Data channel open, waiting for session...' });
          // DON'T send messages here - wait for session.created first!
        });
        
        dc.addEventListener('message', (e) => {
          try {
            const event = JSON.parse(e.data);
            console.log('[VoiceTest] Event:', event.type);
            
            // CRITICAL: Wait for session.created, then send session.update
            if (event.type === 'session.created') {
              diagnostics.sessionCreated = true;
              console.log('[VoiceTest] Session created, sending session.update with audio config...');
              updateStep('playback', { status: 'running', details: 'Session created, configuring audio...' });
              
              // Send session.update with audio configuration (matches RealtimeVoice.ts)
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
              dc.send(JSON.stringify(sessionUpdate));
            }
            
            // After session.updated, send the test message
            if (event.type === 'session.updated') {
              diagnostics.sessionUpdated = true;
              console.log('[VoiceTest] Session updated, now sending test message...');
              updateStep('playback', { status: 'running', details: 'Session configured, sending test message...' });
              
              // Send test message
              dc.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{
                    type: 'input_text',
                    text: 'Say "Voice test successful" in a brief, friendly way.'
                  }]
                }
              }));
              
              // Request audio response
              dc.send(JSON.stringify({ 
                type: 'response.create',
                response: {
                  modalities: ['audio', 'text']
                }
              }));
              
              updateStep('playback', { status: 'running', details: 'Waiting for AI voice response...' });
            }
            
            // Detect text-only response (no audio)
            if (event.type === 'response.text.delta' || event.type === 'response.audio_transcript.delta') {
              if (!diagnostics.receivedAudioDelta) {
                diagnostics.receivedTextOnly = true;
              }
            }
            
            if (event.type === 'response.audio.delta') {
              diagnostics.receivedAudioDelta = true;
              diagnostics.receivedTextOnly = false;
              updateStep('playback', { status: 'running', details: 'Receiving AI audio stream...' });
            }
            
            if (event.type === 'response.done') {
              clearTimeout(connectionTimeout);
              
              // Give time for audio to finish playing
              setTimeout(() => {
                pc.close();
                ms.getTracks().forEach(t => t.stop());
                audioEl.srcObject = null;
                audioEl.remove();
                
                if (diagnostics.audioElementPlaying) {
                  updateStep('playback', { 
                    status: 'passed',
                    details: 'AI voice response played successfully!',
                  });
                  resolve(true);
                  return;
                }

                // Diagnose specific failure modes with detailed info
                if (!diagnostics.sessionCreated) {
                  updateStep('playback', {
                    status: 'failed',
                    details: `Never received session.created. ${updateDiagnosticDetails()}`,
                  });
                  resolve(false);
                  return;
                }
                
                if (!diagnostics.sessionUpdated) {
                  updateStep('playback', {
                    status: 'failed',
                    details: `session.update was not acknowledged. ${updateDiagnosticDetails()}`,
                  });
                  resolve(false);
                  return;
                }

                if (!diagnostics.receivedAudioDelta && diagnostics.receivedTextOnly) {
                  updateStep('playback', {
                    status: 'failed',
                    details: `AI responded with text only (no audio). Session may not have audio enabled. ${updateDiagnosticDetails()}`,
                  });
                  resolve(false);
                  return;
                }

                if (diagnostics.trackReceived && diagnostics.autoplayError) {
                  updateStep('playback', {
                    status: 'failed',
                    details: `Autoplay blocked: ${diagnostics.autoplayError}. Try tapping screen first.`,
                  });
                  resolve(false);
                  return;
                }

                if (diagnostics.receivedAudioDelta && diagnostics.trackReceived) {
                  updateStep('playback', { 
                    status: 'failed',
                    details: 'Audio received but not playing. Check: volume, mute, output device, iOS silent switch.',
                  });
                  resolve(false);
                  return;
                }

                if (diagnostics.receivedAudioDelta && !diagnostics.trackReceived) {
                  updateStep('playback', { 
                    status: 'failed',
                    details: `Audio delta received but no WebRTC track. ${updateDiagnosticDetails()}`,
                  });
                  resolve(false);
                  return;
                }

                updateStep('playback', { 
                  status: 'failed',
                  details: `No audio response. ${updateDiagnosticDetails()}`,
                });
                resolve(false);
              }, 3000);
            }
            
            if (event.type === 'error') {
              clearTimeout(connectionTimeout);
              pc.close();
              ms.getTracks().forEach(t => t.stop());
              audioEl.srcObject = null;
              audioEl.remove();
              updateStep('playback', { 
                status: 'failed',
                details: `AI error: ${event.error?.message || 'Unknown error'}`,
              });
              resolve(false);
            }
          } catch (err) {
            console.error('[VoiceTest] Error parsing message:', err);
          }
        });
        
        // Start WebRTC handshake via edge function proxy (matches RealtimeVoice.ts)
        (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Wait for ICE gathering (helps on some networks)
            await new Promise<void>((resolveIce) => {
              if (pc.iceGatheringState === 'complete') return resolveIce();
              
              const onGatheringChange = () => {
                if (pc.iceGatheringState === 'complete') {
                  pc.removeEventListener('icegatheringstatechange', onGatheringChange);
                  resolveIce();
                }
              };
              pc.addEventListener('icegatheringstatechange', onGatheringChange);
              
              // Timeout after 2s
              setTimeout(() => {
                pc.removeEventListener('icegatheringstatechange', onGatheringChange);
                resolveIce();
              }, 2000);
            });
            
            const localSdp = pc.localDescription?.sdp;
            if (!localSdp) throw new Error('Failed to generate local SDP');
            
            updateStep('playback', { status: 'running', details: 'Exchanging SDP via proxy...' });
            
            // Use the SDP proxy edge function (not direct OpenAI call)
            const sdpResponse = await fetch(
              'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/realtime-sdp-exchange',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sdpOffer: localSdp,
                  ephemeralKey: EPHEMERAL_KEY,
                }),
              }
            );
            
            if (!sdpResponse.ok) {
              const errorText = await sdpResponse.text();
              throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText.slice(0, 100)}`);
            }
            
            const answerSdp = await sdpResponse.text();
            await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
            
            console.log('[VoiceTest] SDP exchange complete, waiting for session.created...');
            updateStep('playback', { status: 'running', details: 'Connected, waiting for session.created...' });
          } catch (err) {
            clearTimeout(connectionTimeout);
            pc.close();
            ms.getTracks().forEach(t => t.stop());
            updateStep('playback', { 
              status: 'failed',
              details: err instanceof Error ? err.message : 'Connection failed',
            });
            resolve(false);
          }
        })();
      });
    } catch (e) {
      updateStep('playback', { 
        status: 'failed',
        details: e instanceof Error ? e.message : 'Playback test failed',
      });
      return false;
    }
  };

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setIsComplete(false);
    setRecommendation(null);
    setSteps(initialSteps);
    
    // Step 1: Browser
    const browserPassed = await runBrowserTest();
    if (!browserPassed) {
      setRecommendation('Your browser does not support required features. Please try Chrome, Edge, or Safari.');
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    
    // Step 2: Microphone
    const micPassed = await runMicrophoneTest();
    if (!micPassed) {
      setRecommendation('Microphone access is required for voice chat. Please check your browser permissions.');
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    
    // Step 3: Speaker - this needs user confirmation
    await runSpeakerTest();
    setIsRunning(false);
  }, []);

  const continueAfterSpeaker = useCallback(async () => {
    if (heardBeep === null) return;
    
    setIsRunning(true);
    
    if (!heardBeep) {
      setRecommendation('Check that your speakers are not muted and volume is turned up. Try using headphones.');
      ['webrtc', 'playback'].forEach(id => updateStep(id, { status: 'skipped' }));
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    
    // Step 4: WebRTC
    const webrtcPassed = await runWebRTCTest();
    if (!webrtcPassed) {
      setRecommendation('Could not connect to voice server. Check your network connection or firewall settings.');
      updateStep('playback', { status: 'skipped' });
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    
    // Step 5: Playback
    const playbackPassed = await runPlaybackTest();
    
    // Generate specific recommendations based on results
    if (playbackPassed) {
      setRecommendation('All tests passed! Voice chat should work correctly.');
    } else {
      const playbackStep = steps.find(s => s.id === 'playback');
      const details = playbackStep?.details || '';
      
      if (details.includes('text only')) {
        setRecommendation('The AI responded without audio. Try again or contact support if the issue persists.');
      } else if (details.includes('blocked')) {
        setRecommendation('Your browser blocked audio autoplay. Try: 1) Tap the screen before starting voice chat, 2) Check browser autoplay settings, 3) Use headphones.');
      } else if (details.includes('not playing') || details.includes('silent switch')) {
        setRecommendation('Audio is reaching your device but not playing. Check: 1) Volume is up, 2) Not muted, 3) Correct output device selected, 4) iOS silent switch is off.');
      } else {
        setRecommendation('Voice playback test failed. Try using headphones, a different browser, or check your audio output device.');
      }
    }
    
    setIsComplete(true);
    setIsRunning(false);
  }, [heardBeep]);

  const resetTests = () => {
    setSteps(initialSteps);
    setIsComplete(false);
    setRecommendation(null);
    setHeardBeep(null);
  };

  const currentStep = steps.find(s => s.status === 'running');
  const showSpeakerConfirm = currentStep?.id === 'speaker' && heardBeep === null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Voice Diagnostics</h1>
            <p className="text-muted-foreground">Test your audio setup step by step</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-1">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step.status === 'passed' ? 'bg-emerald-500' :
                  step.status === 'failed' ? 'bg-destructive' :
                  step.status === 'running' ? 'bg-primary' :
                  'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step, idx) => (
            <VoiceTestStep
              key={step.id}
              step={idx + 1}
              title={step.title}
              description={step.description}
              status={step.status}
              details={step.details}
            >
              {/* Speaker confirmation buttons */}
              {step.id === 'speaker' && showSpeakerConfirm && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => confirmHeardBeep(true)}
                  >
                    <Volume2 className="w-4 h-4 mr-1" />
                    Yes, I heard it
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => confirmHeardBeep(false)}
                  >
                    No, I didn't hear it
                  </Button>
                </div>
              )}
            </VoiceTestStep>
          ))}
        </div>

        {/* Report */}
        {isComplete && (
          <VoiceTestReport
            results={steps.map((s, i) => ({
              step: i + 1,
              title: s.title,
              status: s.status,
              details: s.details || undefined,
            }))}
            recommendation={recommendation || undefined}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {!isRunning && !isComplete && heardBeep === null && (
            <Button onClick={runAllTests} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Run Diagnostics
            </Button>
          )}
          
          {heardBeep !== null && !isComplete && (
            <Button onClick={continueAfterSpeaker} className="flex-1">
              Continue Tests
            </Button>
          )}
          
          {isComplete && (
            <Button variant="outline" onClick={resetTests} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Run Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
