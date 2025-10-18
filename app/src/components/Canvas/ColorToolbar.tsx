import { useCanvas } from '../../hooks/useCanvas';
import { SHAPE_COLORS } from '../../utils/constants';

export function ColorToolbar() {
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
    applyFontSizeFormatting
  } = useCanvas();

  const colors = [
    { name: 'Red', value: SHAPE_COLORS.RED },
    { name: 'Blue', value: SHAPE_COLORS.BLUE },
    { name: 'Green', value: SHAPE_COLORS.GREEN },
    { name: 'Yellow', value: SHAPE_COLORS.YELLOW },
  ];

  const shapeTools = [
    { name: 'Rectangle', value: 'rectangle', icon: '🟥' },
    { name: 'Circle', value: 'circle', icon: '🔴' },
    { name: 'Triangle', value: 'triangle', icon: '🔺' },
    { name: 'Text', value: 'text', icon: '📝' },
  ];

  // Check if a text shape is selected
  const selectedTextShape = selectedShapes.length === 1 
    ? shapes.find(shape => shape.id === selectedShapes[0] && shape.type === 'text')
    : null;

  const fontSizes = [12, 16, 20, 24, 32, 40, 48];


  return (
    <div className="color-toolbar">
      <div className="color-toolbar-container">
        {/* Mode Switcher */}
        <h3 className="toolbar-title">Mode</h3>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-button ${mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
            title="Select mode - click to select shapes, drag to move canvas"
          >
            👆
          </button>
          <button
            type="button"
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
            title="Create mode - click and drag to create shapes"
          >
            ✏️
          </button>
        </div>

        {/* Shape Tools - Only show when in create mode */}
        {mode === 'create' && (
          <>
            <h3 className="toolbar-title">Shapes</h3>
            <div className="shape-tool-buttons">
              {shapeTools.map((tool) => (
                <button
                  key={tool.value}
                  type="button"
                  className={`shape-tool-button ${activeTool === tool.value ? 'active' : ''}`}
                  onClick={() => setActiveTool(tool.value as any)}
                  title={`Create ${tool.name}`}
                  aria-label={`Select ${tool.name} tool`}
                >
                  <span className="tool-icon" aria-hidden="true">
                    {tool.icon}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Color Selection */}
        <h3 className="toolbar-title">Colors</h3>
        <div className="color-buttons">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`color-button ${selectedColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => setSelectedColor(color.value)}
              title={`Select ${color.name}`}
              aria-label={`Select ${color.name} color`}
            >
              {selectedColor === color.value && (
                <span className="checkmark" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Text Formatting - Only show when a text shape is selected */}
        {selectedTextShape && (
          <>
            <h3 className="toolbar-title">Text Formatting</h3>
            <div className="formatting-controls">
              {/* Bold, Italic, Underline buttons */}
              <div className="formatting-buttons">
                <button
                  type="button"
                  className={`formatting-button ${selectedTextFormatting.fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={applyBoldFormatting}
                  title="Bold (Cmd+B)"
                  aria-label="Toggle bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={`formatting-button ${selectedTextFormatting.fontStyle === 'italic' ? 'active' : ''}`}
                  onClick={applyItalicFormatting}
                  title="Italic (Cmd+I)"
                  aria-label="Toggle italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={`formatting-button ${selectedTextFormatting.textDecoration === 'underline' ? 'active' : ''}`}
                  onClick={applyUnderlineFormatting}
                  title="Underline (Cmd+U)"
                  aria-label="Toggle underline"
                >
                  <u>U</u>
                </button>
              </div>

              {/* Font Size Dropdown */}
              <div className="font-size-section">
                <label htmlFor="font-size-select" className="font-size-label">Size:</label>
                <select
                  id="font-size-select"
                  value={selectedTextFormatting.fontSize}
                  onChange={(e) => applyFontSizeFormatting(parseInt(e.target.value))}
                  className="font-size-select"
                  title="Font Size"
                  aria-label="Font size"
                >
                  {fontSizes.map(size => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ColorToolbar;
