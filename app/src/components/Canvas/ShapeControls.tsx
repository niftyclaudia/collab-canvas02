
interface ShapeControlsProps {
  shapeId: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: (shapeId: string) => void;
  onDuplicate: (shapeId: string) => void;
}

export function ShapeControls({ shapeId, isVisible, position, onDelete, onDuplicate }: ShapeControlsProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="shape-controls-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '8px'
      }}
    >
      <button
        onClick={() => onDelete(shapeId)}
        className="delete-button"
        title="Delete shape"
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        🗑️ Delete
      </button>
      
      <button
        onClick={() => onDuplicate(shapeId)}
        className="duplicate-button"
        title="Duplicate shape"
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        📋 Duplicate
      </button>
    </div>
  );
}
