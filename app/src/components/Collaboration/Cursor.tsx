
interface CursorProps {
  x: number;
  y: number;
  username: string;
  color: string;
  isVisible: boolean;
}

export function Cursor({ x, y, username, color, isVisible }: CursorProps) {
  if (!isVisible) return null;

  return (
    <div
      className="remote-cursor"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translate(-2px, -2px)', // Offset cursor tip
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Username label */}
      <div
        className="cursor-label"
        style={{
          position: 'absolute',
          left: '12px',
          top: '-2px',
          backgroundColor: color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {username}
      </div>
    </div>
  );
}

export default Cursor;
