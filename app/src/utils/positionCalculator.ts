import Konva from 'konva';

/**
 * Calculate the screen position for a text editor overlay
 * This is the critical positioning algorithm that must work at all zoom levels
 */
export const calculateOverlayPosition = (
  textNode: Konva.Text,
  stage: Konva.Stage,
  container: HTMLElement
): { x: number; y: number; zoom: number } => {
  // Step 1: Get absolute position of text node in canvas coordinates
  const canvasPoint = textNode.getAbsolutePosition();
  
  // Step 2: Get stage transform properties
  const stagePosition = stage.position(); // { x, y } pan offset
  const zoom = stage.scaleX(); // scaleX === scaleY for uniform zoom
  
  // Step 3: Get container's screen position
  const containerRect = container.getBoundingClientRect();
  
  // Step 4: Transform canvas coordinates to screen coordinates
  // Formula: screen = (canvas - stagePan) * zoom + containerOffset
  const screenX = (canvasPoint.x * zoom) + stagePosition.x + containerRect.left;
  const screenY = (canvasPoint.y * zoom) + stagePosition.y + containerRect.top;
  
  return { x: screenX, y: screenY, zoom };
};

/**
 * Create a minimal test harness for positioning validation
 * This function helps validate the positioning algorithm during development
 */
export const createPositioningTestHarness = () => {
  console.log('🧪 Creating positioning test harness...');
  
  // This would be used in a test environment to validate positioning
  // For now, we'll implement the actual positioning in the overlay component
  return {
    testAtZoom: (zoom: number) => {
      console.log(`Testing positioning at ${zoom * 100}% zoom`);
      // Implementation would go here
    },
    testAtPan: (x: number, y: number) => {
      console.log(`Testing positioning after pan to (${x}, ${y})`);
      // Implementation would go here
    }
  };
};
