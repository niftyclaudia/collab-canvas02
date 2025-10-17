import { useCanvas } from '../../hooks/useCanvas';
import { SHAPE_COLORS } from '../../utils/constants';

export function ColorToolbar() {
  const { mode, setMode, activeTool, setActiveTool, selectedColor, setSelectedColor } = useCanvas();

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
  ];


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

      </div>
    </div>
  );
}

export default ColorToolbar;
