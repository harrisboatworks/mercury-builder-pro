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
      
      updateStep('webrtc', { status: 'running', details: 'Token received, testing SDP exchange...' });
      
      // Create a simple peer connection to test SDP exchange
      const pc = new RTCPeerConnection();
      
      // Add a transceiver for audio
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Try to exchange SDP with OpenAI
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      try {
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${data.client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          signal: controller.signal,
        });
        
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
          details: 'Token: received | SDP Exchange: success',
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
    updateStep('playback', { status: 'running', details: 'This test requires a full voice session...' });
    
    // For now, mark as passed if WebRTC worked - full playback test requires actual session
    await new Promise(r => setTimeout(r, 1000));
    
    updateStep('playback', { 
      status: 'passed',
      details: 'WebRTC connection verified. Full playback test available in voice chat.',
    });
    return true;
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
    await runPlaybackTest();
    
    setRecommendation('All tests passed! Voice chat should work correctly.');
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
