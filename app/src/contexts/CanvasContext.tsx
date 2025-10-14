import React, { createContext, useState } from 'react';
import { DEFAULT_SHAPE_COLOR } from '../utils/constants';

export interface CanvasState {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

export const CanvasContext = createContext<CanvasState | undefined>(undefined);

interface CanvasProviderProps {
  children: React.ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SHAPE_COLOR);

  const value: CanvasState = {
    selectedColor,
    setSelectedColor,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
