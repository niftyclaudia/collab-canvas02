import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TextEditorOverlayProps {
  shapeId: string;
  initialText: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  zoom: number;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Text Editor Overlay Component
 * Renders an HTML input overlay positioned exactly over Konva text
 * for seamless in-place editing experience
 */
export const TextEditorOverlay: React.FC<TextEditorOverlayProps> = ({
  initialText,
  position,
  fontSize,
  fontFamily,
  color,
  zoom,
  onTextChange,
  onSave,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialText);

  // Update text when initialText changes (for double-click editing)
  useEffect(() => {
    setText(initialText);
  }, [initialText]);
  
  // Initialize width based on initial text
  const calculateInitialWidth = (text: string, fontSize: number, fontFamily: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 100;
    
    context.font = `${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);
    return Math.max(metrics.width + 20, 100);
  };
  
  const [inputWidth, setInputWidth] = useState(() => 
    calculateInitialWidth(initialText, fontSize, fontFamily)
  );

  // Function to calculate text width
  const calculateTextWidth = (text: string, fontSize: number, fontFamily: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 100;
    
    // Set font to match the input styling
    context.font = `${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);
    
    // Add generous padding for border and extra space to prevent text cutoff
    const padding = 40; // Increased padding to ensure no text cutoff
    const minWidth = 100;
    const calculatedWidth = metrics.width + padding;
    
    // Ensure we have enough space for the full text
    return Math.max(calculatedWidth, minWidth);
  };

  // Update width when text changes
  useEffect(() => {
    const newWidth = calculateTextWidth(text, fontSize, fontFamily);
    setInputWidth(prevWidth => {
      // Only update if width actually changed to prevent unnecessary re-renders
      if (Math.abs(newWidth - prevWidth) > 1) {
        return newWidth;
      }
      return prevWidth;
    });
  }, [text, fontSize, fontFamily]);

  // Auto-focus and select all text on mount
  useEffect(() => {
    if (inputRef.current) {
      // Use setTimeout to ensure the input is fully rendered before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select all text for easy replacement (standard double-click behavior)
          inputRef.current.select();
        }
      }, 0);
    }
  }, []);

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop all keyboard events from bubbling up to the canvas
    e.stopPropagation();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      // Allow Tab to work normally for text editing
      // Don't prevent default to allow cursor movement
    }
    // For all other keys (including backspace, delete, arrow keys, etc.):
    // - Don't prevent default to allow normal text editing
    // - stopPropagation() prevents canvas from handling these events
    // - This allows backspace to delete text instead of deleting the object
  };

  // Handle keyup events to ensure all keyboard events are captured
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop all keyboard events from bubbling up to the canvas
    e.stopPropagation();
  };

  // Handle focus to ensure input captures all keyboard events
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  // Handle blur to save changes when focus is lost
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Save changes when focus is lost (user clicked outside)
    onSave();
  };

  // Stop all event propagation to prevent canvas interactions
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseDown = stopPropagation;
  const handleMouseMove = stopPropagation;
  const handleMouseUp = stopPropagation;
  const handleWheel = stopPropagation;
  const handleClick = stopPropagation;
  const handleDoubleClick = stopPropagation;

  // Calculate overlay position accounting for zoom
  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: inputWidth,
    fontFamily,
    fontSize: fontSize,
    color,
    background: 'transparent',
    border: '2px solid #4A90E2',
    borderRadius: '2px',
    padding: '2px 4px',
    outline: 'none',
    transformOrigin: 'top left',
    transform: `scale(${zoom})`,
    zIndex: 1000,
    boxSizing: 'border-box',
  };

  return createPortal(
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={handleTextChange}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={overlayStyle}
      role="textbox"
      aria-label="Edit text"
      maxLength={1000}
      autoComplete="off"
      spellCheck="false"
    />,
    document.body
  );
};

export default TextEditorOverlay;
