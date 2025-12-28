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

// ==========================================
// PREMIUM SOUND HELPERS
// ==========================================

/** Create a simple impulse response for reverb simulation */
const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponential decay with random noise
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
};

/** Create a convolver node with reverb */
const createReverb = (ctx: AudioContext, duration = 0.3, decay = 2): ConvolverNode => {
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx, duration, decay);
  return convolver;
};

/** Create a low-pass filter for warmth */
const createWarmthFilter = (ctx: AudioContext, cutoff = 2500): BiquadFilterNode => {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7; // Gentle resonance
  return filter;
};

/** Create soft ADSR envelope */
const applySoftEnvelope = (
  gain: GainNode, 
  ctx: AudioContext, 
  options: { 
    attack?: number; 
    peak?: number; 
    decay?: number; 
    sustain?: number; 
    release?: number;
    startTime?: number;
  }
) => {
  const { 
    attack = 0.01, 
    peak = 0.3, 
    decay = 0.1, 
    sustain = 0.2, 
    release = 0.2,
    startTime = ctx.currentTime
  } = options;
  
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.setTargetAtTime(sustain, startTime + attack, decay * 0.3);
  gain.gain.setTargetAtTime(0.001, startTime + attack + decay, release * 0.3);
};

/** Create layered oscillator with harmonics and detuning */
const createLayeredTone = (
  ctx: AudioContext,
  baseFreq: number,
  masterGain: GainNode,
  options: {
    type?: OscillatorType;
    harmonics?: number[]; // Relative frequency multipliers
    volumes?: number[];   // Volume for each harmonic
    detune?: number;      // Cents to detune
    startTime: number;
    duration: number;
    attack?: number;
    release?: number;
    filterCutoff?: number;
  }
) => {
  const {
    type = 'sine',
    harmonics = [1],
    volumes = [1],
    detune = 0,
    startTime,
    duration,
    attack = 0.015,
    release = 0.1,
    filterCutoff = 3000
  } = options;

  const oscillators: OscillatorNode[] = [];
  
  // Create warmth filter
  const filter = createWarmthFilter(ctx, filterCutoff);
  filter.connect(masterGain);

  harmonics.forEach((harmonic, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.value = baseFreq * harmonic;
    osc.type = type;
    osc.detune.value = detune * (i % 2 === 0 ? 1 : -1); // Alternate detune direction
    
    osc.connect(gain);
    gain.connect(filter);
    
    const vol = (volumes[i] ?? volumes[0]) * 0.3;
    
    // Soft envelope
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + attack);
    gain.gain.setTargetAtTime(vol * 0.7, startTime + attack, 0.05);
    gain.gain.setTargetAtTime(0.001, startTime + duration - release, release * 0.3);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    
    oscillators.push(osc);
  });

  return oscillators;
};

// ==========================================
// MAIN HOOK
// ==========================================

export function useSoundEffects(options: SoundEffectsOptions = {}) {
  const { enabled = true, volume = 0.3 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const getReverb = useCallback((ctx: AudioContext) => {
    if (!reverbRef.current) {
      reverbRef.current = createReverb(ctx, 0.25, 2.5);
    }
    return reverbRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getContext();
      const now = ctx.currentTime;
      
      // Master output chain: Compressor → Master Gain → Destination
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;
      compressor.connect(ctx.destination);
      
      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(compressor);

      // Wet/dry mix for reverb
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.85;
      dryGain.connect(masterGain);
      
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.15;
      const reverb = getReverb(ctx);
      wetGain.connect(reverb);
      reverb.connect(masterGain);

      switch (type) {
        case 'click': {
          // Premium soft tactile tap
          const filter = createWarmthFilter(ctx, 1800);
          filter.connect(dryGain);
          
          // Main body - warm sine
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.frequency.value = 600;
          osc1.type = 'sine';
          osc1.connect(gain1);
          gain1.connect(filter);
          
          // Sub undertone
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.frequency.value = 300;
          osc2.type = 'sine';
          osc2.connect(gain2);
          gain2.connect(filter);
          
          // Soft attack envelope
          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.35, now + 0.008);
          gain1.gain.setTargetAtTime(0.001, now + 0.015, 0.015);
          
          gain2.gain.setValueAtTime(0.001, now);
          gain2.gain.linearRampToValueAtTime(0.15, now + 0.008);
          gain2.gain.setTargetAtTime(0.001, now + 0.015, 0.02);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.08);
          osc2.stop(now + 0.08);
          break;
        }

        case 'tick': {
          // Warm muted tap with harmonics
          const filter = createWarmthFilter(ctx, 2200);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          // Lower fundamental
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.frequency.value = 500;
          osc1.type = 'triangle';
          osc1.connect(gain1);
          gain1.connect(filter);
          
          // Sub layer
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.frequency.value = 250;
          osc2.type = 'sine';
          osc2.connect(gain2);
          gain2.connect(filter);
          
          // Harmonic shimmer
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.frequency.value = 1000;
          osc3.type = 'sine';
          osc3.connect(gain3);
          gain3.connect(filter);
          
          // Soft envelopes
          gain1.gain.setValueAtTime(0.001, now);
          gain1.gain.linearRampToValueAtTime(0.25, now + 0.006);
          gain1.gain.setTargetAtTime(0.001, now + 0.012, 0.025);
          
          gain2.gain.setValueAtTime(0.001, now);
          gain2.gain.linearRampToValueAtTime(0.12, now + 0.008);
          gain2.gain.setTargetAtTime(0.001, now + 0.015, 0.03);
          
          gain3.gain.setValueAtTime(0.001, now);
          gain3.gain.linearRampToValueAtTime(0.06, now + 0.004);
          gain3.gain.setTargetAtTime(0.001, now + 0.01, 0.015);
          
          osc1.start(now);
          osc2.start(now);
          osc3.start(now);
          osc1.stop(now + 0.1);
          osc2.stop(now + 0.12);
          osc3.stop(now + 0.06);
          break;
        }

        case 'success': {
          // Rich warm chime with shimmer and reverb
          const filter = createWarmthFilter(ctx, 4000);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          const notes = [
            { freq: 523.25, delay: 0, vol: 0.35 },     // C5
            { freq: 659.25, delay: 0.12, vol: 0.30 },  // E5
          ];
          
          notes.forEach(({ freq, delay, vol }) => {
            // Fundamental
            createLayeredTone(ctx, freq, filter, {
              type: 'sine',
              harmonics: [1, 2, 0.5],        // Octave above, octave below
              volumes: [vol, vol * 0.3, vol * 0.4],
              detune: 3,
              startTime: now + delay,
              duration: 0.35,
              attack: 0.018,
              release: 0.12,
              filterCutoff: 3500
            });
            
            // Add triangle layer for warmth
            const warmOsc = ctx.createOscillator();
            const warmGain = ctx.createGain();
            warmOsc.frequency.value = freq * 0.5;
            warmOsc.type = 'triangle';
            warmOsc.connect(warmGain);
            warmGain.connect(filter);
            
            warmGain.gain.setValueAtTime(0.001, now + delay);
            warmGain.gain.linearRampToValueAtTime(vol * 0.25, now + delay + 0.02);
            warmGain.gain.setTargetAtTime(0.001, now + delay + 0.25, 0.08);
            
            warmOsc.start(now + delay);
            warmOsc.stop(now + delay + 0.4);
          });
          break;
        }

        case 'swoosh': {
          // Silky air movement with resonance
          const duration = 0.28;
          const bufferSize = ctx.sampleRate * duration;
          const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
          
          // Stereo noise with smooth envelope
          for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
              const progress = i / bufferSize;
              // Bell curve envelope
              const env = Math.sin(progress * Math.PI) * 0.7;
              data[i] = (Math.random() * 2 - 1) * env;
            }
          }
          
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          
          // Bandpass filter for silky sound
          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(400, now);
          bandpass.frequency.exponentialRampToValueAtTime(2500, now + duration * 0.6);
          bandpass.frequency.exponentialRampToValueAtTime(800, now + duration);
          bandpass.Q.value = 1.2;
          
          // Low-pass for warmth
          const lowpass = createWarmthFilter(ctx, 3500);
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
          gain.gain.setTargetAtTime(0.08, now + 0.1, 0.06);
          gain.gain.setTargetAtTime(0.001, now + duration - 0.05, 0.03);
          
          source.connect(bandpass);
          bandpass.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(dryGain);
          gain.connect(wetGain);
          
          // Add subtle pitched undertone
          const undertone = ctx.createOscillator();
          const undertoneGain = ctx.createGain();
          undertone.frequency.setValueAtTime(180, now);
          undertone.frequency.exponentialRampToValueAtTime(350, now + duration);
          undertone.type = 'sine';
          undertone.connect(undertoneGain);
          undertoneGain.connect(lowpass);
          
          undertoneGain.gain.setValueAtTime(0.001, now);
          undertoneGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          undertoneGain.gain.setTargetAtTime(0.001, now + duration - 0.08, 0.04);
          
          source.start(now);
          undertone.start(now);
          undertone.stop(now + duration + 0.1);
          break;
        }

        case 'reveal': {
          // Cinematic tension builder with depth
          const filter = createWarmthFilter(ctx, 3000);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          // Rising harmonic series
          for (let i = 0; i < 5; i++) {
            const startTime = now + (i * 0.09);
            const baseFreq = 120 + (i * 80);
            
            // Main tone with sub-octave
            createLayeredTone(ctx, baseFreq, filter, {
              type: 'sine',
              harmonics: [1, 0.5, 2],
              volumes: [0.22, 0.15, 0.08],
              detune: 4,
              startTime,
              duration: 0.35 - (i * 0.02),
              attack: 0.025,
              release: 0.1,
              filterCutoff: 2500 + (i * 300)
            });
            
            // Add shimmer on higher notes
            if (i >= 2) {
              const shimmer = ctx.createOscillator();
              const shimmerGain = ctx.createGain();
              shimmer.frequency.value = baseFreq * 3;
              shimmer.type = 'sine';
              shimmer.connect(shimmerGain);
              shimmerGain.connect(filter);
              
              shimmerGain.gain.setValueAtTime(0.001, startTime);
              shimmerGain.gain.linearRampToValueAtTime(0.04, startTime + 0.03);
              shimmerGain.gain.setTargetAtTime(0.001, startTime + 0.15, 0.05);
              
              shimmer.start(startTime);
              shimmer.stop(startTime + 0.3);
            }
          }
          
          // Add subtle noise layer for breath
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.5;
          }
          
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(300, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(1500, now + 0.35);
          noiseFilter.Q.value = 2;
          
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.001, now);
          noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
          noiseGain.gain.setTargetAtTime(0.001, now + 0.3, 0.05);
          
          noiseSource.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(wetGain);
          noiseSource.start(now);
          break;
        }

        case 'complete': {
          // Warm satisfying resolution chord
          const filter = createWarmthFilter(ctx, 3000);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          // Rich major chord with extensions
          const chordNotes = [
            { freq: 261.63, vol: 0.28 },  // C4 (bass)
            { freq: 329.63, vol: 0.22 },  // E4
            { freq: 392.00, vol: 0.22 },  // G4
            { freq: 493.88, vol: 0.15 },  // B4 (major 7th shimmer)
          ];
          
          chordNotes.forEach(({ freq, vol }, i) => {
            const startDelay = i * 0.025;
            
            createLayeredTone(ctx, freq, filter, {
              type: 'triangle',
              harmonics: [1, 0.5],  // Add sub-octave
              volumes: [vol, vol * 0.4],
              detune: 2,
              startTime: now + startDelay,
              duration: 0.5,
              attack: 0.025,
              release: 0.15,
              filterCutoff: 2800
            });
          });
          
          // Deep sub-bass
          const sub = ctx.createOscillator();
          const subGain = ctx.createGain();
          sub.frequency.value = 65.41; // C2
          sub.type = 'sine';
          sub.connect(subGain);
          subGain.connect(filter);
          
          subGain.gain.setValueAtTime(0.001, now);
          subGain.gain.linearRampToValueAtTime(0.18, now + 0.04);
          subGain.gain.setTargetAtTime(0.08, now + 0.15, 0.08);
          subGain.gain.setTargetAtTime(0.001, now + 0.4, 0.1);
          
          sub.start(now);
          sub.stop(now + 0.6);
          break;
        }

        case 'notification': {
          // Gentle warm notification
          const filter = createWarmthFilter(ctx, 2500);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          createLayeredTone(ctx, 660, filter, {
            type: 'sine',
            harmonics: [1, 0.5, 2],
            volumes: [0.28, 0.15, 0.08],
            detune: 3,
            startTime: now,
            duration: 0.2,
            attack: 0.015,
            release: 0.08,
            filterCutoff: 2200
          });
          break;
        }

        case 'error': {
          // Warm but distinct error
          const filter = createWarmthFilter(ctx, 1800);
          filter.connect(dryGain);
          
          // Two discordant low tones
          const freqs = [180, 170];
          freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(filter);
            
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gain.gain.setTargetAtTime(0.001, now + 0.12, 0.04);
            
            osc.start(now);
            osc.stop(now + 0.2);
          });
          break;
        }

        case 'packageSelect': {
          // Premium unlock sensation - rich major chord with shimmer
          const filter = createWarmthFilter(ctx, 4500);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          // A major with 7th
          const notes = [
            { freq: 440.00, vol: 0.32 },    // A4
            { freq: 554.37, vol: 0.26 },    // C#5
            { freq: 659.25, vol: 0.22 },    // E5
            { freq: 830.61, vol: 0.12 },    // G#5 (shimmer)
          ];
          
          notes.forEach(({ freq, vol }, i) => {
            const startDelay = i * 0.015;
            
            createLayeredTone(ctx, freq, filter, {
              type: 'sine',
              harmonics: [1, 2, 0.5],
              volumes: [vol, vol * 0.25, vol * 0.35],
              detune: 4,
              startTime: now + startDelay,
              duration: 0.35,
              attack: 0.012,
              release: 0.1,
              filterCutoff: 3800
            });
          });
          
          // Sub-bass pulse
          const sub = ctx.createOscillator();
          const subGain = ctx.createGain();
          sub.frequency.value = 110; // A2
          sub.type = 'sine';
          sub.connect(subGain);
          subGain.connect(filter);
          
          subGain.gain.setValueAtTime(0.001, now);
          subGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
          subGain.gain.setTargetAtTime(0.001, now + 0.2, 0.08);
          
          sub.start(now);
          sub.stop(now + 0.4);
          break;
        }

        case 'ambientPad': {
          // Luxurious evolving pad with movement
          const filter = createWarmthFilter(ctx, 2000);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          const padNotes = [130.81, 164.81, 196, 246.94]; // Cmaj7
          
          padNotes.forEach((freq, i) => {
            // Main voice with detuned copies
            [-4, 0, 4].forEach((detune) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.value = freq;
              osc.detune.value = detune;
              osc.type = 'sine';
              osc.connect(gain);
              gain.connect(filter);
              
              const vol = (0.08 - i * 0.012) * 0.5;
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.linearRampToValueAtTime(vol, now + 2);
              gain.gain.setValueAtTime(vol, now + 4);
              gain.gain.setTargetAtTime(0.001, now + 4.5, 0.8);
              
              osc.start(now);
              osc.stop(now + 7);
            });
          });
          break;
        }

        case 'celebration': {
          // Triumphant fanfare with depth and shimmer
          const filter = createWarmthFilter(ctx, 5000);
          filter.connect(dryGain);
          filter.connect(wetGain);
          
          // Ascending major arpeggio with octave doubling
          const notes = [
            { freq: 523.25, delay: 0 },      // C5
            { freq: 659.25, delay: 0.1 },    // E5
            { freq: 783.99, delay: 0.2 },    // G5
            { freq: 1046.50, delay: 0.3 },   // C6 (final shimmer)
          ];
          
          notes.forEach(({ freq, delay }, i) => {
            const isLast = i === notes.length - 1;
            const duration = isLast ? 0.55 : 0.4;
            
            // Main note with harmonics
            createLayeredTone(ctx, freq, filter, {
              type: isLast ? 'sine' : 'triangle',
              harmonics: [1, 0.5, 2],
              volumes: [0.35, 0.2, isLast ? 0.15 : 0.08],
              detune: 3,
              startTime: now + delay,
              duration,
              attack: 0.015,
              release: 0.12,
              filterCutoff: 4000
            });
            
            // Sub-octave for warmth
            const sub = ctx.createOscillator();
            const subGain = ctx.createGain();
            sub.frequency.value = freq * 0.5;
            sub.type = 'sine';
            sub.connect(subGain);
            subGain.connect(filter);
            
            subGain.gain.setValueAtTime(0.001, now + delay);
            subGain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
            subGain.gain.setTargetAtTime(0.001, now + delay + duration - 0.1, 0.06);
            
            sub.start(now + delay);
            sub.stop(now + delay + duration + 0.1);
          });
          
          // Final shimmer sparkle on last note
          setTimeout(() => {
            const sparkleFilter = createWarmthFilter(ctx, 8000);
            sparkleFilter.connect(wetGain);
            
            [2093, 2637, 3136].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.value = freq;
              osc.type = 'sine';
              osc.connect(gain);
              gain.connect(sparkleFilter);
              
              const sparkleNow = ctx.currentTime;
              gain.gain.setValueAtTime(0.001, sparkleNow);
              gain.gain.linearRampToValueAtTime(0.05 - i * 0.01, sparkleNow + 0.02);
              gain.gain.setTargetAtTime(0.001, sparkleNow + 0.15, 0.08);
              
              osc.start(sparkleNow);
              osc.stop(sparkleNow + 0.3);
            });
          }, 350);
          break;
        }
      }
    } catch (e) {
      console.debug('Sound effect failed:', e);
    }
  }, [getContext, getReverb, volume]);

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
