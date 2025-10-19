import { useCanvas } from '../../hooks/useCanvas';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { canvasService } from '../../services/canvasService';
// Custom SVG Icon Components

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






export function LeftToolbar() {
  const { 
    mode, 
    setMode, 
    activeTool, 
    setActiveTool, 
    selectedColor, 
    setSelectedColor,
    selectedShapes,
    setSelectedShapes,
    shapes,
    selectedTextFormatting,
    applyBoldFormatting,
    applyItalicFormatting,
    applyUnderlineFormatting,
    applyFontSizeFormatting,
    clearCanvas,
    editingTextId,
    groupShapes,
    ungroupShapes
  } = useCanvas();

  const { user } = useAuth();
  const { showToast } = useToast();

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
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

  // Show text formatting toolbar when text is being edited or when text tool is active
  const shouldShowTextFormatting = Boolean(editingTextId) || activeTool === 'text';
  
  // Enable formatting buttons when text is being edited, disable when text tool is active but no text is being edited
  const isTextBeingEdited = Boolean(editingTextId);
  const shouldDisableFormatting = !isTextBeingEdited && shouldShowTextFormatting;

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

  // Handle group action
  const handleGroup = async () => {
    if (selectedShapes.length < 2) return;
    
    try {
      await groupShapes(selectedShapes);
    } catch (error) {
      console.error('Failed to group shapes:', error);
      // Error handling is done in the context
    }
  };

  // Handle ungroup action
  const handleUngroup = async () => {
    if (selectedShapes.length === 0) {
      showToast('No shapes selected to ungroup', 'error');
      return;
    }
    
    // Find the group ID from the first selected shape
    const firstSelectedShape = shapes.find(s => s.id === selectedShapes[0]);
    if (!firstSelectedShape || !firstSelectedShape.groupId) {
      showToast('Selected shapes are not in a group', 'error');
      return;
    }
    
    try {
      await ungroupShapes(firstSelectedShape.groupId);
      // Clear selection after ungrouping
      setSelectedShapes([]);
    } catch (error) {
      console.error('Failed to ungroup shapes:', error);
      // Error handling is done in the context
    }
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

  // Handle disabled formatting button clicks
  const handleDisabledFormattingClick = () => {
    showToast('Double-click on text input field to use formatting', 'info');
  };

  // Handle formatting button clicks to prevent focus loss
  const handleFormattingClick = (formattingFunction: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    formattingFunction();
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

        {/* Section 4: Text Formatting (only visible when text selected or editing) */}
        {shouldShowTextFormatting && (
          <>
            <div className="toolbar-section">
              <div className="text-formatting">
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.fontWeight === 'bold' ? 'active' : ''} ${shouldDisableFormatting ? 'disabled' : ''}`}
                  onClick={shouldDisableFormatting ? handleDisabledFormattingClick : handleFormattingClick(applyBoldFormatting)}
                  disabled={shouldDisableFormatting}
                  title={shouldDisableFormatting ? "Double-click on text to enable formatting" : "Bold (Cmd+B)"}
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.fontStyle === 'italic' ? 'active' : ''} ${shouldDisableFormatting ? 'disabled' : ''}`}
                  onClick={shouldDisableFormatting ? handleDisabledFormattingClick : handleFormattingClick(applyItalicFormatting)}
                  disabled={shouldDisableFormatting}
                  title={shouldDisableFormatting ? "Double-click on text to enable formatting" : "Italic (Cmd+I)"}
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={`toolbar-icon-button ${selectedTextFormatting.textDecoration === 'underline' ? 'active' : ''} ${shouldDisableFormatting ? 'disabled' : ''}`}
                  onClick={shouldDisableFormatting ? handleDisabledFormattingClick : handleFormattingClick(applyUnderlineFormatting)}
                  disabled={shouldDisableFormatting}
                  title={shouldDisableFormatting ? "Double-click on text to enable formatting" : "Underline (Cmd+U)"}
                >
                  <u>U</u>
                </button>
                <select
                  value={selectedTextFormatting.fontSize}
                  onChange={(e) => shouldDisableFormatting ? undefined : applyFontSizeFormatting(parseInt(e.target.value))}
                  onClick={shouldDisableFormatting ? handleDisabledFormattingClick : (e) => e.stopPropagation()}
                  disabled={shouldDisableFormatting}
                  className={`font-size-select ${shouldDisableFormatting ? 'disabled' : ''}`}
                  title={shouldDisableFormatting ? "Double-click on text to enable formatting" : "Font Size"}
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
        </div>

        {/* Section 6: Grouping Tools */}
        {(() => {
          // Check if selected shapes are in a group
          const selectedShapesInGroup = selectedShapes.filter(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            return shape && shape.groupId;
          });
          
          // Check if ALL selected shapes are in the same group
          const allShapesInSameGroup = selectedShapes.length > 0 && 
            selectedShapesInGroup.length === selectedShapes.length &&
            selectedShapesInGroup.length > 0;
          
          // Get the group ID to verify all shapes are in the same group
          let allInSameGroup = false;
          if (allShapesInSameGroup) {
            const firstShape = shapes.find(s => s.id === selectedShapes[0]);
            const groupId = firstShape?.groupId;
            allInSameGroup = Boolean(groupId && selectedShapes.every(shapeId => {
              const shape = shapes.find(s => s.id === shapeId);
              return shape && shape.groupId === groupId;
            }));
          }
          
          const canGroup = selectedShapes.length >= 2 && !allInSameGroup;
          const canUngroup = allInSameGroup;
          
          console.log('LeftToolbar grouping logic:', {
            selectedShapes,
            selectedShapesInGroup: selectedShapesInGroup.length,
            allShapesInSameGroup,
            allInSameGroup,
            canGroup,
            canUngroup
          });
          
          if (!canGroup && !canUngroup) return null;
          
          return (
            <div className="toolbar-section">
              {canGroup && (
                <button
                  type="button"
                  className="toolbar-icon-button"
                  onClick={handleGroup}
                  title="Group selected shapes (Cmd/Ctrl+G)"
                >
                  <span style={{fontSize: '18px'}}>🔒</span>
                </button>
              )}
              {canUngroup && (
                <button
                  type="button"
                  className="toolbar-icon-button"
                  onClick={handleUngroup}
                  title="Ungroup selected shapes (Cmd/Ctrl+Shift+G)"
                >
                  <span style={{fontSize: '18px'}}>🔓</span>
                </button>
              )}
            </div>
          );
        })()}

        <div className="toolbar-divider"></div>

        {/* Section 6: Z-Index Controls - Show when a single shape is selected */}
        {(() => {
          if (selectedShapes.length !== 1) return null;
          
          const handleBringToFront = async () => {
            if (!user || selectedShapes.length === 0) return;
            try {
              await canvasService.bringToFront(selectedShapes[0]);
              showToast('Shape brought to front', 'success');
            } catch (error) {
              console.error('Failed to bring shape to front:', error);
              showToast('Failed to bring shape to front', 'error');
            }
          };

          const handleSendToBack = async () => {
            if (!user || selectedShapes.length === 0) return;
            try {
              await canvasService.sendToBack(selectedShapes[0]);
              showToast('Shape sent to back', 'success');
            } catch (error) {
              console.error('Failed to send shape to back:', error);
              showToast('Failed to send shape to back', 'error');
            }
          };

          const handleBringForward = async () => {
            if (!user || selectedShapes.length === 0) return;
            try {
              await canvasService.bringForward(selectedShapes[0]);
              showToast('Shape brought forward', 'success');
            } catch (error) {
              console.error('Failed to bring shape forward:', error);
              showToast('Failed to bring shape forward', 'error');
            }
          };

          const handleSendBackward = async () => {
            if (!user || selectedShapes.length === 0) return;
            try {
              await canvasService.sendBackward(selectedShapes[0]);
              showToast('Shape sent backward', 'success');
            } catch (error) {
              console.error('Failed to send shape backward:', error);
              showToast('Failed to send shape backward', 'error');
            }
          };

          return (
            <div className="toolbar-section">
              <button
                type="button"
                className="toolbar-icon-button"
                onClick={handleBringToFront}
                title="Bring to Front (Cmd/Ctrl+Shift+])"
              >
                <span style={{fontSize: '18px'}}>⬆️🔝</span>
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                onClick={handleSendToBack}
                title="Send to Back (Cmd/Ctrl+Shift+[)"
              >
                <span style={{fontSize: '18px'}}>⬇️⬇️</span>
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                onClick={handleBringForward}
                title="Bring Forward (Cmd/Ctrl+])"
              >
                <span style={{fontSize: '18px'}}>⬆️</span>
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                onClick={handleSendBackward}
                title="Send Backward (Cmd/Ctrl+[)"
              >
                <span style={{fontSize: '18px'}}>⬇️</span>
              </button>
            </div>
          );
        })()}

        <div className="toolbar-divider"></div>

        {/* Section 7: Canvas Actions */}
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
