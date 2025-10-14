import React from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { SHAPE_COLORS } from '../../utils/constants';

export function ColorToolbar() {
  const { mode, setMode, selectedColor, setSelectedColor } = useCanvas();

  const colors = [
    { name: 'Red', value: SHAPE_COLORS.RED },
    { name: 'Blue', value: SHAPE_COLORS.BLUE },
    { name: 'Green', value: SHAPE_COLORS.GREEN },
    { name: 'Yellow', value: SHAPE_COLORS.YELLOW },
  ];

  return (
    <div className="color-toolbar">
      <div className="color-toolbar-container">
        {/* Mode Switcher */}
        <h3 className="toolbar-title">Mode</h3>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-button ${mode === 'pan' ? 'active' : ''}`}
            onClick={() => setMode('pan')}
            title="Pan mode - drag to move around the canvas"
          >
            🤚 Pan
          </button>
          <button
            type="button"
            className={`mode-button ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
            title="Create mode - click and drag to create rectangles"
          >
            ✏️ Create
          </button>
        </div>

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
