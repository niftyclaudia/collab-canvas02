import { useContext } from 'react';
import { CanvasContext } from '../contexts/CanvasContext';

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}
