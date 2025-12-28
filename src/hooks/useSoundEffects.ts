import { useCallback, useRef, useEffect } from 'react';

type SoundType = 
  | 'click' 
  | 'success' 
  | 'error' 
  | 'notification'
  | 'swoosh'
  | 'reveal'
  | 'tick'
  | 'complete'
  | 'packageSelect'
  | 'ambientPad'
  | 'celebration';

interface SoundEffectsOptions {
  enabled?: boolean;
  volume?: number;
}

// Web Audio API based sound generator - no external files needed
export function useSoundEffects(options: SoundEffectsOptions = {}) {
  const { enabled = true, volume = 0.3 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);

  // Keep ref in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Lazy init AudioContext (must be triggered by user interaction)
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Generate different sounds using oscillators
  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getContext();
      const now = ctx.currentTime;
      
      // Master gain
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.value = volume;

      switch (type) {
        case 'click': {
          // Subtle click - short high-frequency blip
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterGain);
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'success': {
          // Two-note success chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);
          
          osc1.frequency.value = 523.25; // C5
          osc2.frequency.value = 659.25; // E5
          osc1.type = 'sine';
          osc2.type = 'sine';
          
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          
          osc1.start(now);
          osc2.start(now + 0.1);
          osc1.stop(now + 0.2);
          osc2.stop(now + 0.3);
          break;
        }

        case 'swoosh': {
          // Whoosh sound using filtered noise
          const bufferSize = ctx.sampleRate * 0.2;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }
          
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, now);
          filter.frequency.exponentialRampToValueAtTime(4000, now + 0.15);
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          
          source.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          source.start(now);
          break;
        }

        case 'reveal': {
          // Dramatic reveal - rising tones
          for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.frequency.value = 200 + (i * 100);
            osc.type = 'sine';
            
            const startTime = now + (i * 0.08);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.start(startTime);
            osc.stop(startTime + 0.25);
          }
          break;
        }

        case 'tick': {
          // Subtle tick for counting
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterGain);
          osc.frequency.value = 1200;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
          osc.start(now);
          osc.stop(now + 0.02);
          break;
        }

        case 'complete': {
          // Satisfying completion - chord
          const frequencies = [523.25, 659.25, 783.99]; // C, E, G
          frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.start(now + i * 0.05);
            osc.stop(now + 0.5);
          });
          break;
        }

        case 'notification': {
          // Gentle notification ping
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterGain);
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'error': {
          // Low buzz for error
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(masterGain);
          osc.frequency.value = 200;
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'packageSelect': {
          // Satisfying harmonic chord (A4 + C#5) for package selection
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);
          
          osc1.frequency.value = 440;     // A4
          osc2.frequency.value = 554.37;  // C#5 (major third)
          osc1.type = 'sine';
          osc2.type = 'sine';
          
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.15);
          osc2.stop(now + 0.15);
          break;
        }

        case 'ambientPad': {
          // Luxurious ambient pad - soft evolving Cmaj7 drone
          const frequencies = [130.81, 164.81, 196, 246.94]; // C3, E3, G3, B3
          frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.frequency.value = freq + (Math.random() * 2 - 1); // Slight detune for warmth
            osc.type = 'sine';
            
            // Slow attack, sustain, slow release for luxury feel
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.06 - i * 0.01, now + 1.5); // 1.5s attack, decreasing volume for higher notes
            gain.gain.setValueAtTime(0.06 - i * 0.01, now + 4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 6); // 2s release
            
            osc.start(now);
            osc.stop(now + 6.5);
          });
          break;
        }

        case 'celebration': {
          // Triumphant celebration - ascending arpeggio
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = now + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.35, startTime + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
          });
          break;
        }
      }
    } catch (e) {
      // Silently fail if audio context not available
      console.debug('Sound effect failed:', e);
    }
  }, [getContext, volume]);

  return {
    playClick: useCallback(() => playSound('click'), [playSound]),
    playSuccess: useCallback(() => playSound('success'), [playSound]),
    playSwoosh: useCallback(() => playSound('swoosh'), [playSound]),
    playReveal: useCallback(() => playSound('reveal'), [playSound]),
    playTick: useCallback(() => playSound('tick'), [playSound]),
    playComplete: useCallback(() => playSound('complete'), [playSound]),
    playNotification: useCallback(() => playSound('notification'), [playSound]),
    playError: useCallback(() => playSound('error'), [playSound]),
    playPackageSelect: useCallback(() => playSound('packageSelect'), [playSound]),
    playAmbientPad: useCallback(() => playSound('ambientPad'), [playSound]),
    playCelebration: useCallback(() => playSound('celebration'), [playSound]),
    playSound,
  };
}

export type { SoundType, SoundEffectsOptions };
