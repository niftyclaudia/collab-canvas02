// Canvas constants
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Zoom constants
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;

// Color palette for cursor colors
export const CURSOR_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue  
  '#10b981', // Green
  '#f59e0b', // Yellow
] as const;

// Default color for shapes
export const DEFAULT_SHAPE_COLOR = '#3b82f6'; // Blue

// Color palette for shapes (toolbar colors)
export const SHAPE_COLORS = {
  RED: '#ef4444',
  BLUE: '#3b82f6', 
  GREEN: '#10b981',
  YELLOW: '#f59e0b',
} as const;

// Shape color array for easier iteration in toolbar
export const SHAPE_COLOR_VALUES = Object.values(SHAPE_COLORS);

// Performance constants
export const CURSOR_UPDATE_THROTTLE = 33; // ~30 FPS
export const SHAPE_SYNC_TIMEOUT = 100; // 100ms target for shape operations
export const LOCK_TIMEOUT = 5000; // 5 seconds for shape locks
