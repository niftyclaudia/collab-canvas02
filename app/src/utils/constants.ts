// Canvas constants
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Zoom constants
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;

// Color palette for cursor colors
export const CURSOR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f97316', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
] as const;

// Default color for shapes
export const DEFAULT_SHAPE_COLOR = '#3b82f6'; // Blue

// Color palette for shapes (toolbar colors) - matches LeftToolbar
export const SHAPE_COLORS = {
  BLUE: '#3b82f6',
  GREEN: '#10b981',
  ORANGE: '#f97316',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
} as const;

// Shape color array for easier iteration in toolbar
export const SHAPE_COLOR_VALUES = Object.values(SHAPE_COLORS);

// Color palette for AI agent (matches toolbar colors)
export const AI_COLOR_PALETTE = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
] as const;

// Shape size constraints
export const MIN_SHAPE_WIDTH = 10;
export const MIN_SHAPE_HEIGHT = 10;

// Performance constants
export const CURSOR_UPDATE_THROTTLE = 33; // ~30 FPS
export const SHAPE_SYNC_TIMEOUT = 100; // 100ms target for shape operations
export const LOCK_TIMEOUT = 5000; // 5 seconds for shape locks
