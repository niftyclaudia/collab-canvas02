# CollabCanvas - Development Task List
**Based on PRD v6 - Optimized for 24-Hour Timeline**  
**Total Core Development: 10.5 hours + 13.5 hours buffer**

---

## 📁 Project File Structure
```
collab-canvas/                 # Main project directory
├── app/                       # React + TypeScript application ✅
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx  
│   │   │   │   └── AuthProvider.tsx
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── ColorToolbar.tsx
│   │   │   │   └── ShapeLayer.tsx
│   │   │   ├── Collaboration/
│   │   │   │   ├── RemoteCursor.tsx
│   │   │   │   └── OnlineUsers.tsx
│   │   │   └── Layout/
│   │   │       ├── Header.tsx
│   │   │       └── MainLayout.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CanvasContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCanvas.ts
│   │   │   ├── useCursors.ts
│   │   │   └── usePresence.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── canvasService.ts
│   │   │   ├── cursorService.ts
│   │   │   └── presenceService.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── firebase.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json           # App dependencies ✅
│   ├── vite.config.ts         # Vite configuration ✅
│   └── tsconfig.json          # TypeScript configuration ✅
├── firebase.json              # Firebase project config
├── firestore.rules           # Firestore security rules
├── database.rules.json       # RTDB security rules
├── architecture.md           # Technical architecture doc
├── task.md                   # This development task list
└── PRD.md                    # Product requirements document
```

---

# 🚀 Development Phases

## Phase 0: Project Setup & Firebase Emulators ⏱️ **30 min**
**Branch:** `setup/project-foundation`  
**Goal:** Initialize React + TypeScript project with Firebase Emulators running locally

### 0.1 Scaffold React + TypeScript project ⏱️ **10 min**
- [x] ✅ **COMPLETED** - React + TypeScript + Vite project created in `/app` folder
- [x] ✅ **COMPLETED** - Install core dependencies: `npm install firebase konva react-konva lodash`
- [x] ✅ **COMPLETED** - Configure TypeScript strict mode in `tsconfig.json` (already enabled by Vite template)

### 0.2 Initialize Firebase CLI and Emulators ⏱️ **10 min**
- [x] ✅ **COMPLETED** - Install Firebase CLI globally: `npm install -g firebase-tools`
- [x] ✅ **COMPLETED** - Run `firebase init emulators` (configured manually)
- [x] ✅ **COMPLETED** - Configure emulator ports:
  - Auth: 9099
  - Firestore: 8080  
  - RTDB: 9000
  - UI: 4000
- [x] ✅ **COMPLETED** - Create `firebase.json` with emulator configuration
- [x] ✅ **COMPLETED** - Write stub files: `firestore.rules` and `database.rules.json`

### 0.3 Firebase initialization file ⏱️ **5 min**
- [x] ✅ **COMPLETED** - Create `app/src/firebase.ts` with Firebase app initialization
- [x] ✅ **COMPLETED** - Add conditional emulator connection for development mode
- [x] ✅ **COMPLETED** - Test connection with dummy read/write operation

### 0.4 Environment configuration ⏱️ **3 min**
- [x] ✅ **COMPLETED** - Create `.env.example` with Firebase config keys (empty values)
- [x] ✅ **COMPLETED** - Add `.gitignore` (`.env`, `node_modules`, `dist`)

### 0.5 Verify local development setup ⏱️ **2 min**
- [x] ✅ **COMPLETED** - Start emulators: `cd app && firebase emulators:start --project collabcanvas-2a316`
- [x] ✅ **COMPLETED** - Start dev server: `cd app && npm run dev`
- [x] ✅ **COMPLETED** - Confirm Emulator UI accessible at `localhost:4000`
- [x] ✅ **COMPLETED** - Confirm dummy Firestore and RTDB operations succeed

**✅ CHECKPOINT:** Emulators running, React app boots, Firebase connection verified

---

## Phase 1: Authentication System ⏱️ **1 hour** - SIMPLIFIED
**Branch:** `feature/authentication`  
**Goal:** Email/password authentication ONLY (Google OAuth removed to save 30 minutes)

### 1.1 Design Firestore users collection ⏱️ **5 min**
- [x] ✅ **COMPLETED** - Define schema: `uid`, `username`, `email`, `cursorColor`, `createdAt`
- [x] ✅ **COMPLETED** - Document cursor color assignment logic (random from palette)

### 1.2 Build AuthService ⏱️ **20 min**
- [x] ✅ **COMPLETED** - Create `app/src/services/authService.ts` class
- [x] ✅ **COMPLETED** - Implement `signup(email, password, username)` method
- [x] ✅ **COMPLETED** - Implement `login(email, password)` method  
- [x] ✅ **COMPLETED** - Implement `logout()` method
- [x] ✅ **COMPLETED** - Implement `getCurrentUser()` and `onAuthStateChanged(callback)`
- [x] ✅ **COMPLETED** - On signup: create Firestore user document with random cursor color

### 1.3 Create Auth Context and Hook ⏱️ **15 min**
- [x] ✅ **COMPLETED** - Build `AuthContext` providing `{ user, loading, signup, login, logout }`
- [x] ✅ **COMPLETED** - Create `useAuth()` hook wrapping AuthContext
- [x] ✅ **COMPLETED** - Handle loading states during auth operations

### 1.4 Build authentication UI ⏱️ **20 min** - MINIMAL STYLING
- [x] ✅ **COMPLETED** - Create `app/src/components/Auth/Signup.tsx` component (email, password, username fields)
- [x] ✅ **COMPLETED** - Create `app/src/components/Auth/Login.tsx` component (email, password fields)
- [x] ✅ **COMPLETED** - Add navigation between login and signup views (via AuthContainer)
- [x] ✅ **COMPLETED** - Build `app/src/components/Layout/Header.tsx` showing username and logout button (excellent styling)
- [x] ✅ **COMPLETED** - Display error messages for invalid credentials

### 1.5 Implement route protection ⏱️ **5 min**
- [x] ✅ **COMPLETED** - Show Login/Signup for unauthenticated users
- [x] ✅ **COMPLETED** - Show Canvas/MainLayout for authenticated users
- [x] ✅ **COMPLETED** - Redirect appropriately after login/signup

⚡ **TIME SAVED:** No Google OAuth setup (30 minutes)

**✅ CHECKPOINT:** ✅ **PHASE 1 COMPLETE**
- ✅ Users can sign up, log in, log out
- ✅ Username displayed in header with cursor color indicator
- ✅ Auth persists on refresh
- ✅ Excellent UI with proper error handling and loading states
- ✅ Route protection working correctly

---

## Phase 2: Canvas Foundation + Pan/Zoom + Color Toolbar ⏱️ **2.5 hours**
**Branch:** `feature/canvas-core`  
**Goal:** 5000x5000 Konva stage with pan/zoom controls and 2-color toolbar

### 2.1 Define canvas constants ⏱️ **10 min**
- [x] ✅ **COMPLETED** - Create `app/src/utils/constants.ts` with:
  - `CANVAS_WIDTH = 5000`
  - `CANVAS_HEIGHT = 5000`
- [x] ✅ **COMPLETED** - Define color palette:
  - Muted Sky Blue: `#67a3c1`
  - Green: `#10b981`
- [x] ✅ **COMPLETED** - Set default color: Muted Sky Blue

### 2.2 Build Canvas component with Konva ⏱️ **1.5 hours**
- [x] ✅ **COMPLETED** - Create `app/src/components/Canvas/Canvas.tsx` with Konva Stage and Layer
- [x] ✅ **COMPLETED** - Implement click-and-drag panning (drag stage background)
- [x] ✅ **COMPLETED** - Implement mouse wheel zoom:
  - Cursor-centered
  - Min: 0.1, Max: 3
- [x] ✅ **COMPLETED** - Set stage dimensions to 5000x5000px

### 2.3 Create ColorToolbar component ⏱️ **30 min**
- [x] ✅ **COMPLETED** - Build toolbar with 2 color buttons (Muted Sky Blue, Green)
- [x] ✅ **COMPLETED** - Highlight active/selected color visually
- [x] ✅ **COMPLETED** - Update selected color in Canvas context/state

### 2.4 Build MainLayout structure ⏱️ **30 min**
- [x] ✅ **COMPLETED** - Create layout with:
  - Header
  - CanvasContext provider
  - ColorToolbar
  - Canvas area
- [x] ✅ **COMPLETED** - Ensure responsive layout for canvas workspace

**✅ CHECKPOINT:** ✅ **PHASE 2 COMPLETE** - EXCEEDS EXPECTATIONS
- ✅ Stage renders at 5000x5000px (virtually infinite canvas)
- ✅ Pan works smoothly with click-and-drag
- ✅ Zoom works with mouse wheel (cursor-centered, 0.1x to 3x range)
- ✅ Color toolbar with 2 colors (Muted Sky Blue, Green)
- ✅ Color selection with visual feedback and state management
- ✅ Responsive canvas layout
- ✅ 60 FPS maintained during interactions
- ✅ Professional UI with excellent styling

**🎯 BONUS FEATURES IMPLEMENTED (Beyond PRD):**
- ✨ **Enhanced Visual Grid System**: 50px grid with intelligent culling for performance
- ✨ **Professional UI Overlays**: Zoom indicator (top-right), instructions (bottom-left), canvas info (top-left)
- ✨ **Advanced Zoom Controls**: Trackpad vs mouse wheel detection with different sensitivity curves
- ✨ **Smooth Animations**: Brief transition animations for zoom operations (0.1s duration)
- ✨ **Figma-like Styling**: Dark background (#1e1e1e) with white canvas area and subtle shadows
- ✨ **Responsive Canvas Sizing**: Dynamic canvas size calculation based on viewport
- ✨ **Professional Color Toolbar**: Hover effects, checkmark indicators, and selection feedback

---

## Phase 3: Real-Time Cursors + Presence (RTDB) ⏱️ **2.5 hours**
**Branch:** `feature/cursors-and-presence`  
**Goal:** Real-time cursor positions at 20-30 FPS and live presence list using RTDB

## 🎯 Phase 3 Test Plan (Write BEFORE Implementation)

**Following:** `docs/templates/PR-TEST-PLAN-TEMPLATE.md`

### Prerequisites
- [ ] Firebase emulators running: `cd app && firebase emulators:start --project collabcanvas-2a316`
- [ ] App running: `npm run dev`
- [ ] 3 browser windows (Chrome normal, Chrome incognito, Firefox)

### Test Scenarios (Multi-User)

#### Cursor Sync Tests
- [ ] **User A** moves mouse → **User B** sees cursor within 50ms
- [ ] **User A** moves cursor to (100, 200) → **User B** sees cursor at same position
- [ ] **User A** moves mouse outside canvas → **User B** cursor disappears
- [ ] **User A** refreshes → **User B** sees cursor disappear immediately
- [ ] With 3 users, all see each other's cursors (not their own)

#### Presence List Tests  
- [ ] **User A** logs in → appears in presence list with correct username + color dot
- [ ] **User B** joins → **User A** sees **User B** appear in list within 2 seconds
- [ ] **User A** closes tab → **User B** sees **User A** disappear within 5 seconds
- [ ] **User A** refreshes → stays in list, no duplicates created
- [ ] Presence list shows current user as "(you)" with green highlight

#### Edge Cases
- [ ] Rapid mouse movements don't cause lag or cursor jumping
- [ ] Network disconnect/reconnect maintains presence correctly
- [ ] Multiple tabs by same user don't create duplicate entries
- [ ] Canvas zoom/pan doesn't affect cursor position accuracy

#### Performance Targets
- [ ] Cursor updates: 20-30 FPS (33-50ms intervals)
- [ ] Presence updates: <2 seconds for join/leave
- [ ] No memory leaks during 10-minute session
- [ ] Smooth performance with 5 concurrent users

### Success Criteria
✅ **MUST PASS ALL SCENARIOS ABOVE**

---

## 🔧 Phase 3 Implementation Guide

### 3.1 Define RTDB data structure ⏱️ **15 min**
- [x] ✅ **COMPLETED** - Document paths: `/sessions/main/users/{userId}/cursor` and `/sessions/main/users/{userId}/presence`
- [x] ✅ **COMPLETED** - Define cursor data: `{ x, y, username, color, timestamp }`
- [x] ✅ **COMPLETED** - Define presence data: `{ online, lastSeen, username, cursorColor }`

### 3.2 Build CursorService ⏱️ **30 min**
- [x] ✅ **COMPLETED** - Create `app/src/services/cursorService.ts`
- [x] ✅ **COMPLETED** - Implement `updateCursorPosition(userId, x, y, username, color)` → RTDB
- [x] ✅ **COMPLETED** - Implement `subscribeToCursors(callback)` listening to all users' cursors
- [x] ✅ **COMPLETED** - Implement cursor cleanup method

### 3.3 Build PresenceService ⏱️ **30 min**
- [x] ✅ **COMPLETED** - Create `app/src/services/presenceService.ts`
- [x] ✅ **COMPLETED** - Implement `setOnline(userId, username, cursorColor)` → RTDB
- [x] ✅ **COMPLETED** - Implement `setOffline(userId)` for manual cleanup
- [x] ✅ **COMPLETED** - Implement `subscribeToPresence(callback)` listening to all users
- [x] ✅ **COMPLETED** - Implement `setupDisconnectHandler(userId)` using RTDB `onDisconnect()`

### 3.4 Create Cursor tracking hook and UI ⏱️ **1 hour**
- [x] ✅ **COMPLETED** - Build `useCursors()` hook tracking mouse position over canvas
- [x] ✅ **COMPLETED** - Throttle cursor updates to 33-50ms using lodash
- [x] ✅ **COMPLETED** - Convert screen coordinates to canvas coordinates
- [x] ✅ **COMPLETED** - Create `app/src/components/Collaboration/RemoteCursor.tsx` component:
  - Render cursor with username label
  - Filter out own cursor from display

### 3.5 Create Presence UI ⏱️ **30 min**
- [x] ✅ **COMPLETED** - Build `usePresence()` hook
- [x] ✅ **COMPLETED** - Create `app/src/components/Collaboration/OnlineUsers.tsx` component:
  - Display list of connected users
  - Show colored dots matching each user's cursor color
  - Update list automatically on join/leave

### 3.6 Manage presence lifecycle ⏱️ **15 min**
- [x] ✅ **COMPLETED** - Mark user online on auth ready
- [x] ✅ **COMPLETED** - Setup disconnect handler on mount
- [x] ✅ **COMPLETED** - Clean up presence on logout/unmount

---

## 🐛 Phase 3 Debugging Guide

**ISSUE:** Cursors move but user names don't appear in presence list

### Step 1: Verify RTDB Data Structure
```bash
# Open Firebase Emulator UI
open http://localhost:4000

# Check Realtime Database tab
# Should see: /sessions/main/users/{userId}/presence
# Should contain: { online: true, username: "Alice", cursorColor: "#color", lastSeen: timestamp }
```

### Step 2: Debug Presence Service
```typescript
// Add console.log in presenceService.setOnline()
console.log('🟢 Setting user online:', { userId, username, cursorColor });

// Add console.log in presenceService.subscribeToPresence()
console.log('📡 RTDB data received:', usersData);
console.log('👥 Parsed online users:', onlineUsers);
```

### Step 3: Debug usePresence Hook
```typescript
// Add console.log in usePresence.ts
console.log('🎯 usePresence - onlineUsers:', onlineUsers);
console.log('🎯 usePresence - currentUserId:', currentUserId);
```

### Step 4: Debug OnlineUsers Component
```typescript
// Add console.log in OnlineUsers.tsx
console.log('🖥️ OnlineUsers received users:', users);
console.log('🖥️ OnlineUsers currentUserId:', currentUserId);
```

### Step 5: Check Integration in MainLayout
```typescript
// In MainLayout.tsx, verify usePresence is called
console.log('🏗️ MainLayout - onlineUsers:', onlineUsers);
```

### Common Issues & Solutions

#### Issue: Empty presence list
**Root Cause:** PresenceService subscription not firing
**Solution:**
```typescript
// Check if this console.log appears:
console.log('📡 RTDB subscription started');

// If not, verify RTDB connection in firebase.ts
// If yes but no data, check setOnline is being called
```

#### Issue: Data in RTDB but not in UI
**Root Cause:** Data parsing or filtering issue
**Solution:**
```typescript
// Check userData structure in subscribeToPresence:
console.log('Raw userData:', userData);
console.log('userData.presence:', userData?.presence);
console.log('Is online?', userData?.presence?.online);
```

#### Issue: Users appear/disappear randomly
**Root Cause:** Multiple setOnline/setOffline calls or race conditions
**Solution:**
```typescript
// Check for duplicate calls:
console.log('setOnline called for:', userId, 'at:', new Date());
// Should only see this ONCE per user authentication
```

---

## ⚡ Phase 3 Quick-Start (30-Second Test)

**Following:** `docs/templates/PR-QUICK-START-TEMPLATE.md`

### Prerequisites: Emulators running, app running

### Test Steps:
```bash
# Browser 1 (Normal)
1. Go to localhost:5173
2. Sign up as "Alice"
3. Move mouse over canvas
4. Check top-right: Should see "Online Users (1)" with Alice

# Browser 2 (Incognito)
1. Go to localhost:5173
2. Sign up as "Bob"
3. Move mouse over canvas
4. Check both browsers:
   - Should see 2 cursors moving
   - Should see "Online Users (2)" with Alice + Bob
   - Each browser shows other user's cursor + name
```

### Expected Result:
- ✅ Cursors move smoothly in both browsers
- ✅ Presence list shows: "Alice (you)" in Browser 1, "Bob (you)" in Browser 2
- ✅ Each browser shows the other user in presence list
- ✅ Colored dots match cursor colors

### If It Doesn't Work:
1. Open browser console → Look for presence-related logs
2. Open Emulator UI → Check RTDB data structure
3. Follow debugging guide above

---

**✅ CHECKPOINT:** ✅ **PHASE 3 STATUS - NEEDS DEBUGGING**
- ✅ Cursors working (confirmed - can see movement)
- ❌ Presence names not showing (reported bug)
- 🔧 Need to debug RTDB presence data flow

**NEXT STEPS:**
1. Run 30-second test above
2. Follow debugging guide if presence fails
3. Check console logs + RTDB emulator for data
4. Fix presence service subscription or data parsing

**⚡ TIME TO DEBUG:** ~15-30 minutes with systematic approach above

---

## Phase 4: Shape Creation + Real-Time Sync ⏱️ **3 hours** - SHOWCASE FEATURE
**Branch:** `feature/shape-creation`  
**Goal:** Click-and-drag rectangle creation with preview, synced across all users via Firestore

### 4.1 Define Firestore shape data model ⏱️ **15 min**
- [ ] Document collection: `canvases/main/shapes/{shapeId}`
- [ ] Define schema: `id`, `type`, `x`, `y`, `width`, `height`, `color`, `createdBy`, `createdAt`, `lockedBy`, `lockedAt`, `updatedAt`
- [ ] Plan individual document approach for scalability

### 4.2 Build CanvasService ⏱️ **45 min**
- [ ] Create `app/src/services/canvasService.ts`
- [ ] Implement `createShape(shapeData)` → Firestore
- [ ] Implement `updateShape(shapeId, updates)` for position changes
- [ ] Implement `subscribeToShapes(callback)` for real-time updates
- [ ] Implement `getShapes()` for initial load

### 4.3 Implement click-and-drag creation logic ⏱️ **1.5 hours** - REAL-TIME PREVIEW
- [ ] Detect mousedown on canvas background (not on existing shapes)
- [ ] Track mousemove to calculate current rectangle dimensions
- [ ] Display preview rectangle:
  - Light green outline and solid fill
- [ ] ⭐ **SHOWCASE:** All users see light green outline during creation (real-time feedback)
- [ ] On mouseup: finalize shape if dimensions ≥10x10px
- [ ] Handle negative drags (use Math.min/Math.abs and adjust position)
- [ ] Ensure shape creation doesn't conflict with canvas panning

### 4.4 Render shapes from Firestore ⏱️ **45 min**
- [ ] Map Firestore shape documents to Konva `<Rect>` components
- [ ] Apply color, position, and dimensions from document
- [ ] Handle initial fetch and real-time updates
- [ ] Verify shapes persist across page refresh

**✅ CHECKPOINT:**
- Users can create rectangles via click-drag
- Ignore tiny shapes (<10px)
- Other users see shapes in <100ms
- Preview displays during drag
- Shapes persist after refresh

---

## Phase 5: Shape Locking + Drag Movement ⏱️ **1.5 hours** - SIMPLIFIED
**Branch:** `feature/shape-locking`  
**Goal:** First-click wins locking with VISUAL FEEDBACK ONLY (no timeout, no cursor changes)

### 5.1 Implement SIMPLIFIED locking logic in CanvasService ⏱️ **45 min**
- [ ] Add `lockShape(shapeId, userId)` method:
  - Check if `lockedBy` exists and is not current user
  - If locked by another user, return false (lock failed)
  - Otherwise, set `{ lockedBy: userId, lockedAt: serverTimestamp() }`
- [ ] Add `unlockShape(shapeId)` method clearing lock fields
- [ ] ⚡ **REMOVED:** Auto-timeout logic (saves 30 minutes)

### 5.2 Implement shape selection and movement ⏱️ **45 min**
- [ ] On click: attempt to lock shape
- [ ] If lock acquired: show light green outline, enable dragging
- [ ] If lock failed: display light green outline (locked by other), prevent interaction
- [ ] On drag end: persist new `{x, y}` position, then unlock shape
- [ ] On deselect (click background): unlock shape
- [ ] ⚡ **REMOVED:** Cursor state changes (saves 15 minutes)

### 5.3 Basic lock cleanup ⏱️ **10 min** - MINIMAL
- [ ] Honor remote lock changes from Firestore listeners
- [ ] Clean up locks on user disconnect (via presence system)
- [ ] ⚡ **REMOVED:** Client-side timeout checks

### 5.4 Visual feedback ⏱️ **10 min** - BASIC ONLY
- [ ] Unlocked: solid color fill, no outline
- [ ] Active (locked by anyone): light green outline (`#10b981`, 2px)
- [ ] ⚡ **REMOVED:** Cursor hover effects

**✅ CHECKPOINT:**
- User A locks shape (light green outline), can drag
- User B sees light green outline, cannot interact (NO cursor feedback)
- Lock releases on deselect/drag-end
- Movement syncs in <100ms
- No stuck locks after refresh/disconnect

⚡ **SIMPLIFIED:** No timeout, no cursor state changes

---

## Phase 6: Testing + Deployment ⏱️ **2 hours** - FOCUSED APPROACH
**Branch:** `fix/testing-deploy`  
**Goal:** 4 Essential Tests + Security Rules + Production Deploy

### 6.1 Security rules ⏱️ **30 min**
- [ ] Write `firestore.rules` per PRD:
  - Users write own doc only
  - Shapes readable/writable by authenticated users
- [ ] Write `database.rules.json` with per-user node write restrictions
- [ ] Deploy rules to emulators for local testing

### 6.2 Essential automated tests ⏱️ **1 hour** - 4 TESTS ONLY
- [ ] Set up Vitest + React Testing Library
- [ ] **Test 1:** Authentication flow (signup and persist across refresh)
- [ ] **Test 2:** Cursor synchronization between users in real-time
- [ ] **Test 3:** Shape creation with real-time preview and sync
- [ ] **Test 4:** Basic locking (prevent simultaneous editing)
- [ ] ⚡ **REMOVED:** Comprehensive test suite (saves 60 minutes)

### 6.3 Manual testing ⏱️ **30 min** - 3-BROWSER METHOD
- [ ] Test with Chrome, Chrome Incognito, Firefox
- [ ] Core flow: Auth → Cursors → Real-time shape creation → Locking
- [ ] Performance check: 20+ shapes, 3 simultaneous users
- [ ] ⚡ **REMOVED:** Extensive polish tasks (saves 45 minutes)

**✅ CHECKPOINT:**
- Security rules deployed and tested
- All 4 essential tests passing
- Clean UX with no console errors

---

## Phase 7: Production Deployment ⏱️ **30 min** - STREAMLINED
**Branch:** `deploy/production`  
**Goal:** Deploy to Vercel and basic production testing

### 7.1 Build and deploy to Vercel ⏱️ **20 min**
- [ ] Run `cd app && npm run build` to create production bundle
- [ ] Deploy via `vercel --prod` or connect GitHub repository
- [ ] Obtain production URL

### 7.2 Configure production environment ⏱️ **10 min**
- [ ] Add Vercel domain to Firebase Authentication authorized domains
- [ ] Ensure `app/src/firebase.ts` uses production config when not in dev mode
- [ ] Deploy security rules to production Firebase project

### 7.3 Basic production testing ⏱️ **included**
- [ ] Test with 3+ users on deployed URL
- [ ] Verify core functionality works
- [ ] ⚡ **REMOVED:** Extensive stress testing (saves 30 minutes)

**✅ CHECKPOINT:**
- Public URL live and accessible
- Authentication works
- Real-time cursors and presence functional
- Shapes create/move/lock work across users

---

# 🎯 24-Hour Optimization Summary

## ⚡ Time Savings Applied:
- **Google OAuth removed:** -30 minutes setup and edge cases
- **Auto-timeout locking removed:** -30 minutes implementation  
- **"Not-allowed" cursor states removed:** -15 minutes development
- **Minimal UI styling:** -45 minutes visual polish
- **Focused testing:** -60 minutes (4 tests vs comprehensive suite)
- **Streamlined deployment:** -30 minutes stress testing

**Total Time Saved: ~3.5 hours** *(buffer increased from 14h to 17.5h)*

## ✅ Essential Features Kept:
- **Real-time shape preview** *(showcase feature for evaluators)*
- Firebase email/password authentication
- Cursor synchronization with names  
- Basic shape locking (visual feedback only)
- Multi-user real-time collaboration
- All bootcamp requirements met

## 🎯 Optimized Timeline:
- **Phase 0:** 30 min (setup)
- **Phase 1:** 1 hour (auth simplified)
- **Phase 2:** 2.5 hours (canvas foundation) 
- **Phase 3:** 2.5 hours (cursors + presence)
- **Phase 4:** 3 hours (shapes + **real-time preview**)
- **Phase 5:** 1.5 hours (simplified locking)
- **Phase 6:** 2 hours (focused testing + deploy)

**Core Development: 10.5 hours + 13.5 hours buffer = Realistic 24h success**

---

# ✅ MVP Completion Checklist

## Core Features (Must Have)
- [ ] Email/password authentication with username
- [ ] User cursor color assigned at signup
- [ ] RTDB cursors syncing at 20-30 FPS with <50ms latency
- [ ] Presence list with automatic disconnect handling
- [ ] 5000x5000 canvas with pan and zoom (cursor-centered)
- [ ] 2-color toolbar (Muted Sky Blue, Green) with default selection
- [ ] Click-and-drag rectangle creation with light green outline preview
- [ ] Minimum rectangle size enforcement (10x10px)
- [ ] Firestore shape sync with <100ms latency
- [ ] Simple shape locking (first-click wins, visual feedback ONLY - no timeout, no cursor changes)
- [ ] Drag to move shapes with position persistence
- [ ] Deployed to publicly accessible URL (Vercel)
- [ ] Tested with 3+ concurrent users
- [ ] Performance: 60 FPS maintained during interactions

## Performance Targets
- [ ] Cursors smooth at 20-30 FPS
- [ ] Shape operations complete in <100ms round trip
- [ ] 3+ concurrent users without noticeable degradation
- [ ] No memory leaks during extended sessions

---

# 🚫 Explicitly Out of Scope

## Features NOT Required
- Delete shapes functionality
- Resize handles or rotation
- Multi-select capability
- Shape property editing after creation
- Advanced color picker (hex input, gradients)
- Undo/redo functionality
- Export/save as image
- Keyboard shortcuts
- Mobile responsiveness
- Multiple canvases or workspaces

## Technical NOT Required
- Firestore transactions for locking (acceptable MVP limitation)
- Auto-timeout locking (removed for time savings)
- Cursor state changes ("not-allowed" cursors removed for time savings)
- Google OAuth (removed for time savings)
- Extensive UI polish (minimal styling for speed)
- Comprehensive testing (focused on 4 essential tests)
- AI agent features (planned for Phase 2)

---

# 📋 Development Principles

1. **Build sequentially** - Complete each phase before moving to the next
2. **Test with emulators first** - Verify all functionality locally before deploying
3. **Deploy early** - Aim to deploy by Phase 6 for early production testing
4. **Service layer is key** - All Firebase operations go through services for clean architecture
5. **Performance matters** - Monitor FPS and latency throughout development
6. **Document limitations** - Be transparent about race conditions and MVP scope
7. **Focus on showcase feature** - Real-time shape preview is key differentiator
8. **Time-box ruthlessly** - Stick to simplified scope to meet 24h deadline
9. **Visual feedback over complex UX** - Light green outline sufficient for MVP

---

# 🔮 Post-MVP Roadmap (Future Issues)
*Note: Create GitHub issues for these, not PRs yet*

- Upgrade to Firestore transactions for lock acquisition
- Implement delete shape functionality
- Add resize handles and rotation
- Build multi-select with shift-click
- Create full color picker with hex input
- Implement undo/redo system
- Add AI Agent with function calling to CanvasService
- Build workspace/project management
- Add mobile responsive design
- Implement keyboard shortcuts