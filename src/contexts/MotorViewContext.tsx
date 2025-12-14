import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ViewMode = 'simple' | 'expert';

interface MotorViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const MotorViewContext = createContext<MotorViewContextType | undefined>(undefined);

const STORAGE_KEY = 'motor_view_mode';

export function MotorViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'expert' || stored === 'simple') {
        return stored;
      }
    }
    return 'simple'; // Default to simple mode for new users
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <MotorViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </MotorViewContext.Provider>
  );
}

export function useMotorView() {
  const context = useContext(MotorViewContext);
  if (context === undefined) {
    throw new Error('useMotorView must be used within a MotorViewProvider');
  }
  return context;
}
