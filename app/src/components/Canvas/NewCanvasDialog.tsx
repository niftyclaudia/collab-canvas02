import { useState } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import './NewCanvasDialog.css';

interface NewCanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewCanvasDialog({ isOpen, onClose }: NewCanvasDialogProps) {
  const { createNewCanvas } = useCanvas();
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      await createNewCanvas(name.trim(), isShared);
      setName('');
      setIsShared(true);
      onClose();
    } catch (error) {
      console.error('Failed to create canvas:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setIsShared(true);
      onClose();
    }
  };

  return (
    <div className="new-canvas-dialog-overlay" onClick={handleClose}>
      <div className="new-canvas-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="new-canvas-dialog-header">
          <h2>Create New Canvas</h2>
          <button
            className="new-canvas-dialog-close"
            onClick={handleClose}
            disabled={isCreating}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form id="new-canvas-form" onSubmit={handleSubmit} className="new-canvas-dialog-form">
          <div className="new-canvas-dialog-field">
            <label htmlFor="canvas-name">Canvas Name</label>
            <input
              id="canvas-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter canvas name..."
              autoFocus
              disabled={isCreating}
              required
            />
          </div>

          <div className="new-canvas-dialog-field">
            <label className="new-canvas-dialog-toggle">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                disabled={isCreating}
              />
              <span className="new-canvas-dialog-toggle-label">
                <span className="new-canvas-dialog-toggle-icon">
                  {isShared ? '🌐' : '🔒'}
                </span>
                <span>
                  {isShared ? 'Shared (Visible to all users)' : 'Private (Only you can see)'}
                </span>
              </span>
            </label>
          </div>
        </form>

        <div className="new-canvas-dialog-footer">
          <div className="new-canvas-dialog-actions">
            <button
              type="button"
              className="new-canvas-dialog-button cancel"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-canvas-form"
              className="new-canvas-dialog-button create"
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Canvas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewCanvasDialog;

