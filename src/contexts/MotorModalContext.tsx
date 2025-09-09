import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Motor } from '../lib/motor-helpers';

interface ModalState {
  isOpen: boolean;
  selectedMotor: Motor | null;
  motorProps: {
    title?: string;
    subtitle?: string;
    img?: string | null;
    msrp?: number | null;
    price?: number | null;
    promoText?: string | null;
    description?: string | null;
    hp?: number;
    shaft?: string;
    weightLbs?: number | string;
    altOutput?: string;
    steering?: string;
    features?: string[];
    specSheetUrl?: string | null;
    onSelect?: () => void;
  };
}

interface MotorModalContextType extends ModalState {
  openModal: (motor: Motor | null, props: ModalState['motorProps']) => void;
  closeModal: () => void;
}

const MotorModalContext = createContext<MotorModalContextType | undefined>(undefined);

export function MotorModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    selectedMotor: null,
    motorProps: {}
  });

  const openModal = (motor: Motor | null, props: ModalState['motorProps']) => {
    setModalState({
      isOpen: true,
      selectedMotor: motor,
      motorProps: props
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      selectedMotor: null,
      motorProps: {}
    });
  };

  return (
    <MotorModalContext.Provider value={{
      ...modalState,
      openModal,
      closeModal
    }}>
      {children}
    </MotorModalContext.Provider>
  );
}

export function useMotorModal() {
  const context = useContext(MotorModalContext);
  if (context === undefined) {
    throw new Error('useMotorModal must be used within a MotorModalProvider');
  }
  return context;
}