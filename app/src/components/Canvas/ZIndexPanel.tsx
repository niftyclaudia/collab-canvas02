import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canvasService } from '../../services/canvasService';

interface ZIndexPanelProps {
  selectedShapeId: string | null;
  onZIndexChange: (operation: string) => void;
}

export function ZIndexPanel({ selectedShapeId, onZIndexChange }: ZIndexPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have a selected shape
  const hasSelection = selectedShapeId !== null;

  const handleBringToFront = async () => {
    if (!user || !selectedShapeId || isLoading) return;
    
    setIsLoading(true);
    try {
      await canvasService.bringToFront(selectedShapeId);
      onZIndexChange('bringToFront');
      showToast('Shape brought to front', 'success');
    } catch (error) {
      console.error('Failed to bring shape to front:', error);
      showToast('Failed to bring shape to front', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToBack = async () => {
    if (!user || !selectedShapeId || isLoading) return;
    
    setIsLoading(true);
    try {
      await canvasService.sendToBack(selectedShapeId);
      onZIndexChange('sendToBack');
      showToast('Shape sent to back', 'success');
    } catch (error) {
      console.error('Failed to send shape to back:', error);
      showToast('Failed to send shape to back', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBringForward = async () => {
    if (!user || !selectedShapeId || isLoading) return;
    
    setIsLoading(true);
    try {
      await canvasService.bringForward(selectedShapeId);
      onZIndexChange('bringForward');
      showToast('Shape brought forward', 'success');
    } catch (error) {
      console.error('Failed to bring shape forward:', error);
      showToast('Failed to bring shape forward', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBackward = async () => {
    if (!user || !selectedShapeId || isLoading) return;
    
    setIsLoading(true);
    try {
      await canvasService.sendBackward(selectedShapeId);
      onZIndexChange('sendBackward');
      showToast('Shape sent backward', 'success');
    } catch (error) {
      console.error('Failed to send shape backward:', error);
      showToast('Failed to send shape backward', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="z-index-panel">
      <div className="z-index-controls">
        <button
          type="button"
          className="z-index-button bring-to-front"
          onClick={handleBringToFront}
          disabled={isLoading}
          title="Bring to Front (Cmd/Ctrl+Shift+])"
        >
          <span style={{fontSize: '16px'}}>⬆️🔝</span>
          <span>{isLoading ? 'Loading...' : 'To Front'}</span>
        </button>
        
        <button
          type="button"
          className="z-index-button send-to-back"
          onClick={handleSendToBack}
          disabled={isLoading}
          title="Send to Back (Cmd/Ctrl+Shift+[)"
        >
          <span style={{fontSize: '16px'}}>⬇️⬇️</span>
          <span>{isLoading ? 'Loading...' : 'To Back'}</span>
        </button>
        
        <button
          type="button"
          className="z-index-button bring-forward"
          onClick={handleBringForward}
          disabled={isLoading}
          title="Bring Forward (Cmd/Ctrl+])"
        >
          <span style={{fontSize: '16px'}}>⬆️</span>
          <span>{isLoading ? 'Loading...' : 'Forward'}</span>
        </button>
        
        <button
          type="button"
          className="z-index-button send-backward"
          onClick={handleSendBackward}
          disabled={isLoading}
          title="Send Backward (Cmd/Ctrl+[)"
        >
          <span style={{fontSize: '16px'}}>⬇️</span>
          <span>{isLoading ? 'Loading...' : 'Backward'}</span>
        </button>
      </div>
    </div>
  );
}

export default ZIndexPanel;
