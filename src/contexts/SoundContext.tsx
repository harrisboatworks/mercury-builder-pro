import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSoundEffects, type SoundType } from '@/hooks/useSoundEffects';

interface SoundContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  playSound: (type: SoundType) => void;
  playClick: () => void;
  playSuccess: () => void;
  playSwoosh: () => void;
  playReveal: () => void;
  playTick: () => void;
  playComplete: () => void;
  playPackageSelect: () => void;
  playAmbientPad: () => void;
  playCelebration: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    // Check localStorage for preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sound-effects-enabled');
      return stored !== 'false'; // Default to true
    }
    return true;
  });

  const sounds = useSoundEffects({ enabled, volume: 0.25 });

  const handleSetEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound-effects-enabled', String(value));
    }
  }, []);

  const toggle = useCallback(() => {
    handleSetEnabled(!enabled);
  }, [enabled, handleSetEnabled]);

  return (
    <SoundContext.Provider
      value={{
        enabled,
        setEnabled: handleSetEnabled,
        toggle,
        playSound: sounds.playSound,
        playClick: sounds.playClick,
        playSuccess: sounds.playSuccess,
        playSwoosh: sounds.playSwoosh,
        playReveal: sounds.playReveal,
        playTick: sounds.playTick,
        playComplete: sounds.playComplete,
        playPackageSelect: sounds.playPackageSelect,
        playAmbientPad: sounds.playAmbientPad,
        playCelebration: sounds.playCelebration,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return no-op functions if used outside provider
    return {
      enabled: false,
      setEnabled: () => {},
      toggle: () => {},
      playSound: () => {},
      playClick: () => {},
      playSuccess: () => {},
      playSwoosh: () => {},
      playReveal: () => {},
      playTick: () => {},
      playComplete: () => {},
      playPackageSelect: () => {},
      playAmbientPad: () => {},
      playCelebration: () => {},
    };
  }
  return context;
}
