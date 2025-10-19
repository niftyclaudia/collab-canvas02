import { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { NewCanvasDialog } from './NewCanvasDialog';
import './CanvasSelector.css';

export function CanvasSelector() {
  const {
    currentCanvas,
    availableCanvases,
    isLoadingCanvases,
    switchCanvas,
  } = useCanvas();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isNewCanvasDialogOpen, setIsNewCanvasDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCanvasSwitch = async (canvasId: string) => {
    if (canvasId !== currentCanvas?.id) {
      await switchCanvas(canvasId);
    }
    setIsOpen(false);
  };

  const handleNewCanvas = () => {
    setIsOpen(false);
    setIsNewCanvasDialogOpen(true);
  };

  if (isLoadingCanvases) {
    return (
      <div className="canvas-selector-loading">
        Loading...
      </div>
    );
  }

  if (!currentCanvas) {
    return null;
  }

  return (
    <>
      <div className="canvas-selector" ref={dropdownRef}>
        <button
          className="canvas-selector-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select canvas"
        >
          <span className="canvas-selector-icon">
            {currentCanvas.isShared ? '🌐' : '🔒'}
          </span>
          <span className="canvas-selector-name">
            {currentCanvas.name}
          </span>
          <span className={`canvas-selector-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="canvas-selector-dropdown">
            <div className="canvas-selector-list">
              {availableCanvases.map((canvas) => (
                <button
                  key={canvas.id}
                  className={`canvas-selector-item ${
                    canvas.id === currentCanvas.id ? 'active' : ''
                  }`}
                  onClick={() => handleCanvasSwitch(canvas.id)}
                >
                  <span className="canvas-selector-item-icon">
                    {canvas.isShared ? '🌐' : '🔒'}
                  </span>
                  <span className="canvas-selector-item-name">
                    {canvas.name}
                  </span>
                  {canvas.id === currentCanvas.id && (
                    <span className="canvas-selector-item-check">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="canvas-selector-divider" />
            
            <div className="canvas-selector-actions">
              <button
                className="canvas-selector-action"
                onClick={handleNewCanvas}
              >
                <span className="canvas-selector-action-icon">+</span>
                New Canvas
              </button>
            </div>
          </div>
        )}
      </div>

      <NewCanvasDialog
        isOpen={isNewCanvasDialogOpen}
        onClose={() => setIsNewCanvasDialogOpen(false)}
      />
    </>
  );
}

export default CanvasSelector;

