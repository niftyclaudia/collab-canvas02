import { useCanvas } from '../../hooks/useCanvas';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { canvasService } from '../../services/canvasService';
import { AI_COLOR_PALETTE } from '../../utils/constants';
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

const HandIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2"/>
    <path d="M4 14v-3a2 2 0 0 1 2-2h2"/>
  </svg>
);

const PencilIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const TrashIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

const BroomIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 7v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/>
    <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/>
    <path d="M12 3v18"/>
    <path d="M8 3l4-4 4 4"/>
  </svg>
);






interface LeftToolbarProps {}

export function LeftToolbar({}: LeftToolbarProps) {
  const isExpanded = true; // Always expanded for desktop
  
  const { 
    mode, 
    setMode, 
    activeTool, 
    setActiveTool, 
    selectedColor, 
    setSelectedColor,
    selectedShapes,
    selectedTextFormatting,
    applyBoldFormatting,
    applyItalicFormatting,
    applyUnderlineFormatting,
    applyFontSizeFormatting,
    clearCanvas,
    editingTextId
  } = useCanvas();

  const { user } = useAuth();
  const { showToast } = useToast();

  const colors = AI_COLOR_PALETTE;

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
    
    if (window.confirm(`Are you sure you want to delete ${selectedShapes.length} shape${selectedShapes.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedShapes.map(shapeId => canvasService.deleteShape(shapeId)));
        showToast('Shapes deleted', 'success');
      } catch (error) {
        console.error('Failed to delete shapes:', error);
        showToast('Failed to delete shapes', 'error');
      }
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

  // Handle all button clicks to prevent event bubbling
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`left-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="toolbar-container">
        
        
        {/* Section 1: Mode Tools */}
        <div className="toolbar-section">
          <button
            type="button"
            className={`toolbar-icon-button ${mode === 'select' ? 'active' : ''}`}
            onClick={(e) => {
              handleButtonClick(e);
              setMode('select');
            }}
            title="Select mode - click to select shapes, drag to move canvas"
            aria-label="Select mode - click to select shapes, drag to move canvas"
          >
            <HandIcon size={18} />
            {isExpanded && <span className="toolbar-icon-label">Select</span>}
          </button>
          <button
            type="button"
            className={`toolbar-icon-button ${mode === 'create' ? 'active' : ''}`}
            onClick={(e) => {
              handleButtonClick(e);
              setMode('create');
            }}
            title="Create mode - click and drag to create shapes"
            aria-label="Create mode - click and drag to create shapes"
          >
            <PencilIcon size={18} />
            {isExpanded && <span className="toolbar-icon-label">Create</span>}
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Section 2: Shape Tools (only visible in create mode) */}
        {mode === 'create' && (
          <>
            <div className="toolbar-section">
              {shapeTools.map((tool) => {
                return (
                  <button
                    key={tool.value}
                    type="button"
                    className={`toolbar-icon-button ${activeTool === tool.value ? 'active' : ''}`}
                    onClick={(e) => {
                      handleButtonClick(e);
                      setActiveTool(tool.value as any);
                    }}
                    title={`Create ${tool.name}`}
                  >
                    {tool.value === 'rectangle' && <SquareIcon size={18} />}
                    {tool.value === 'circle' && <CircleIcon size={18} />}
                    {tool.value === 'triangle' && <TriangleIcon size={18} />}
                    {tool.value === 'text' && <TypeIcon size={18} />}
                    {isExpanded && <span className="toolbar-icon-label">{tool.name}</span>}
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
                onClick={(e) => {
                  handleButtonClick(e);
                  setSelectedColor(color.value);
                }}
                title={`Select ${color.name} (${color.value})`}
              >
                {selectedColor === color.value && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-divider"></div>

        {/* Section 4: Text Formatting (always visible) */}
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

        {/* Section 5: Action Tools */}
        <div className="toolbar-section">
          <button
            type="button"
            className={`toolbar-icon-button ${selectedShapes.length === 0 ? 'disabled' : ''}`}
            onClick={(e) => {
              handleButtonClick(e);
              handleDuplicate();
            }}
            disabled={selectedShapes.length === 0}
            title="Duplicate selected shapes (Cmd+D)"
          >
            <CopyIcon size={18} />
            {isExpanded && <span className="toolbar-icon-label">Duplicate</span>}
          </button>
        </div>

        <div className="toolbar-divider destructive-divider"></div>

        {/* Section 6: Destructive Actions */}
        <div className="toolbar-section destructive-section">
          <button
            type="button"
            className={`toolbar-icon-button ${selectedShapes.length === 0 ? 'disabled' : ''}`}
            onClick={(e) => {
              handleButtonClick(e);
              handleDelete();
            }}
            disabled={selectedShapes.length === 0}
            title="Delete selected shapes (Del)"
          >
            <TrashIcon size={18} />
            {isExpanded && <span className="toolbar-icon-label">Delete</span>}
          </button>
          <button
            type="button"
            className="toolbar-icon-button clear-canvas"
            onClick={(e) => {
              handleButtonClick(e);
              handleClearCanvas();
            }}
            title="Clear all shapes from canvas"
          >
            <BroomIcon size={18} />
            {isExpanded && <span className="toolbar-icon-label">Clear Canvas</span>}
          </button>
        </div>

      </div>
    </div>
  );
}

export default LeftToolbar;
