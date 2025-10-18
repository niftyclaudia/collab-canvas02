## PR 1.3 Multi-Select (Shift+Click & Marquee Selection)
**Branch:** `feature/multi-select`  
**Goal:** Enable selecting multiple shapes for group operations  
**Time Estimate:** 7 hours

### Why This PR?
- **CRITICAL for rubric:** Required for "Excellent" score in Canvas Functionality
- Foundation for grouping, alignment, batch operations
- High user value for professional workflows

### Prerequisites
- ✅ Part 1 complete (all shape types, delete, duplicate working)
- ✅ Selection state exists (single shape selection)
- ✅ Canvas context manages selected shapes

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-1.3-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 1.3.1 Update Selection State (1 hour)

**Sub-task 1.3.1a: Change selection state to array**
- [x] In CanvasContext, change `selectedShape: string | null` to `selectedShapes: string[]`
- [x] Update initial state to empty array: `[]`
- [x] Update TypeScript types

**🧪 TEST 1.3.1a:**
```
✅ PASS: Check TypeScript compilation → No errors
         Console → Check context.selectedShapes → Shows [] (empty array)
❌ FAIL: TypeScript errors or state not array
```

**Sub-task 1.3.1b: Update all components using selection**
- [x] Find all usages of `selectedShape` in components
- [x] Update to use `selectedShapes` array
- [x] Single selection: `selectedShapes[0]`
- [x] Check if selected: `selectedShapes.includes(shapeId)`

**🧪 TEST 1.3.1b:**
```
✅ PASS: Click a shape → selectedShapes contains that shape ID
         Click background → selectedShapes becomes []
         No console errors
❌ FAIL: Selection broken or console errors
```

**Sub-task 1.3.1c: Add selection helper functions**
- [x] Add `toggleSelection(shapeId)`: add if not present, remove if present
- [x] Add `setSelection(shapeIds)`: replace entire selection
- [x] Add `clearSelection()`: set to []

**🧪 TEST 1.3.1c:**
```
✅ PASS: Console → context.toggleSelection('shape-1')
         → selectedShapes includes 'shape-1'
         Call again → selectedShapes doesn't include 'shape-1'
❌ FAIL: Helper functions don't work correctly
```

#### 1.3.2 Implement Shift+Click Selection (1.5 hours)

**Sub-task 1.3.2a: Add Shift key detection**
- [x] In shape click handler, check `event.shiftKey`
- [x] If Shift held: call `toggleSelection(shapeId)`
- [x] If Shift not held: call `setSelection([shapeId])`

**🧪 TEST 1.3.2a:**
```
✅ PASS: Click shape → Only that shape selected
         Shift+Click another shape → Both shapes selected
         Shift+Click first shape again → Only second shape selected
❌ FAIL: Shift key not detected or selection logic broken
```

**Sub-task 1.3.2b: Add multi-select visual feedback**
- [x] In Canvas.tsx rendering, check if shape is in selectedShapes array
- [x] If selected: add blue border (3px, #3b82f6) to shape
- [x] All selected shapes show blue border simultaneously

**🧪 TEST 1.3.2b:**
```
✅ PASS: Select 3 shapes with shift-click
         → All 3 shapes show blue border
         → Border clearly visible
❌ FAIL: Borders don't appear or only one shows
```

**Sub-task 1.3.2c: Update controls panel for multi-select**
- [x] When selectedShapes.length > 1, show "X shapes selected"
- [x] Show Delete and Duplicate buttons for multi-select
- [x] Hide resize/rotate handles when multiple selected

**🧪 TEST 1.3.2c:**
```
✅ PASS: Select 3 shapes → Controls show "3 shapes selected"
         → Delete and Duplicate buttons visible
         → Resize handles hidden (only show for single shape)
❌ FAIL: Controls don't update or show wrong count
```

#### 1.3.3 Implement Marquee Selection (2 hours)

**Sub-task 1.3.3a: Add marquee state and mousedown handler**
- [x] Add state: `marquee: { startX, startY, endX, endY } | null`
- [x] On canvas background mousedown: set marquee start position
- [x] Detect background vs shape click

**🧪 TEST 1.3.3a:**
```
✅ PASS: Click and hold on empty canvas area
         → Console log shows marquee state with startX, startY
         Click on a shape → Marquee doesn't start
❌ FAIL: Marquee starts when clicking shapes, or doesn't start at all
```

**Sub-task 1.3.3b: Implement marquee visual during drag**
- [x] On mousemove (while marquee active): update endX, endY
- [x] Render Konva rectangle showing marquee bounds
- [x] Visual: dashed blue border (stroke), semi-transparent blue fill (opacity 0.2)

**🧪 TEST 1.3.3b:**
```
✅ PASS: Click and drag on canvas → Blue dashed rectangle appears
         → Rectangle grows/shrinks with mouse movement
         → Dashed border and transparent fill visible
❌ FAIL: Rectangle doesn't appear or wrong styling
```

**Sub-task 1.3.3c: Calculate intersecting shapes on mouseup**
- [x] On mouseup: get marquee final bounds
- [x] Loop through all shapes
- [x] For each shape, check if bounding box intersects marquee rectangle
- [x] Collect IDs of intersecting shapes

**🧪 TEST 1.3.3c:**
```
✅ PASS: Create 5 shapes on canvas
         → Draw marquee over 3 of them
         → Console log shows array of 3 shape IDs
❌ FAIL: Wrong shapes detected or intersection calculation broken
```

**Sub-task 1.3.3d: Update selection based on Shift key**
- [x] If Shift held during mouseup: add intersecting shapes to current selection
- [x] If Shift not held: replace selection with intersecting shapes
- [x] Clear marquee state after selection

**🧪 TEST 1.3.3d:**
```
✅ PASS: Draw marquee over 2 shapes → 2 shapes selected
         Hold Shift, draw marquee over 2 more → All 4 selected
         Draw marquee without Shift → Only new marquee shapes selected
❌ FAIL: Selection doesn't update or Shift logic broken
```

#### 1.3.4 Multi-Shape Operations (0.5 hours)

**Sub-task 1.3.4a: Implement multi-shape drag**
- [x] When dragging a selected shape, check if selectedShapes.length > 1
- [x] Calculate offset from drag (deltaX, deltaY)
- [x] Apply same offset to all selected shapes
- [x] Maintain relative positions

**🧪 TEST 1.3.4a:**
```
✅ PASS: Select 3 shapes → Drag any one of them
         → All 3 shapes move together
         → Relative spacing maintained
         → Check Firestore → All 3 shapes' positions updated
❌ FAIL: Only one shape moves, or positions not updated
```

**Sub-task 1.3.4b: Implement multi-shape delete**
- [x] When Delete button clicked with multiple selected
- [x] Call `deleteShape()` for each selected shape
- [x] Show toast: "Deleted X shapes"

**🧪 TEST 1.3.4b:**
```
✅ PASS: Select 4 shapes → Click Delete
         → All 4 shapes disappear
         → Toast "Deleted 4 shapes"
         → Check Firestore → All 4 documents deleted
❌ FAIL: Not all shapes deleted or toast wrong
```

**Sub-task 1.3.4c: Implement multi-shape duplicate**
- [x] When Duplicate clicked with multiple selected
- [x] Call `duplicateShape()` for each selected shape
- [x] All duplicates share same 20px offset
- [x] Show toast: "Duplicated X shapes"

**🧪 TEST 1.3.4c:**
```
✅ PASS: Select 3 shapes → Click Duplicate
         → 3 new shapes appear, all offset by 20px
         → Toast "Duplicated 3 shapes"
         → Check Firestore → 6 total shapes (3 original + 3 duplicates)
❌ FAIL: Duplicates not created or wrong positions
```

#### 1.3.5 Add Keyboard Shortcuts (0.5 hours)

**Sub-task 1.3.5a: Implement keyboard shortcuts**
- [x] Ctrl+A: Select all shapes
- [x] Escape: Clear selection
- [x] Ctrl+D: Duplicate selected shapes
- [x] Delete: Delete selected shapes

**🧪 TEST 1.3.5a:**
```
✅ PASS: Ctrl+A selects all shapes on canvas
         Escape clears selection
         Ctrl+D duplicates selected shapes
         Delete removes selected shapes
❌ FAIL: Keyboard shortcuts don't work
```

#### 1.3.6 Performance Optimization (1 hour)

**Sub-task 1.3.6a: Optimize for large canvases**
- [ ] Limit selection indicators to 50 shapes max
- [ ] Use requestAnimationFrame for marquee updates
- [ ] Debounce intersection calculations (100ms delay)
- [ ] Add loading states for large operations

**🧪 TEST 1.3.6a:**
```
✅ PASS: 100+ shapes on canvas → smooth marquee selection
         Selection indicators limited to 50 max
         No performance lag during operations
         Loading spinner appears for 50+ shape operations
❌ FAIL: Laggy performance or visual glitches
```

#### 1.3.7 Error Handling (0.5 hours)

**Sub-task 1.3.7a: Add robust error handling**
- [ ] Handle Firestore connection errors gracefully
- [ ] Show retry buttons for failed operations
- [ ] Add offline mode detection
- [ ] Log errors for debugging

**🧪 TEST 1.3.7a:**
```
✅ PASS: Disconnect internet → Operations show retry buttons
         Failed operations show retry option
         Console logs detailed error information
❌ FAIL: App crashes on network errors
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Shift+Click Selection
- [ ] User A clicks rectangle → selected (blue border)
- [ ] User A shift-clicks circle → both selected (2 blue borders)
- [ ] User A shift-clicks triangle → all 3 selected
- [ ] User A shift-clicks rectangle again → deselects (only circle + triangle selected)
- [ ] User B sees selection borders in real-time
- [ ] Click background → clears all selections

#### Marquee Selection
- [ ] User A drags rectangle on empty canvas → marquee appears (dashed blue)
- [ ] Marquee follows mouse with semi-transparent fill
- [ ] Release → all shapes inside marquee selected
- [ ] User A shift-drags another marquee → adds to current selection
- [ ] User A drags marquee without Shift → replaces selection
- [ ] User B sees all selection changes

#### Multi-Shape Operations
- [ ] Select 3 shapes → drag one → all 3 move together
- [ ] User B sees all shapes moving in sync
- [ ] Select 3 shapes → click Delete → all deleted
- [ ] Select 3 shapes → click Duplicate → 3 new shapes appear with offset
- [ ] Controls panel shows "3 shapes selected"

**Performance:**
- [ ] Marquee drawing is smooth (60 FPS)
- [ ] Intersection calculation is fast (<16ms)
- [ ] Works with 50+ shapes on canvas
- [ ] Selection indicators limited to 50 max for performance
- [ ] Keyboard shortcuts respond instantly

**Accessibility:**
- [ ] Screen reader announces selection changes
- [ ] Keyboard navigation works for all features
- [ ] High contrast mode supported
- [ ] Focus indicators visible

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR 1.4

---

## PR 1.4: Object Grouping & Ungrouping
**Branch:** `feature/grouping`  
**Goal:** Group multiple shapes to move together as one unit  
**Time Estimate:** 6 hours

### Why This PR?
- **Tier 1 rubric feature:** Worth 2 points
- Essential for professional workflows
- Foundation for complex designs (forms, components)

### Prerequisites
- ✅ PR #5 complete (multi-select working)
- ✅ Can select 2+ shapes easily
- ✅ Firestore batch writes supported

### Implementation Guide
- [ ] **FIRST:** Create `/docs/implementation-guides/PR-1.4-implementation-guide.md`
- [ ] **WAIT FOR GREEN LIGHT** before coding

### Task Breakdown

#### 1.4.1 Add Firestore Groups Collection (0.5 hours)

**Sub-task 1.4.1a: Add groupId field to shapes**
- [ ] Update Shape TypeScript interface: add `groupId?: string | null`
- [ ] Existing shapes work with undefined groupId (fallback to null)

**🧪 TEST 1.4.1a:**
```
✅ PASS: TypeScript compiles with no errors
         Existing shapes still render correctly
❌ FAIL: TypeScript errors
```

**Sub-task 1.4.1b: Define Group interface**
- [ ] Create Group interface: `{ id, name, shapeIds[], createdBy, createdAt }`
- [ ] Add to types file

**🧪 TEST 1.4.1b:**
```
✅ PASS: TypeScript recognizes Group type
         Can create test Group object without errors
❌ FAIL: Type errors
```

#### 1.4.2 Extend CanvasService for Grouping (2 hours)

**Sub-task 1.4.2a: Add groupShapes() method skeleton**
- [ ] Add `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>`
- [ ] Create group document in `canvases/main/groups` collection
- [ ] Return group ID

**🧪 TEST 1.4.2a:**
```
✅ PASS: Console → canvasService.groupShapes(['shape1', 'shape2'], 'user-id')
         → Check Firestore → Group document created with shapeIds array
❌ FAIL: Group document not created
```

**Sub-task 1.4.2b: Update shapes with groupId (batch write)**
- [ ] In groupShapes(), create Firestore batch
- [ ] For each shapeId, update shape document with groupId
- [ ] Commit batch write
- [ ] All shapes updated atomically

**🧪 TEST 1.4.2b:**
```
✅ PASS: Create 3 shapes → Group them
         → Check Firestore → All 3 shapes have same groupId
         → groupId matches the group document ID
❌ FAIL: Shapes missing groupId or values don't match
```

**Sub-task 1.4.2c: Add ungroupShapes() method**
- [ ] Add `ungroupShapes(groupId: string): Promise<void>`
- [ ] Fetch group document to get shapeIds
- [ ] Create batch write to remove groupId from all shapes (set to null)
- [ ] Delete group document
- [ ] Commit batch

**🧪 TEST 1.4.2c:**
```
✅ PASS: Group 3 shapes → Call ungroupShapes(groupId)
         → Check Firestore → All shapes have groupId = null
         → Group document deleted
❌ FAIL: groupId not cleared or group document still exists
```

**Sub-task 1.4.2d: Add subscribeToGroups() for real-time updates**
- [ ] Add `subscribeToGroups(callback): () => void`
- [ ] Subscribe to groups collection with onSnapshot
- [ ] Return unsubscribe function

**🧪 TEST 1.4.2d:**
```
✅ PASS: Call subscribeToGroups((groups) => console.log(groups))
         → Create a group in Firestore → Console logs new group
         → Delete group → Console logs updated list
❌ FAIL: Subscription doesn't fire or data wrong
```

#### 1.4.3 Build Grouping UI (1.5 hours)

**Sub-task 1.4.3a: Add Group button to controls**
- [ ] When selectedShapes.length >= 2, show "Group" button
- [ ] Button positioned in controls panel
- [ ] Styled consistently with other buttons

**🧪 TEST 1.4.3a:**
```
✅ PASS: Select 1 shape → Group button hidden
         Select 2+ shapes → Group button appears
❌ FAIL: Button doesn't appear or appears with wrong count
```

**Sub-task 1.4.3b: Wire up Group button**
- [ ] onClick → call `canvasService.groupShapes(selectedShapes, userId)`
- [ ] Show toast: "Grouped X shapes"
- [ ] Keep shapes selected after grouping

**🧪 TEST 1.4.3b:**
```
✅ PASS: Select 3 shapes → Click Group button
         → Toast "Grouped 3 shapes"
         → Check Firestore → Group created, shapes have groupId
❌ FAIL: Group not created or toast not shown
```

**Sub-task 1.4.3c: Implement group selection logic**
- [ ] When clicking a shape, check if it has groupId
- [ ] If groupId exists, fetch all shapes with same groupId
- [ ] Select entire group (set selectedShapes to all group members)

**🧪 TEST 1.4.3c:**
```
✅ PASS: Group 3 shapes → Click any one shape
         → All 3 shapes selected (blue borders on all)
❌ FAIL: Only one shape selected, or wrong shapes selected
```

**Sub-task 1.4.3d: Add Ungroup button**
- [ ] When all selectedShapes have same groupId, show "Ungroup" button
- [ ] onClick → call `canvasService.ungroupShapes(groupId)`
- [ ] Show toast: "Ungrouped X shapes"

**🧪 TEST 1.4.3d:**
```
✅ PASS: Select grouped shapes → Ungroup button appears
         Click Ungroup → Toast "Ungrouped X shapes"
         → Check Firestore → groupId removed, group deleted
❌ FAIL: Ungroup doesn't work or shapes still grouped
```

**Sub-task 1.4.3e: Add dashed border visual for groups**
- [ ] When grouped shapes selected, show dashed border instead of solid
- [ ] Dashed blue border indicates group membership

**🧪 TEST 1.4.3e:**
```
✅ PASS: Select grouped shapes → Dashed blue border appears
         Select non-grouped shapes → Solid blue border
❌ FAIL: No visual distinction or border style wrong
```

#### 1.4.4 Implement Group Operations (1 hour)

**Sub-task 1.4.4a: Group drag behavior**
- [ ] When dragging a grouped shape, detect if shape has groupId
- [ ] If grouped, apply drag offset to all shapes in group
- [ ] Use batch write to update all positions

**🧪 TEST 1.4.4a:**
```
✅ PASS: Group 3 shapes → Drag any one
         → All 3 move together maintaining relative positions
         → Check Firestore → All 3 positions updated
❌ FAIL: Only one moves or positions wrong
```

**Sub-task 1.4.4b: Group delete behavior**
- [ ] When deleting grouped shapes, delete entire group
- [ ] Delete all shapes in group + group document

**🧪 TEST 1.4.4b:**
```
✅ PASS: Select grouped shapes → Click Delete
         → All shapes disappear
         → Check Firestore → All shapes deleted + group document deleted
❌ FAIL: Some shapes remain or group document remains
```

**Sub-task 1.4.4c: Group duplicate behavior**
- [ ] When duplicating grouped shapes, duplicate entire group
- [ ] Create new group for duplicates
- [ ] All duplicates have same groupId (new group)

**🧪 TEST 1.4.4c:**
```
✅ PASS: Select grouped shapes (3) → Click Duplicate
         → 3 new shapes appear offset by 20px
         → Check Firestore → New group document + 6 shapes total (2 groups of 3)
❌ FAIL: Duplicates not grouped or counts wrong
```

#### 1.4.5 Group Management Features (1 hour)

**Sub-task 1.4.5a: Group naming**
- [ ] Allow custom group names (default: "Group 1", "Group 2")
- [ ] Show group name in controls panel
- [ ] Add group name to Firestore group document
- [ ] Add rename functionality

**🧪 TEST 1.4.5a:**
```
✅ PASS: Create group → Default name "Group 1" appears
         Click rename → Can edit group name
         Check Firestore → Group document has name field
❌ FAIL: No naming or rename doesn't work
```

**Sub-task 1.4.5b: Group validation**
- [ ] Prevent creating groups with 0 shapes
- [ ] Prevent nested groups (check if shapes already grouped)
- [ ] Validate group operations before execution
- [ ] Show error messages for invalid operations

**🧪 TEST 1.4.5b:**
```
✅ PASS: Try to group 0 shapes → Error message shown
         Try to group already-grouped shapes → Error message shown
         Valid grouping works normally
❌ FAIL: Invalid operations succeed or no error messages
```

**Sub-task 1.4.5c: Enhanced group visual feedback**
- [ ] Show group name in dashed border
- [ ] Add group count indicator
- [ ] Highlight group members on hover
- [ ] Add group outline when partially selected

**🧪 TEST 1.4.5c:**
```
✅ PASS: Group shows name in border
         Hover over group member → All members highlight
         Partial selection shows group outline
❌ FAIL: No visual feedback or wrong indicators
```

### Gatekeeper Testing (Deploy & Manual Test)

**Test with 2 users:**

#### Grouping
- [ ] User A selects 3 rectangles (shift-click or marquee)
- [ ] "Group" button appears in controls
- [ ] User A clicks Group → shapes grouped
- [ ] Toast shows "Grouped 3 shapes"
- [ ] User B sees group created
- [ ] Click any shape in group → entire group selected (dashed border)
- [ ] User B clicks shape in group → entire group selected for User B too

#### Group Operations
- [ ] User A drags one shape in group → entire group moves together
- [ ] User B sees all shapes moving in sync
- [ ] User A clicks Delete → entire group deleted
- [ ] User B sees all shapes disappear
- [ ] User A groups 3 shapes, clicks Duplicate → 3 new grouped shapes appear
- [ ] New shapes are also grouped together

#### Ungrouping
- [ ] User A selects grouped shapes → "Ungroup" button appears
- [ ] User A clicks Ungroup → shapes ungrouped
- [ ] Toast shows "Ungrouped X shapes"
- [ ] Can now select shapes individually
- [ ] User B sees ungroup take effect

**Edge Cases:**
- [ ] Group with mixed shape types (rectangles, circles, text) works
- [ ] Group with rotated shapes maintains rotations
- [ ] Group with formatted text preserves formatting
- [ ] Cannot create nested groups (document limitation)
- [ ] Group naming works with special characters
- [ ] Large groups (20+ shapes) perform smoothly
- [ ] Group operations work with locked shapes

**Performance:**
- [ ] Group operations complete in <2 seconds
- [ ] Large groups don't cause UI lag
- [ ] Batch operations are atomic
- [ ] Real-time updates are smooth

**Accessibility:**
- [ ] Group names are announced by screen readers
- [ ] Group operations work with keyboard only
- [ ] Visual indicators are clear in high contrast mode

**✅ CHECKPOINT:** All tests pass → Deploy to production → Move to PR 1.5