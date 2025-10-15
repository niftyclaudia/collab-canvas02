# CollabCanvas MVP - Product Requirements Document

## Project Overview

A collaborative design canvas enabling real-time multi-user shape creation and manipulation with live presence tracking. This MVP prioritizes robust multiplayer infrastructure over feature breadth.

**Timeline:** 24 hours to MVP checkpoint  
**Success Criteria:** Production-ready collaborative foundation with solid architecture
## User Stories

### As a Designer (Primary User)
- I want to create an account and authenticate so I can maintain a persistent identity
- I want access to a large, navigable workspace so I can design comfortably
- I want to create rectangles by clicking and dragging to any size
- I want to select from basic colors (muted sky blue, green) before drawing
- I want to reposition shapes by dragging them
- I want to see other users' cursor positions with their names for coordination
- I want my changes to synchronize instantly across all users for real-time collaboration
- I want visibility into who else is currently online
- I want my work to be saved when I disconnect
- I want priority access to shapes when I click first, even during simultaneous access attempts

### As a Collaborative Team Member
- I want to observe shapes being created and moved by others in real-time for coordination
- I want to collaborate simultaneously without breaking the canvas
- I want to refresh mid-session and return to the current canvas state
- I want clear visual feedback when another user is working on a shape
## MVP Feature Requirements

### 1. Authentication (P0 - Critical) - BUILD THIS FIRST
- Email + password authentication *(Google OAuth removed for time savings)*
- Displayable username/name for each user
- Session persistence across browser refreshes
- User data stored in Firestore users collection
- Unique cursor color assignment at registration

**Why First:** Authentication is a prerequisite for cursor tracking, presence monitoring, and shape ownership.

**Time Savings:** Skipping Google OAuth saves ~30 minutes of setup and edge case handling.

### 2. Real-Time Cursor Synchronization (P0 - Critical) - BEFORE SHAPES

#### Multiplayer Cursors
- Display all connected users' cursor positions in real-time
- Username label rendered next to each cursor
- Unique color per user cursor
- Update rate: 20-30 FPS (33-50ms intervals) via RTDB
- Storage path in RTDB: `/sessions/main/users/{userId}/cursor`

#### Presence Tracking
- Display list of currently connected users
- Visual online status indicator (e.g., colored dots)
- Automatic updates when users connect/disconnect
- Utilize RTDB `onDisconnect()` for automatic cleanup
- Storage path in RTDB: `/sessions/main/users/{userId}/presence`

**Why Second:** Validating cursor synchronization confirms our real-time infrastructure before introducing shape complexity.
### 3. Canvas Core (P0 - Critical)

#### Pan and Zoom
- Click-and-drag panning (or spacebar + drag)
- Mouse wheel zoom centered on cursor position
- Workspace dimensions: 5000x5000px

#### Enhanced Color Toolbar *(Implemented with Professional Polish)*
- 2-button toolbar: Muted Sky Blue, Green with professional styling
- **Enhanced Visual Features:**
  - Hover effects with scale animations (1.02x on hover)
  - Selected color shows checkmark icon with drop shadow
  - Border highlighting (3px solid for selected, 2px for unselected)
  - Box shadow effects for depth
  - Selection indicator showing current color name
- Default selection: Muted Sky Blue (#67a3c1)

**Color palette:**
- Muted Sky Blue: `#67a3c1`
- Green: `#10b981`

#### Enhanced Canvas Implementation *(Beyond MVP Requirements)*
**Visual Enhancements:**
- **Figma-like Professional Styling**: Dark background (#1e1e1e) with white canvas area
- **Intelligent Grid System**: 50px grid with performance-optimized culling
- **UI Overlays**: 
  - Zoom indicator (top-right): Real-time scale percentage
  - Instructions (bottom-left): "Drag to pan • Scroll to zoom"
  - Canvas info (top-left): "Canvas: 5000 × 5000px"
- **Responsive Design**: Dynamic canvas sizing based on viewport dimensions

**Advanced Interactions:**
- **Smart Zoom Controls**: Automatic detection of trackpad vs mouse wheel with different sensitivity
- **Smooth Animations**: Brief 0.1s transitions for zoom operations
- **Professional Cursor States**: Grab/grabbing cursors for pan operations

#### Rectangle Creation via Click-and-Drag
- User clicks canvas background (mousedown) → capture start coordinates
- User drags (mousemove) → display dynamic preview rectangle
- Preview shows solid color fill with light green outline
- All users see the light green outline during creation (real-time feedback)
- User releases (mouseup) → finalize rectangle with:
  - Position: initial drag location
  - Width: `Math.abs(endX - startX)`
  - Height: `Math.abs(endY - startY)`
  - Color: toolbar selection
- Support negative drags (leftward or upward)
- Minimum dimensions: 10x10px (prevent accidental micro-rectangles)

#### Basic Interactions
- Click to select shape (show light green outline)
- Drag to reposition selected shape
- No resize handles or rotation in MVP
- No multi-select in MVP
- No delete functionality
### 4. Real-Time Shape Sync with Simple Locking (P0 - Critical)

#### Live Object Sync
- Shape creation broadcasts instantly to all users
- Shape movement/updates sync across all clients
- Target latency: <100ms
- Storage: Firestore `canvases/main/shapes/{shapeId}` (individual documents)

#### Simple Shape Locking *(Simplified for MVP)*

**The Goal:** First user to interact with a shape gains control. Other users see it's active and cannot interact.

**How it works:**
1. User A clicks shape
2. Immediate Firestore write: `lockedBy: "userA_id"`, `lockedAt: serverTimestamp()`
3. Local display: shape shown with light green outline
4. User B clicks same shape shortly after
5. Before User B's interaction completes, Firestore listener receives User A's lock
6. User B observes shape has light green outline (indicating someone is working on it)
7. Click interaction is prevented *(no cursor change for MVP - saves development time)*

**Edge Case:** If User A and User B click within ~50ms (very rare)
- Both writes reach Firestore
- Last-write-wins: one overwrites the other
- Acceptable for MVP - occurs <1% of time with 2-5 users

#### Lock Release *(Simplified)*

Lock releases when user:
- Clicks away (deselects shape)
- Completes dragging (onDragEnd)
- Disconnects (handled via presence cleanup)
- *(Auto-timeout removed for MVP - saves ~30 minutes implementation)*

#### Visual States
- **Unlocked shape:** Solid color fill, no outline
- **Active** (being created, locked by me, or locked by other): Solid color fill with light green outline (`#10b981`, 2px)
- **Locked by other:** Visual outline only *(no cursor changes for MVP)*

#### Error Handling *(Simplified)*
- Visual feedback only (light green outline + disabled interaction)
- No toast notifications needed
- *(Cursor state changes removed for MVP - focus on core functionality)*
### 5. Deployment (P0 - Critical)
- Publicly accessible URL
- Performance tested with 5+ concurrent users minimum
- Must be evaluator-testable
- Single shared canvas for all users
- Target: 60 FPS rendering, 500+ shapes capacity

## Tech Stack

### Frontend Framework
- React with TypeScript and Vite

### Canvas Rendering
- Konva.js with react-konva
- Target: 60 FPS during all interactions

### State Management
- React Context with custom hooks pattern

### Backend & Sync
- **Firebase Realtime Database (RTDB):** Cursors, Presence (high-frequency, ephemeral data)
- **Firebase Firestore:** Shapes, Locks (structured, persistent data)
- **Firebase Authentication:** User management

### Architecture Pattern

**Service Layer Pattern:**
```
UI Components
     ↓
React Context (AuthContext, CanvasContext)
     ↓
Custom Hooks (useAuth, useCanvas, useCursors, usePresence)
     ↓
Service Layer (AuthService, CanvasService, CursorService, PresenceService)
     ↓
Firebase (Auth, Firestore, RTDB)
```

**Why Service Layer:**
- Clean separation of concerns
- Testable with Firebase Emulators
- Easier to extend with additional features
- Consistent API for all interactions

### Deployment
- Vercel (frontend hosting)

### Additional Libraries
- `lodash` - throttle function (cursor updates)
- `react-konva` - Konva React bindings
- `konva` - Canvas rendering

### Testing Infrastructure
- Firebase Emulators: Auth, Firestore, RTDB
- Vitest + React Testing Library: Unit tests
- Integration tests for multi-user scenarios
## Data Models

### Firestore Collections

#### users Collection
```json
{
  "uid": "user_abc",
  "username": "Alice",
  "email": "alice@example.com",
  "cursorColor": "#67a3c1",
  "createdAt": "timestamp"
}
```

#### canvases/main/shapes Collection (Individual Documents)
```json
{
  "id": "shape_123",
  "type": "rectangle",
  "x": 100,
  "y": 200,
  "width": 150,
  "height": 100,
  "color": "#67a3c1",
  "createdBy": "user_abc",
  "createdAt": "timestamp",
  "lockedBy": "user_abc | null",
  "lockedAt": "timestamp | null",
  "updatedAt": "timestamp"
}
```

**Why Individual Documents:**
- Scales to 500+ objects
- Superior query performance
- No 1MB document size limit concerns
- Simplified concurrent editing (eliminates array conflicts)

### RTDB Paths

#### /sessions/main/users/{userId} Path
```json
{
  "cursor": {
    "x": 450,
    "y": 300,
    "username": "Alice",
    "color": "#67a3c1",
    "timestamp": "timestamp"
  },
  "presence": {
    "online": true,
    "lastSeen": "timestamp",
    "username": "Alice"
  }
}
```

**Why RTDB for Cursors/Presence:**
- <50ms latency (vs Firestore's ~200ms)
- Optimized for high-frequency updates (20-30 FPS)
- Built-in `onDisconnect()` for automatic cleanup
- Reduces Firestore costs (cursors don't require persistence)
## Build Sequence (Priority Order)

### Phase 0: Development Setup (30 min)

#### Firebase Emulators Setup
- Install Firebase CLI: `npm install -g firebase-tools`
- Initialize emulators: `cd app && firebase init emulators`
- Configure ports:
  - Auth: 9099
  - Firestore: 8080
  - Realtime Database: 9000
- Create `firebase.json` with emulator configuration
- Add emulator connection logic to Firebase initialization
- Test basic read/write operations to emulators

#### Project Structure
```apply 
src/
  components/     # UI components
  contexts/       # React contexts
  hooks/          # Custom hooks
  services/       # Service layer
    authService.ts
    canvasService.ts
    cursorService.ts
    presenceService.ts
  utils/          # Helper functions
  firebase.ts     # Firebase initialization
```

**Gate:** Emulators running, can read/write test data locally.
### Phase 1: Authentication (1 hour) *(Simplified)*

#### Firebase Setup (20 min)
- Create Firebase project (or use existing)
- Enable Authentication (Email/Password only)
- Enable Firestore
- Enable Realtime Database
- Configure security rules (see below)
- Install Firebase SDK

#### Auth Service Layer (20 min)
Create `services/authService.ts`:
```typescript
class AuthService {
  async signup(email: string, password: string, username: string)
  async login(email: string, password: string)
  async logout()
  async getCurrentUser()
  onAuthStateChanged(callback)
}
```

#### Auth UI (20 min) *(Minimal Styling)*
- Basic login/signup form (minimal styling for speed)
- Store username in Firestore users collection
- Assign random cursor color at signup
- Persist authentication state
- Simple loading states
- Logout button

**Time Savings:** No Google OAuth setup, minimal UI styling

**Gate:** User can sign up, log in, logout, and maintain login across refreshes.
### Phase 2: Cursor Sync (2-3 hours)

#### Canvas Foundation with Professional Polish *(2.5 hours - Enhanced Implementation)*
✅ **COMPLETED - EXCEEDS EXPECTATIONS**

**Core Canvas Implementation:**
- React + Konva setup with professional architecture
- Full 5000x5000px Stage with optimized rendering
- Click-and-drag panning with visual cursor feedback (grab/grabbing)
- Advanced mouse wheel zoom (cursor-centered, 0.1x to 3x range)
- Smart trackpad vs mouse wheel detection with different sensitivity
- CanvasContext for state management (position, scale, selected color)

**Enhanced Color Toolbar:**
- 2-color professional toolbar (Muted Sky Blue, Green) 
- Hover effects, checkmark indicators, selection feedback
- Real-time color name display and visual highlighting

**Professional UI Polish:**
- Figma-like dark background (#1e1e1e) with white canvas area
- Intelligent 50px grid system with performance culling
- Real-time zoom percentage indicator (top-right)
- Interactive instructions overlay (bottom-left)
- Canvas dimensions info (top-left)
- Smooth 0.1s transition animations for zoom operations
- Responsive canvas sizing based on viewport

#### Cursor Service Layer (30 min)
Create `services/cursorService.ts`:
```typescript
class CursorService {
  async updateCursorPosition(userId: string, x: number, y: number, username: string, color: string)
  subscribeToCursors(callback: (cursors: Cursor[]) => void)
  unsubscribe()
}
```

#### Cursor Position Tracking (1 hour)
- Track local mouse position on canvas
- Throttle updates to 33-50ms (20-30 FPS) using lodash
- Write to RTDB: `/sessions/main/users/{userId}/cursor`
- Use cursor color from user profile

**Implementation:**
```typescript
const throttledUpdateCursor = throttle((x, y) => {
  cursorService.updateCursorPosition(userId, x, y, username, color);
}, 33); // 30 FPS
```

#### Render Other Users' Cursors (1 hour)
- Listen to RTDB `/sessions/main/users` path
- Render SVG cursor or simple circle with username label
- Show/hide based on RTDB updates
- Position cursors at x,y coordinates
- Filter out own cursor

#### Presence Service Layer (30 min)
Create `services/presenceService.ts`:
```typescript
class PresenceService {
  async setOnline(userId: string, username: string)
  async setOffline(userId: string)
  subscribeToPresence(callback: (users: PresenceUser[]) => void)
  setupDisconnectHandler(userId: string) // Uses RTDB onDisconnect()
}
```

#### Presence System (30 min)
- Write to RTDB `/sessions/main/users/{userId}/presence` on login
- Configure `onDisconnect()` handler for auto-cleanup
- Listen to presence changes
- Display online user list in sidebar/header

**Gate:** Open 2 browser windows → see both cursors moving in real-time with <50ms lag. Presence updates when users join/leave.
### Phase 3: Shape Creation & Sync (3-4 hours)

#### Color Toolbar (30 min)
- Add simple toolbar with 2 color buttons
- Colors: Muted Sky Blue (`#67a3c1`), Green (`#10b981`)
- Track selected color in React state
- Highlight active color button
- Default: Muted Sky Blue

#### Canvas Service Layer (1 hour)
Create `services/canvasService.ts`:
```typescript
class CanvasService {
  async createShape(shape: ShapeData)
  async updateShape(shapeId: string, updates: Partial<ShapeData>)
  async lockShape(shapeId: string, userId: string)
  async unlockShape(shapeId: string)
  subscribeToShapes(callback: (shapes: Shape[]) => void)
  async getShapes(): Promise<Shape[]>
}
```

**Why Service Layer Here:**
- Clean interface: `canvasService.createShape({type, x, y, width, height, color})`
- Easy to test with emulators
- Consistent API for all interactions
- Easier to extend later
#### Create Rectangle with Click-and-Drag (2 hours)
- Detect drag initiation: mousedown on canvas background (not on shape)
- **Track drag:**
  - Record start position (startX, startY)
  - On mousemove, calculate current position (currentX, currentY)
  - Calculate width: `Math.abs(currentX - startX)`
  - Calculate height: `Math.abs(currentY - startY)`
- **Display preview rectangle:**
  - Render Konva Rect with light green outline (`#10b981`, 2px)
  - Fill with selected color at 100% opacity (solid fill)
  - Update dimensions in real-time as user drags
  - Broadcast preview state to all users so everyone sees the light green outline
- **Finalize on mouseup:**
  - If width < 10 or height < 10, ignore
  - Call `canvasService.createShape()` with shape data
- **Edge cases:**
  - User drags left (negative width) → use `Math.abs()` and adjust x
  - User drags up (negative height) → use `Math.abs()` and adjust y
  - Don't interfere with canvas pan

#### Real-Time Shape Sync (1 hour)
- Use `canvasService.subscribeToShapes()` listener
- Update React Context when shapes added/changed/removed
- Render all shapes via Konva `<Rect>` with user-defined width, height, color
- Handle initial fetch + real-time updates
- All users see new shapes appear instantly (<100ms)

#### Shape Dragging (30 min)
- Enable draggable on Konva Rect (conditionally based on lock)
- On drag end, call `canvasService.updateShape(shapeId, {x, y})`
- Other users see movement via listener
- Smooth drag experience (no lag)

**Gate:** User A selects color, clicks on canvas, drags to create shape → User B sees light green outline then final shape with correct size/color instantly. User A drags shape → User B sees movement.
### Phase 4: Simple Shape Locking (1.5 hours) *(Simplified)*

#### Lock Logic in Canvas Service *(No Timeout)*
```typescript
// In canvasService.ts - Simplified version
async lockShape(shapeId: string, userId: string): Promise<boolean> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  const shapeDoc = await getDoc(shapeRef);
  
  // Check if already locked by someone else
  if (shapeDoc.exists()) {
    const data = shapeDoc.data();
    if (data.lockedBy && data.lockedBy !== userId) {
      return false; // Lock acquisition failed
    }
  }
  
  // Acquire lock
  await updateDoc(shapeRef, {
    lockedBy: userId,
    lockedAt: serverTimestamp()
  });
  
  return true;
}
```

#### Lock on Select (45 min)
- Click shape (not drag) → verify current lock status
- Call `canvasService.lockShape(shapeId, userId)`
- **If lock acquired:**
  - Update local state (display light green outline)
- **If lock failed:**
  - Do not select shape
  - No visual change (shape already has light green outline from other user)
- Listen to lock changes via Firestore

#### Lock Visual Indicators (45 min) *(Basic Only)*
- Render light green outline (`#10b981`, 2px) for any active shape (locked by me or other)
- Render solid color fill (no outline) for unlocked shapes
- Disable click/drag interaction for shapes locked by others
- Release lock on deselect (click background) or drag end
- *(Skip cursor changes and timeout checks)*

**Time Savings:** Removed auto-timeout logic and cursor state management (~30 min saved)

**Gate:**
- User A clicks shape → gets light green outline, can drag
- User B sees light green outline, cannot interact (no cursor feedback)
- User A clicks away → outline disappears → User B can now acquire it
### Phase 5: Testing & Polish (2 hours) *(Focused Approach)*

#### Essential Automated Tests (1 hour) *(4 Key Tests Only)*
```typescript
// 1. Authentication Flow
describe('Auth', () => {
  it('should signup and persist across refresh', async () => {
    // Critical for bootcamp demo
  });
});

// 2. Cursor Synchronization  
describe('Cursors', () => {
  it('should sync cursors between users in real-time', async () => {
    // Validates real-time infrastructure
  });
});

// 3. Shape Creation & Real-time Preview
describe('Shape Creation', () => {
  it('should show real-time preview and sync final shape', async () => {
    // Your showcase feature for evaluators
  });
});

// 4. Basic Locking
describe('Locking', () => {
  it('should prevent simultaneous shape editing', async () => {
    // Required for bootcamp evaluation
  });
});
```

#### Manual Testing (30 min) *(3-Browser Method)*
- **Setup:** Chrome, Chrome Incognito, Firefox
- **Core Flow:** Auth → Cursors → Real-time shape creation → Locking
- **Performance Check:** 20+ shapes, 3 simultaneous users
- **Edge Cases:** Refresh during edit, rapid creation

#### Deployment (30 min)
- Build and deploy to Vercel: `npm run build && vercel --prod`
- Update Firebase config for production
- Test with deployed URL and multiple users
- *(Skip performance stress testing - focus on demo readiness)*

**Time Savings:** Focused on demo-critical tests, minimal polish

**Total Estimate:** 9.5 hours core + 14.5 hours buffer = **More realistic for 24h timeline**
## Testing Checklist

### Authentication *(Simplified)*
- [ ] User can sign up with email/password
- [ ] User can log in with existing account
- [ ] Auth state persists across page refresh
- [ ] Username displays correctly in UI
- [ ] Cursor color is assigned at signup
- [ ] User can logout
- [ ] Basic error handling for invalid credentials
- ✅ **Google OAuth removed** (time savings)

### Cursor Sync
- [ ] Two users in separate browsers both see empty canvas
- [ ] User A moves cursor → User B sees cursor move at 20-30 FPS
- [ ] User B moves cursor → User A sees cursor with name label
- [ ] Both cursors have different colors
- [ ] Cursors disappear when user moves off canvas
- [ ] Presence list shows both users online
- [ ] User A disconnects → User B sees them go offline immediately (RTDB `onDisconnect`)
- [ ] Cursor latency is <50ms
### Canvas Basics
- [ ] Canvas is 5000x5000px
- [ ] Pan works (drag canvas background)
- [ ] Zoom works (mouse wheel)
- [ ] Zoom is centered on cursor position
- [ ] Canvas maintains 60 FPS during interactions

### Color Toolbar
- [ ] Toolbar displays 2 color buttons (Muted Sky Blue, Green)
- [ ] Clicking a color button selects that color
- [ ] Selected color is visually highlighted
- [ ] Default color is Muted Sky Blue on load

### Shape Creation with Click-and-Drag
- [ ] User clicks and holds on canvas background → drag starts
- [ ] While dragging, preview rectangle appears with light green outline and solid color fill
- [ ] User A drags → User B sees the same light green outline in real-time
- [ ] Preview rectangle grows dynamically as user drags
- [ ] User releases mouse → final rectangle is created without outline
- [ ] Rectangle size matches drag distance (width and height)
- [ ] Rectangle color matches selected toolbar color
- [ ] Negative drag test: User drags left or up → rectangle still creates correctly
- [ ] Minimum size test: Tiny drags (<10px) are ignored
- [ ] User A creates shape → User B sees light green outline during creation then final shape in <100ms
- [ ] Multiple shapes with different sizes/colors can exist simultaneously
- [ ] Shapes persist across refresh with correct attributes
### Shape Movement
- [ ] User A drags unlocked shape → it moves smoothly at 60 FPS
- [ ] User A releases → User B sees new position in <100ms
- [ ] Dragging feels responsive (no lag)
- [ ] Dragging shape doesn't trigger shape creation

### Shape Locking *(Simplified for MVP)*
- [ ] **Basic Lock Test:** User A clicks shape (not drag)
- [ ] User A sees light green outline (locked by me)
- [ ] User A can drag shape
- [ ] User B sees light green outline (indicating shape is active)
- [ ] User B cannot click or drag the shape *(no cursor feedback)*
- [ ] **Lock Release Test:** User A clicks canvas background (deselect)
- [ ] Light green outline disappears (shape returns to unlocked state)
- [ ] User B can now click and lock the shape
- [ ] **Drag Release Test:** User A drags shape and releases
- [ ] Lock auto-releases on drag end (outline disappears)
- [ ] User B can immediately lock it
- [ ] **Disconnect Test:** User A locks shape, closes browser
- [ ] Lock releases when presence clears
- [ ] User B can acquire lock
- ✅ **Auto-timeout removed** (saves ~30 min development)
- ✅ **"Not-allowed" cursor removed** (saves ~15 min development)
### Persistence
- [ ] All users disconnect → reconnect later → canvas state persists
- [ ] Shapes created in session 1 → still visible in session 2 with correct size/color
- [ ] Lock state clears on page refresh (no stuck locks)
- [ ] RTDB cursor/presence clears on disconnect (ephemeral data)

### Performance
- [ ] Canvas maintains 60 FPS with 50+ shapes
- [ ] Canvas maintains 60 FPS with 500+ shapes
- [ ] 5+ concurrent users without FPS degradation
- [ ] Cursor updates consistently at 20-30 FPS
- [ ] Shape sync latency consistently <100ms
- [ ] No memory leaks during extended sessions

### Deployment
- [ ] Deployed URL is publicly accessible (no auth wall)
- [ ] Works with 5+ simultaneous users on deployed version
- [ ] No console errors in production build
- [ ] Performance is acceptable on deployed app
- [ ] Firebase security rules are production-ready

### Service Layer Testing
- [ ] AuthService methods work with emulators
- [ ] CanvasService CRUD operations work correctly
- [ ] CursorService updates at target FPS
- [ ] PresenceService onDisconnect works
- [ ] Services can be mocked for unit testing
## Firebase Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only write their own document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Main canvas shapes - individual documents
    match /canvases/main/shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules
```json
{
  "rules": {
    "sessions": {
      "main": {
        "users": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $userId"
          }
        }
      }
    }
  }
}
```
## Click-and-Drag Implementation Details

### Key Konva Events
```typescript
const [isDrawing, setIsDrawing] = useState(false);
const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
const [previewRect, setPreviewRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
const [selectedColor, setSelectedColor] = useState('#67a3c1'); // Muted Sky Blue default

const canvasService = new CanvasService(); // Service instance

// Start drawing
const handleMouseDown = (e: any) => {
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  
  // Only start drawing if clicked on background (not a shape)
  if (e.target === stage) {
    setIsDrawing(true);
    setDrawStart(pointerPosition);
  }
};

// Update preview
const handleMouseMove = (e: any) => {
  if (!isDrawing || !drawStart) return;
  
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  
  // Calculate dimensions (handle negative drags)
  const x = Math.min(drawStart.x, pointerPosition.x);
  const y = Math.min(drawStart.y, pointerPosition.y);
  const width = Math.abs(pointerPosition.x - drawStart.x);
  const height = Math.abs(pointerPosition.y - drawStart.y);
  
  setPreviewRect({ x, y, width, height });
};

// Finalize shape
const handleMouseUp = async () => {
  if (!isDrawing || !previewRect) {
    setIsDrawing(false);
    return;
  }
  
  // Ignore tiny accidental shapes
  if (previewRect.width < 10 || previewRect.height < 10) {
    setIsDrawing(false);
    setPreviewRect(null);
    return;
  }
  
  // Save via CanvasService
  await canvasService.createShape({
    type: 'rectangle',
    x: previewRect.x,
    y: previewRect.y,
    width: previewRect.width,
    height: previewRect.height,
    color: selectedColor,
    createdBy: currentUser.uid,
    createdAt: Date.now(),
    lockedBy: null,
    lockedAt: null
  });
  
  // Clear preview
  setIsDrawing(false);
  setPreviewRect(null);
  setDrawStart(null);
};

// Render preview with light green outline
{previewRect && (
  <Rect
    x={previewRect.x}
    y={previewRect.y}
    width={previewRect.width}
    height={previewRect.height}
    fill={selectedColor}
    opacity={1} // Solid fill
    stroke="#10b981" // Light green outline
    strokeWidth={2}
  />
)}
```
## Explicitly Out of Scope for MVP

### Features NOT Required
- Multiple shape types (only rectangles)
- Resize handles or rotation
- Multi-select (shift-click, drag-to-select)
- Layer management/z-index controls
- Copy/paste, duplicate
- Delete shapes
- Undo/redo
- Editing shape properties after creation
- Advanced color picker (hex input, gradients) - basic 2 colors only
- Shape stroke/borders (except light green outline for active state)
- Export/save as image
- Keyboard shortcuts
- Mobile responsiveness
- Multiple canvases or workspaces

### Technical NOT Required
- Firestore transactions (acceptable limitation for MVP)
- Optimistic UI updates (nice to have)
- Toast notifications (using visual feedback only)
- Database migrations
- Analytics or monitoring
- User profiles or avatars
- Email verification
## Known Limitations

- **Race Condition (~50ms window):** If two users click a shape within ~50ms, wrong user might win lock
  - **Impact:** Low (rare with 2-5 users)
- **No Shape Delete:** Users can create shapes but not delete them
  - **Impact:** Medium (canvas can get cluttered during testing)
  - **Mitigation:** Manually clear Firestore collection between tests if needed
- **No Shape Editing After Creation:** Once created, size/color cannot be changed
  - **Impact:** Low (sufficient for MVP)
- **Basic Color Palette:** Only 2 colors available
  - **Impact:** Low (sufficient for MVP testing)
- **Single Shared Canvas:** All users edit one global canvas
  - **Impact:** Low for MVP testing
- **Visual-Only Lock Feedback:** No text notifications for lock failures
  - **Impact:** Low (light green outline + cursor feedback sufficient)
## Development Workflow

### Local Development with Emulators
```bash
# Terminal 1: Start Firebase Emulators (MUST be run from app directory)
cd app && firebase emulators:start --project collabcanvas-2a316

# Terminal 2: Start React dev server
cd app && npm run dev

# Emulator UI available at: http://localhost:4000
```

**Benefits:**
- No Firebase costs during development
- Faster iteration (no network latency)
- Can clear data instantly between tests
- Test concurrent users with multiple browser windows
- Safe to test edge cases (corrupted data, rapid operations)

### Testing Multi-User Scenarios
```bash
# Open multiple browser windows
# Incognito Mode: http://localhost:5173 (User A)
# Normal Mode: http://localhost:5173 (User B)
# Different Browser: http://localhost:5173 (User C)

# Test scenarios:
1. Create shapes simultaneously
2. Lock same shape within 50ms
3. Disconnect/reconnect during edits
4. Refresh browser mid-drag
5. Create 100+ shapes rapidly
```

### Deployment Workflow
```bash
# 1. Build production bundle
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to Vercel
vercel --prod

# 4. Update Firebase config for production domain
# (Add Vercel domain to Firebase authorized domains)

# 5. Test deployed app with multiple users
# (Share Vercel URL, test with 5+ concurrent users)
```
## Success Metrics

### MVP Gate (24 Hours) - MUST PASS *(Simplified Criteria)*
- [ ] Deployed and publicly accessible
- [ ] 2+ users can connect simultaneously
- [ ] Cursor sync <50ms with name labels
- [ ] **Real-time shape preview** *(your showcase feature)*
- [ ] Shapes sync across users <100ms
- [ ] Can drag shapes to move them
- [ ] Basic locking works (visual outline only - no cursor changes)
- [ ] 60 FPS during interactions
- [ ] No critical bugs in core flow
- ✅ **Simplified locking** (no timeout/cursor feedback - saves time)
- ⚠️ **Presence list optional** (focus on cursors first)

## Final Checklist Before Starting

### Setup Checklist *(Simplified)*
- [ ] Firebase project created
- [ ] **Email/Password auth only** (no Google OAuth setup)
- [ ] Firestore database created
- [ ] Realtime Database created
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Firebase emulators initialized: `cd app && firebase init emulators`
- [ ] React + Vite project scaffolded
- [ ] Firebase SDK installed: `npm install firebase`
- [ ] Konva installed: `npm install konva react-konva`
- [ ] Additional libraries: `npm install lodash`
- [ ] Vercel account created and linked to GitHub
- ✅ **Time Saved:** No Google OAuth credentials setup

### Architecture Checklist
- [ ] Understand hybrid database pattern (RTDB + Firestore)
- [ ] Understand service layer pattern (Context → Hooks → Services)
- [ ] Understand why individual shape documents (scalability)

### Development Checklist *(Optimized for 24h)*
- [ ] Start with Phase 0 (emulators)
- [ ] Build Phase 1-4 sequentially (don't skip)
- [ ] Test with emulators before deploying
- [ ] Deploy early (by Phase 3 or 4)
- [ ] Test deployed version with multiple users
- [ ] Focus on **4 essential automated tests** only
- [ ] Use **3-browser manual testing method** for efficiency

---

## 🎯 **24-Hour Optimization Summary**

### ⚡ **Time Savings Applied:**
- **Google OAuth removed:** -30 minutes setup and edge cases
- **Auto-timeout locking removed:** -30 minutes implementation
- **"Not-allowed" cursor states removed:** -15 minutes development
- **Minimal UI styling:** -45 minutes visual polish
- **Focused testing:** -60 minutes (4 tests vs comprehensive suite)
- **Streamlined deployment:** -30 minutes stress testing

**Total Time Saved: ~3.5 hours** *(now have 17.5 hours buffer instead of 14)*

### ✅ **Essential Features Kept:**
- **Real-time shape preview** *(your showcase feature for evaluators)*
- Firebase email/password authentication
- Cursor synchronization with names
- Basic shape locking (visual feedback only)
- Multi-user real-time collaboration
- All bootcamp requirements met

### 🎯 **Optimized Timeline:**
- **Phase 0:** 30 min (setup)
- **Phase 1:** 1 hour (auth simplified) 
- **Phase 2:** 2.5 hours (cursors + basic presence)
- **Phase 3:** 3 hours (canvas + **real-time preview**)
- **Phase 4:** 1.5 hours (simplified locking)
- **Phase 5:** 2 hours (focused testing + deploy)

**Core Development: 10.5 hours + 13.5 hours buffer = Realistic 24h success**