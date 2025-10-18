import React from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { SHAPE_COLORS } from '../../utils/constants';
import { canvasService } from '../../services/canvasService';
// Custom SVG Icon Components
const HandIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M6 10v-2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
  </svg>
);

const SquareIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
);

const CircleIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const TriangleIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
  </svg>
);

const TypeIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="4,7 4,4 20,4 20,7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const TrashIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const CopyIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const LockIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const UnlockIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const EraserIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M7 21l4-4m0 0l4-4m-4 4L7 17m4 4l4-4"/>
    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
  </svg>
);

export function LeftToolbar() {
  const { 
    mode, 
    setMode, 
    activeTool, 
    setActiveTool, 
    selectedColor, 
    setSelectedColor,
    selectedShapes,
    shapes,
    selectedTextFormatting,
    applyBoldFormatting,
    applyItalicFormatting,
    applyUnderlineFormatting,
    applyFontSizeFormatting,
    clearCanvas
  } = useCanvas();

  const { user } = useAuth();
  const { showToast } = useToast();

  const colors = [
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
  ];

  const shapeTools = [
    { 
      name: 'Rectangle', 
      value: 'rectangle', 
      icon: SquareIcon
    },
    { 
      name: 'Circle', 
      value: 'circle', 
      icon: CircleIcon
    },
    { 
      name: 'Triangle', 
      value: 'triangle', 
      icon: TriangleIcon
    },
    { 
      name: 'Text', 
      value: 'text', 
      icon: TypeIcon
    },
  ];

  const fontSizes = [12, 16, 20, 24, 32, 40, 48];

  // Check if a text shape is selected
  const selectedTextShape = selectedShapes.length === 1 
    ? shapes.find(shape => shape.id === selectedShapes[0] && shape.type === 'text')
    : null;

  // Handle delete action
  const handleDelete = async () => {
    if (selectedShapes.length === 0) return;
    
    try {
      await Promise.all(selectedShapes.map(shapeId => canvasService.deleteShape(shapeId)));
      showToast('Shapes deleted', 'success');
    } catch (error) {
      console.error('Failed to delete shapes:', error);
      showToast('Failed to delete shapes', 'error');
    }
  };

  // Handle duplicate action
  const handleDuplicate = async () => {
    if (selectedShapes.length === 0 || !user) return;
    
    try {
      await Promise.all(selectedShapes.map(shapeId => canvasService.duplicateShape(shapeId, user.uid)));
      showToast('Shapes duplicated', 'success');
    } catch (error) {
      console.error('Failed to duplicate shapes:', error);
      showToast('Failed to duplicate shapes', 'error');
    }
  };

  // Handle lock placeholder
  const handleLock = () => {
    showToast('Lock feature coming soon', 'info');
  };

  // Handle unlock placeholder
  const handleUnlock = () => {
    showToast('Unlock feature coming soon', 'info');
  };

  // Handle clear canvas
  const handleClearCanvas = async () => {
    if (window.confirm('Are you sure you want to clear all shapes from the canvas? This action cannot be undone.')) {
      try {
        await clearCanvas();
        showToast('Canvas cleared', 'success');
      } catch (error) {
        console.error('Clear canvas error:', error);
        showToast('Failed to clear canvas', 'error');
      }
    }
  };

  return (
    <div className="left-toolbar">
      <div className="toolbar-container">
        
        {/* Section 1: Mode Tools */}
        <div className="toolbar-section">
          <button
            type="button"
            className={`toolbar-icon-button ${mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
            title="Select mode - click to select shapes, drag to move canvas"
          >
            <span style={{fontSize: '18px'}}>✋</span>
          </button>
          <button
            type="button"
            className={`toolbar-icon-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
            title="Create mode - click and drag to create shapes"
          >
            <span style={{fontSize: '18px'}}>✏️</span>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Section 2: Shape Tools (only visible in create mode) */}
        {mode === 'create' && (
          <>
            <div className="toolbar-section">
              {shapeTools.slice(0, 2).map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.value}
                    type="button"
                    className={`toolbar-icon-button ${activeTool === tool.value ? 'active' : ''}`}
                    onClick={() => setActiveTool(tool.value as any)}
                    title={`Create ${tool.name}`}
                  >
                    <span style={{fontSize: '18px'}}>
                      {tool.value === 'rectangle' && '🟥'}
                      {tool.value === 'circle' && '⭕'}
                      {tool.value === 'triangle' && '🔺'}
                      {tool.value === 'text' && 'T'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="toolbar-section">
              {shapeTools.slice(2, 4).map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.value}
                    type="button"
                    className={`toolbar-icon-button ${activeTool === tool.value ? 'active' : ''}`}
                    onClick={() => setActiveTool(tool.value as any)}
                    title={`Create ${tool.name}`}
                  >
                    <span style={{fontSize: '18px'}}>
                      {tool.value === 'rectangle' && '🟥'}
                      {tool.value === 'circle' && '⭕'}
                      {tool.value === 'triangle' && '🔺'}
                      {tool.value === 'text' && 'T'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="toolbar-divider"></div>
          </>
        )}

        {/* Section 3: Color Palette */}
        <div className="toolbar-section">
          <div className="color-palette">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`color-button ${selectedColor === color.value ? 'active' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                title={`Select ${color.name}`}
              >
                {selectedColor === color.value && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-divider"></div>

        {/* Section 4: Text Formatting (only visible when text selected) */}
        {selectedTextShape && (
          <>
            <div className="toolbar-section">
              <div className="text-formatting">
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={applyBoldFormatting}
                  title="Bold (Cmd+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.fontStyle === 'italic' ? 'active' : ''}`}
                  onClick={applyItalicFormatting}
                  title="Italic (Cmd+I)"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.textDecoration === 'underline' ? 'active' : ''}`}
                  onClick={applyUnderlineFormatting}
                  title="Underline (Cmd+U)"
                >
                  <u>U</u>
                </button>
                <select
                  value={selectedTextFormatting.fontSize}
                  onChange={(e) => applyFontSizeFormatting(parseInt(e.target.value))}
                  className="font-size-select"
                  title="Font Size"
                >
                  {fontSizes.map(size => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="toolbar-divider"></div>
          </>
        )}

        {/* Section 5: Action Tools */}
        <div className="toolbar-section">
          <button
            type="button"
            className={`toolbar-icon-button ${selectedShapes.length === 0 ? 'disabled' : ''}`}
            onClick={handleDelete}
            disabled={selectedShapes.length === 0}
            title="Delete selected shapes"
          >
            <span style={{fontSize: '18px'}}>🗑️</span>
          </button>
          <button
            type="button"
            className={`toolbar-icon-button ${selectedShapes.length === 0 ? 'disabled' : ''}`}
            onClick={handleDuplicate}
            disabled={selectedShapes.length === 0}
            title="Duplicate selected shapes"
          >
            <span style={{fontSize: '18px'}}>📋</span>
          </button>
          <button
            type="button"
            className="toolbar-icon-button disabled"
            onClick={handleLock}
            title="Lock feature coming soon"
          >
            <span style={{fontSize: '18px'}}>🔒</span>
          </button>
          <button
            type="button"
            className="toolbar-icon-button disabled"
            onClick={handleUnlock}
            title="Unlock feature coming soon"
          >
            <span style={{fontSize: '18px'}}>🔓</span>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Section 6: Canvas Actions */}
        <div className="toolbar-section">
          <button
            type="button"
            className="toolbar-icon-button clear-canvas"
            onClick={handleClearCanvas}
            title="Clear all shapes from canvas"
          >
            <span style={{fontSize: '18px'}}>🧹</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default LeftToolbar;
