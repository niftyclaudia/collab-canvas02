# PR #2: Canvas Shell + Pan/Zoom + Color Toolbar - Test Plan

## Feature Overview
5000×5000 collaborative canvas with Konva-based pan/zoom functionality, 4-color toolbar, and responsive layout shell for CollabCanvas.

## User Stories
- As a user, I want to see a large 5000×5000 canvas so I can work on collaborative drawings with plenty of space
- As a user, I want to pan around the canvas by dragging so I can navigate to different areas easily
- As a user, I want to zoom in/out with my mouse wheel so I can work at different detail levels
- As a user, I want zoom to center on my cursor position so zooming feels natural and predictable
- As a user, I want to select from 4 predefined colors (Red, Blue, Green, Yellow) so I can choose drawing colors
- As a user, I want to see which color is currently selected so I know what color I'm working with
- As a user, I want smooth 60 FPS interactions so the canvas feels responsive and professional

## Setup Instructions

**Prerequisites:**
```bash
# Terminal 1 - Firebase Emulators
cd app
firebase emulators:start

# Terminal 2 - React App  
cd app
npm run dev
```

**Verify Setup:**
- Emulator UI accessible at http://localhost:4000
- React app accessible at http://localhost:5173
- Authentication working (from PR #1)
- User logged in and can see canvas interface

## Test Scenarios

### 📋 Happy Path Tests

#### ✅ Canvas Initialization
- [ ] Navigate to http://localhost:5173 and log in
- [ ] Canvas component loads and renders properly
- [ ] **Expected:** Canvas stage visible with 5000×5000 dimensions
- [ ] **Expected:** Canvas initially centered or at default position
- [ ] **Expected:** No console errors during canvas initialization
- [ ] **Expected:** Loading completes within 2 seconds

#### ✅ Pan Functionality
- [ ] Click and drag on empty canvas area
- [ ] Drag in multiple directions (up, down, left, right, diagonal)
- [ ] **Expected:** Canvas view moves smoothly in direction of drag
- [ ] **Expected:** Panning works from any starting position on canvas
- [ ] **Expected:** No stuttering or lag during pan operations
- [ ] **Expected:** Pan continues smoothly during rapid movements

#### ✅ Zoom Functionality - Basic
- [ ] Position mouse cursor over center of canvas
- [ ] Scroll wheel up (zoom in)
- [ ] **Expected:** Canvas zooms in, centered on cursor position
- [ ] Scroll wheel down (zoom out)  
- [ ] **Expected:** Canvas zooms out, centered on cursor position
- [ ] **Expected:** Zoom levels feel natural and proportional

#### ✅ Zoom Functionality - Bounds & Center Point
- [ ] Position cursor at top-left corner of visible canvas
- [ ] Scroll to zoom in
- [ ] **Expected:** Zoom centers on cursor position, not canvas center
- [ ] Position cursor at bottom-right corner
- [ ] Scroll to zoom in
- [ ] **Expected:** Zoom centers on cursor position
- [ ] Continue zooming in until minimum reached
- [ ] **Expected:** Zoom stops at minimum level (0.1x)
- [ ] Zoom out until maximum reached
- [ ] **Expected:** Zoom stops at maximum level (3.0x)

#### ✅ Color Toolbar - Selection
- [ ] Locate color toolbar with 4 color buttons
- [ ] **Expected:** Default Blue (#3b82f6) is highlighted/selected initially
- [ ] Click Red color button (#ef4444)
- [ ] **Expected:** Red button becomes highlighted, Blue unhighlighted
- [ ] Click Green button (#10b981)
- [ ] **Expected:** Green becomes active, previous selection clears
- [ ] Click Yellow button (#f59e0b)
- [ ] **Expected:** Yellow becomes active, others inactive
- [ ] Click Blue button (#3b82f6)
- [ ] **Expected:** Returns to Blue selection

#### ✅ Color Toolbar - Visual Feedback
- [ ] Observe color buttons in default state
- [ ] **Expected:** Buttons show correct colors (Red/Blue/Green/Yellow)
- [ ] **Expected:** Active button has clear visual distinction (border, shadow, etc.)
- [ ] **Expected:** Inactive buttons appear clickable but not selected
- [ ] Click each color button and observe transitions
- [ ] **Expected:** Smooth transitions between active states
- [ ] **Expected:** No flickering or visual glitches

#### ✅ AppShell Layout
- [ ] Observe overall page layout with user logged in
- [ ] **Expected:** Navbar present at top with username and logout
- [ ] **Expected:** Color toolbar accessible and properly positioned
- [ ] **Expected:** Canvas area takes up appropriate screen space
- [ ] **Expected:** Presence area placeholder visible (if implemented)
- [ ] **Expected:** Layout remains stable during interactions

### 🔍 Edge Cases & Interaction Tests

#### ⚠️ Pan + Zoom Combinations
- [ ] Start panning, then zoom while still holding drag
- [ ] **Expected:** Zoom operation doesn't interfere with ongoing pan
- [ ] Zoom in significantly, then try panning
- [ ] **Expected:** Pan still works smoothly at high zoom levels
- [ ] Zoom out to minimum, then try panning
- [ ] **Expected:** Pan still works at minimum zoom level

#### ⚠️ Canvas Boundaries
- [ ] Pan to what seems like edge of 5000×5000 canvas
- [ ] **Expected:** Can pan to see all areas within 5000×5000 bounds
- [ ] **Expected:** Cannot pan beyond canvas boundaries (or boundaries are clearly defined)
- [ ] Try to pan beyond reasonable limits
- [ ] **Expected:** Graceful handling, no infinite panning

#### ⚠️ Zoom Boundary Edge Cases
- [ ] Rapidly scroll wheel to try to exceed max zoom (3.0x)
- [ ] **Expected:** Zoom stops cleanly at 3.0x, no overflow
- [ ] Rapidly scroll in opposite direction to exceed min zoom (0.1x)
- [ ] **Expected:** Zoom stops cleanly at 0.1x, no underflow
- [ ] Try zooming with cursor at extreme canvas edges
- [ ] **Expected:** Zoom still centers on cursor, no visual glitches

#### ⚠️ Color Selection Edge Cases  
- [ ] Rapidly click between different color buttons
- [ ] **Expected:** Selection updates immediately, no stuck states
- [ ] Click same color button multiple times
- [ ] **Expected:** Remains selected, no state issues
- [ ] Try clicking area between color buttons
- [ ] **Expected:** No unintended selections or errors

### ⚡ Performance Tests

#### 🚀 Pan Performance
- [ ] Perform continuous panning for 30 seconds
- [ ] **Expected:** Maintains 60 FPS throughout pan operations
- [ ] **Expected:** No memory leaks or performance degradation
- [ ] **Expected:** Smooth motion without stuttering or lag
- [ ] Use browser dev tools to monitor FPS during panning
- [ ] **Expected:** Consistent frame rates in performance timeline

#### 🚀 Zoom Performance  
- [ ] Perform rapid zoom in/out operations for 30 seconds
- [ ] **Expected:** Maintains 60 FPS during zoom operations
- [ ] **Expected:** Zoom response feels immediate (<50ms)
- [ ] Combine zoom + pan operations simultaneously
- [ ] **Expected:** Both operations remain smooth when combined
- [ ] **Expected:** No performance degradation during combined operations

#### 🚀 Canvas Rendering Performance
- [ ] Monitor initial canvas load time
- [ ] **Expected:** Canvas ready for interaction within 2 seconds
- [ ] Check memory usage during extended use
- [ ] **Expected:** No significant memory leaks over time
- [ ] Test canvas performance at different zoom levels
- [ ] **Expected:** Consistent performance at all zoom levels (0.1x to 3.0x)

### 🌐 Cross-Browser Tests

#### 👥 Browser Compatibility
- [ ] **Chrome:** Test all pan/zoom/color functionality
- [ ] **Expected:** Full functionality works as specified
- [ ] **Firefox:** Test all pan/zoom/color functionality  
- [ ] **Expected:** Full functionality works as specified
- [ ] **Safari:** Test all pan/zoom/color functionality
- [ ] **Expected:** Full functionality works as specified
- [ ] **Edge:** Test all pan/zoom/color functionality
- [ ] **Expected:** Full functionality works as specified

#### 🖱️ Input Device Tests
- [ ] Test with standard mouse wheel
- [ ] **Expected:** Zoom works smoothly
- [ ] Test with trackpad (Mac/PC)
- [ ] **Expected:** Zoom and pan gestures work naturally
- [ ] Test with different mouse sensitivity settings
- [ ] **Expected:** Operations feel natural across different settings

### 📱 Responsive Design Tests

#### 📺 Different Screen Sizes
- [ ] Test on desktop (1920x1080+)
- [ ] **Expected:** Layout uses space efficiently
- [ ] Test on smaller laptop (1366x768)
- [ ] **Expected:** All controls accessible and functional
- [ ] Test at narrow window widths
- [ ] **Expected:** Layout adapts gracefully or shows minimum width
- [ ] **Expected:** Color toolbar remains accessible

### 🛠️ Integration Tests

#### 🔗 Context Integration
- [ ] Verify color selection updates canvas context/state
- [ ] **Expected:** Selected color persists across component re-renders
- [ ] Verify pan/zoom state maintains properly
- [ ] **Expected:** Canvas position/zoom level persists during other operations
- [ ] Test interactions with authentication state
- [ ] **Expected:** Canvas functionality available only when authenticated

#### 🔄 State Persistence
- [ ] Select a color, refresh page
- [ ] **Expected:** Color selection resets to default (Blue)
- [ ] Pan and zoom, refresh page
- [ ] **Expected:** Canvas position resets to default (acceptable for MVP)

## Success Criteria

### ✅ Core Canvas Functionality
- [ ] Canvas renders at full 5000×5000 dimensions
- [ ] Pan operations work smoothly via drag interaction
- [ ] Zoom operations work via mouse wheel and center on cursor position
- [ ] Zoom bounds properly enforced (min 0.1x, max 3.0x)
- [ ] Canvas interactions maintain 60 FPS target performance

### ✅ Color Toolbar Requirements
- [ ] Four color buttons display correct colors: Red (#ef4444), Blue (#3b82f6), Green (#10b981), Yellow (#f59e0b)
- [ ] Default selection is Blue (#3b82f6)
- [ ] Active color button has clear visual distinction
- [ ] Color selection updates immediately on button click
- [ ] Selected color state maintained during canvas operations

### ✅ Layout & Shell Requirements
- [ ] AppShell provides proper layout structure
- [ ] Navbar integration works with authentication
- [ ] Color toolbar positioned accessibly
- [ ] Canvas area utilizes appropriate screen space
- [ ] Layout remains stable during all interactions

### ✅ Performance Requirements
- [ ] Initial canvas load completes within 2 seconds
- [ ] Pan operations maintain 60 FPS
- [ ] Zoom operations maintain 60 FPS
- [ ] Combined pan+zoom operations remain smooth
- [ ] No memory leaks during extended use

### ✅ Cross-Browser Compatibility
- [ ] Full functionality works in Chrome, Firefox, Safari, Edge
- [ ] Mouse wheel and trackpad interactions work naturally
- [ ] Visual appearance consistent across browsers
- [ ] Performance targets met across different browsers

## Known Limitations
- Canvas position/zoom state doesn't persist across page refreshes (acceptable for MVP)
- No mobile/touch interaction support (post-MVP)
- Color selection limited to 4 predefined colors (more colors in post-MVP)
- No keyboard shortcuts for pan/zoom operations (post-MVP)

## Integration Points for Next PRs
- PR #3: Cursor positions will need to be converted to/from canvas coordinates
- PR #3: Presence system will integrate with canvas layout  
- PR #4: Shape creation will use selected color from color toolbar
- PR #4: Shapes will render within the pan/zoom coordinate system

## Next Steps After This PR
- PR #3: Cursor Sync + Presence (RTDB) - will use canvas coordinate system
- Canvas context will provide selected color for shape creation
- Pan/zoom state will be foundation for all collaborative interactions
