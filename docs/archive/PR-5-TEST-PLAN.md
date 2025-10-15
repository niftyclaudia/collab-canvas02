# PR #5: Simple Locking + Drag Move - Test Plan

## Feature Overview
First-click wins shape locking system with 5-second timeout, visual feedback for lock states, and drag-to-move functionality for locked shapes in CollabCanvas.

## User Stories
- As a user, I want to click on a shape to lock it so I can move it without interference from other users
- As a user, I want to see when I have successfully locked a shape (green border) so I know I can edit it
- As a user, I want to see when another user has locked a shape (red border + lock icon) so I know not to try editing it
- As a user, I want to drag my locked shapes around the canvas so I can position them where needed
- As a user, I want my lock to automatically release when I'm done editing so others can use the shape
- As a user, I want to receive feedback when I try to interact with a locked shape so I understand why I can't edit it
- As a user, I want locks to timeout after reasonable inactivity so shapes don't get permanently stuck

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
- Canvas with pan/zoom working (from PR #2)  
- Shape creation working (from PR #4)
- At least 2-3 shapes already created on canvas for testing

## Test Scenarios

### 📋 Happy Path Tests

#### ✅ Basic Shape Locking - Single User
- [ ] Navigate to canvas with existing shapes
- [ ] Click on an unlocked shape (not drag, just click)
- [ ] **Expected:** Shape immediately shows green border (3px)
- [ ] **Expected:** Shape becomes draggable
- [ ] **Expected:** No console errors
- [ ] **Expected:** Lock acquisition happens within 100ms

#### ✅ Shape Movement - Locked by Me
- [ ] Lock a shape (green border visible)
- [ ] Click and drag the locked shape to a new position
- [ ] **Expected:** Shape follows cursor smoothly during drag
- [ ] **Expected:** Drag feels responsive with no lag
- [ ] **Expected:** Shape maintains locked appearance during drag
- [ ] Release mouse to complete drag
- [ ] **Expected:** Shape stays in new position
- [ ] **Expected:** Shape remains locked (green border)

#### ✅ Lock Release - Click Away (Deselect)
- [ ] Lock a shape (green border visible)
- [ ] Click on empty canvas background
- [ ] **Expected:** Shape lock releases immediately
- [ ] **Expected:** Green border disappears
- [ ] **Expected:** Shape returns to unlocked visual state
- [ ] **Expected:** Other users can now lock this shape

#### ✅ Lock Release - After Drag
- [ ] Lock a shape and drag it to new position
- [ ] Release mouse to complete drag operation
- [ ] **Expected:** Shape position updates and persists
- [ ] **Expected:** Lock releases automatically after drag completes
- [ ] **Expected:** Green border disappears
- [ ] **Expected:** Shape returns to unlocked visual state

#### ✅ Multi-User Lock Conflict Prevention
- [ ] **Browser A:** Click to lock Shape 1
- [ ] **Browser A:** Verify green border appears
- [ ] **Browser B:** Observe same Shape 1
- [ ] **Expected:** Browser B sees red border (3px) on Shape 1
- [ ] **Expected:** Browser B sees lock icon (🔒) on Shape 1
- [ ] **Expected:** Shape 1 appears at 50% opacity in Browser B
- [ ] **Browser B:** Try to click Shape 1
- [ ] **Expected:** No selection occurs, shape remains non-interactive
- [ ] **Expected:** Toast notification appears: "Shape locked by [username]"

#### ✅ Lock Takeover After Release
- [ ] **Browser A:** Lock a shape (green border)
- [ ] **Browser B:** Observe red border + lock icon
- [ ] **Browser A:** Click away to release lock
- [ ] **Expected:** Browser A sees shape return to unlocked state
- [ ] **Expected:** Browser B sees red border/lock icon disappear
- [ ] **Browser B:** Click to lock the same shape
- [ ] **Expected:** Browser B gets green border (successful lock)
- [ ] **Expected:** Browser A now sees red border + lock icon

### 🔍 Advanced Locking Tests

#### ⚠️ Lock Timeout Test (5 Second Auto-Release)
- [ ] **Browser A:** Lock a shape (green border)
- [ ] **Browser A:** Do not interact with shape for 6+ seconds
- [ ] **Expected:** Lock automatically releases after ~5 seconds
- [ ] **Expected:** Green border disappears in Browser A
- [ ] **Expected:** Red border/lock disappears in Browser B
- [ ] **Browser B:** Try to lock the shape
- [ ] **Expected:** Browser B can successfully acquire lock

#### ⚠️ Rapid Lock Attempts (Race Condition)
- [ ] **Setup:** Two users ready to click same shape simultaneously
- [ ] **Browser A & B:** Click same shape within <100ms of each other
- [ ] **Expected:** One browser gets green border (winner)
- [ ] **Expected:** Other browser sees red border + lock icon (loser)  
- [ ] **Expected:** Toast appears for losing user
- [ ] **Expected:** No stuck states or console errors

#### ⚠️ Lock During Drag Operation
- [ ] **Browser A:** Start dragging a locked shape
- [ ] **Browser B:** Try to click same shape while A is dragging
- [ ] **Expected:** Browser B sees red border + lock icon throughout drag
- [ ] **Expected:** Browser B cannot interact with shape
- [ ] **Browser A:** Complete drag operation
- [ ] **Expected:** Lock releases after drag completes
- [ ] **Expected:** Browser B can now attempt to lock shape

#### ⚠️ Multiple Shape Lock Management
- [ ] **Browser A:** Lock Shape 1 (green border)
- [ ] **Browser A:** Click Shape 2 while Shape 1 still locked
- [ ] **Expected:** Shape 1 lock releases (green border disappears)
- [ ] **Expected:** Shape 2 gets locked (green border appears)
- [ ] **Expected:** User can only lock one shape at a time
- [ ] **Browser B:** Observe both shapes
- [ ] **Expected:** Shape 1 becomes available, Shape 2 shows locked

### 🌐 Real-Time Sync Tests

#### 🚀 Lock State Sync Speed
- [ ] **Browser A:** Click to lock a shape
- [ ] **Browser B:** Measure time until red border appears
- [ ] **Expected:** Lock state sync within <100ms
- [ ] **Expected:** Visual feedback appears smoothly, no flicker
- [ ] **Browser A:** Release lock (click away)
- [ ] **Browser B:** Measure time until lock indicators disappear
- [ ] **Expected:** Release sync within <100ms

#### 🚀 Drag Position Sync
- [ ] **Browser A:** Lock and drag a shape across canvas
- [ ] **Browser B:** Observe shape movement
- [ ] **Expected:** Shape position updates in real-time during drag
- [ ] **Expected:** Movement sync within <100ms
- [ ] **Expected:** Smooth movement, no stuttering or jumps
- [ ] **Browser A:** Complete drag
- [ ] **Expected:** Final position syncs to Browser B
- [ ] **Expected:** Both browsers show identical final position

#### 🚀 Presence Integration
- [ ] **Browser A:** Lock a shape
- [ ] Check presence list for both users
- [ ] **Expected:** Presence list continues to work normally
- [ ] **Expected:** Both users remain visible as online
- [ ] **Expected:** Cursor tracking still works while shape is locked

### 🛡️ Error Handling & Edge Cases

#### ⚠️ Lock Conflict Toast Messages
- [ ] **Browser A:** Lock Shape 1
- [ ] **Browser B:** Try to click locked Shape 1
- [ ] **Expected:** Toast appears: "Shape locked by [A's username]"
- [ ] **Expected:** Toast is visible and clear
- [ ] **Expected:** Toast auto-dismisses after few seconds
- [ ] Try with different usernames to verify dynamic message

#### ⚠️ Disconnect During Lock
- [ ] **Browser A:** Lock a shape (green border)
- [ ] **Browser B:** Verify red border + lock icon
- [ ] **Browser A:** Close browser/tab completely
- [ ] **Expected:** Lock releases within 5-10 seconds
- [ ] **Expected:** Browser B sees lock indicators disappear
- [ ] **Browser B:** Try to lock the shape
- [ ] **Expected:** Lock acquisition succeeds

#### ⚠️ Refresh During Lock
- [ ] **Browser A:** Lock a shape
- [ ] **Browser B:** Observe locked state
- [ ] **Browser A:** Refresh page (Ctrl+R)
- [ ] **Expected:** Lock releases when A refreshes
- [ ] **Expected:** Browser B sees shape become available
- [ ] **Browser A:** After reload, try to lock same shape
- [ ] **Expected:** Lock acquisition works normally

#### ⚠️ Network Interruption Handling
- [ ] **Browser A:** Lock a shape
- [ ] **Browser A:** Disable network/go offline for 10 seconds
- [ ] **Browser B:** Observe shape state
- [ ] **Expected:** Lock releases due to disconnect after timeout
- [ ] **Browser A:** Re-enable network
- [ ] **Expected:** App reconnects and functions normally
- [ ] **Expected:** No stuck locks or broken states

### 📱 UI/UX Visual Feedback Tests

#### 🎨 Lock Visual States
- [ ] **Unlocked shape:** Default appearance
- [ ] **Expected:** Shape uses user-defined color
- [ ] **Expected:** No border or minimal border on hover
- [ ] **Locked by me:** Green border state
- [ ] **Expected:** 3px green border clearly visible
- [ ] **Expected:** Shape remains at full opacity
- [ ] **Expected:** Draggable cursor appears on hover
- [ ] **Locked by other:** Red border + lock icon
- [ ] **Expected:** 3px red border clearly visible
- [ ] **Expected:** Lock icon (🔒) visible and positioned appropriately
- [ ] **Expected:** Shape appears at 50% opacity
- [ ] **Expected:** No draggable cursor on hover

#### 🎨 Visual Transition Quality
- [ ] Lock a shape and observe border appearance
- [ ] **Expected:** Border appears smoothly, no flash
- [ ] **Expected:** Color transition is immediate and clear
- [ ] Release lock and observe transition
- [ ] **Expected:** Border disappears smoothly
- [ ] **Expected:** No visual artifacts or rendering issues
- [ ] Test with different shape colors
- [ ] **Expected:** Lock indicators work with all shape colors

#### 🎨 Lock Icon Positioning
- [ ] Lock shapes in different canvas positions (corners, center)
- [ ] **Expected:** Lock icon always visible and well-positioned
- [ ] **Expected:** Lock icon doesn't overlap shape content unnecessarily
- [ ] Test with very small shapes (near minimum 10x10)
- [ ] **Expected:** Lock icon remains visible even on small shapes
- [ ] Test with very large shapes
- [ ] **Expected:** Lock icon positioned consistently

### ⚡ Performance Tests

#### 🚀 Lock/Unlock Performance
- [ ] Rapidly lock and unlock shapes (10 shapes, 20 operations)
- [ ] **Expected:** Each operation completes within 100ms
- [ ] **Expected:** No performance degradation over time
- [ ] **Expected:** UI remains responsive throughout
- [ ] Monitor browser dev tools during rapid operations
- [ ] **Expected:** No memory leaks or excessive DOM operations

#### 🚀 Multi-User Locking Performance
- [ ] **3+ browsers:** Each user rapidly attempts to lock different shapes
- [ ] **Expected:** All operations complete smoothly
- [ ] **Expected:** No conflicts or race conditions
- [ ] **Expected:** Lock state sync remains <100ms
- [ ] **Expected:** No performance impact on cursor tracking

#### 🚀 Canvas Performance with Locks
- [ ] Lock multiple shapes (5-10 shapes)
- [ ] Test pan and zoom operations
- [ ] **Expected:** Canvas maintains 60 FPS during pan/zoom
- [ ] **Expected:** Lock indicators move smoothly with canvas
- [ ] Drag locked shapes while other users observe
- [ ] **Expected:** Drag performance remains smooth at 60 FPS

### 🧪 Integration Tests

#### 🔗 Canvas Context Integration
- [ ] Verify lock state persists in canvas context
- [ ] **Expected:** Selected shape state managed correctly
- [ ] **Expected:** Lock state survives component re-renders
- [ ] **Expected:** Context provides lock methods to all components

#### 🔗 Service Layer Integration
- [ ] Verify CanvasService.lockShape() method works
- [ ] **Expected:** Lock acquisition returns success/failure status
- [ ] Verify CanvasService.unlockShape() method works
- [ ] **Expected:** Lock release persists to Firestore
- [ ] Check service method error handling
- [ ] **Expected:** Network errors handled gracefully

#### 🔗 Authentication Integration
- [ ] Test locking with different authenticated users
- [ ] **Expected:** User identification works correctly in locks
- [ ] **Expected:** Username appears correctly in toast messages
- [ ] Test lock behavior when user logs out
- [ ] **Expected:** Locks release when user session ends

## Success Criteria

### ✅ Core Locking Functionality
- [ ] Users can click shapes to acquire locks successfully
- [ ] First-click wins for simultaneous lock attempts (within reasonable race condition limits)
- [ ] Visual feedback clearly shows locked-by-me (green border) vs locked-by-other (red border + lock icon)
- [ ] Locks automatically release on deselect (click away)
- [ ] Locks automatically release after drag completion
- [ ] Locks automatically timeout after 5 seconds of inactivity
- [ ] Toast notifications appear for failed lock attempts with correct username

### ✅ Shape Movement Requirements
- [ ] Locked shapes can be dragged smoothly around canvas
- [ ] Drag movement syncs to other users within <100ms
- [ ] Drag operations feel responsive with no lag
- [ ] Shape position persists correctly after drag completion
- [ ] Lock releases automatically after successful drag

### ✅ Multi-User Sync Requirements
- [ ] Lock state changes sync between users within <100ms
- [ ] Visual lock indicators (borders, icons, opacity) update in real-time
- [ ] Lock conflicts prevented - only one user can lock shape at a time
- [ ] Lock release immediately makes shape available to other users
- [ ] No stuck locks after disconnect, refresh, or network issues

### ✅ Visual Feedback Requirements
- [ ] Green border (3px) clearly indicates "locked by me"
- [ ] Red border (3px) + lock icon indicates "locked by other"
- [ ] 50% opacity for shapes locked by others
- [ ] Lock icon (🔒) visible and well-positioned
- [ ] Visual transitions are smooth without flicker or artifacts
- [ ] Lock indicators work with all shape colors and sizes

### ✅ Error Handling & Edge Cases
- [ ] Toast notifications for lock conflicts: "Shape locked by [username]"
- [ ] Automatic cleanup of locks on disconnect/refresh
- [ ] Race condition handling (acceptable MVP limitation documented)
- [ ] Network interruption recovery
- [ ] No console errors during normal locking operations

### ✅ Performance Requirements
- [ ] Lock/unlock operations complete within 100ms
- [ ] Canvas maintains 60 FPS during shape dragging
- [ ] Lock indicators move smoothly with pan/zoom operations
- [ ] No performance degradation with multiple locked shapes
- [ ] Multi-user locking doesn't impact cursor tracking performance

### ✅ Integration Requirements
- [ ] Locking system works with existing authentication
- [ ] Lock state managed through CanvasService properly
- [ ] Integrates with existing shape creation and canvas context
- [ ] Presence system continues working during shape locking
- [ ] Canvas pan/zoom/color selection unaffected by locking

## Known Limitations

### Race Condition Window (~50ms)
- **Issue:** If two users click same shape within ~50ms, last-write-wins may cause wrong user to get lock
- **Impact:** Low probability with 2-5 users in typical usage
- **Mitigation:** Toast notification to losing user, can retry immediately
- **Future Fix:** Upgrade to Firestore transactions (post-MVP)

### Single Shape Selection
- **Issue:** Users can only lock one shape at a time (no multi-select)
- **Impact:** Cannot move multiple shapes simultaneously
- **Status:** By design for MVP simplicity

### Basic Lock Timeout
- **Issue:** 5-second timeout is client-side check, not server-enforced
- **Impact:** Slight inconsistency possible if client clocks differ
- **Status:** Acceptable for MVP, server-side timeout in post-MVP

### No Lock Persistence
- **Issue:** Locks don't survive browser refresh (by design)
- **Impact:** Refreshing releases all locks
- **Status:** Intentional to prevent stuck locks

## Integration Points for Next PRs

- **PR #6:** Security rules will validate lock operations and ensure proper user permissions
- **PR #6:** Tests will cover locking system thoroughly with automated test suite
- **PR #6:** Polish will improve visual feedback and error handling

## Next Steps After This PR

- **PR #6:** Rules, Testing, Polish - comprehensive security rules and automated tests for locking system
- Integration with future features (multi-select, advanced shape operations)
- Potential upgrade to Firestore transactions for race condition elimination

---

## Testing Notes

### Recommended Testing Order
1. **Single User Tests:** Verify basic locking mechanics work
2. **Multi-User Tests:** Test conflict prevention and sync
3. **Edge Cases:** Network issues, disconnect, rapid operations  
4. **Performance Tests:** Ensure 60 FPS and <100ms sync targets
5. **Integration Tests:** Verify compatibility with existing features

### Testing Tips
- Use browser dev tools to monitor network requests and performance
- Test with Firebase Emulator UI to observe Firestore document changes
- Use multiple browser types (Chrome, Firefox, Safari) for compatibility
- Test on different network conditions (slow 3G simulation)
- Clear browser cache between test sessions to avoid state issues

### Bug Reporting Format
When reporting issues, include:
- Browser type and version
- Steps to reproduce
- Expected vs actual behavior  
- Screenshots of visual issues
- Console errors (if any)
- Network conditions during test
