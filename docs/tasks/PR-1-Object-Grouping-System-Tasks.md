# Task List: Object Grouping System — Implementation Tasks

**PR Number:** #1

**Feature:** Object Grouping System

**Agent:** Alex (PM Agent)

**Status:** Ready for Development

**Estimated Time:** 5-6 hours

**Project:** CollabCanvas - Real-time collaborative design tool with AI assistance

**Note**: This task list is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## Pre-Task Creation Checklist (PM Agent)

- [x] Read PR brief in `docs/prd-briefs.md`
- [x] Read architecture doc `docs/architecture.md`
- [x] Read full feature context `docs/prd-full-features.md`
- [x] Create PRD using `agent/prd-template.md`
- [x] Review existing codebase patterns in `app/src/`
- [x] Understand real-time collaboration requirements
- [x] Define performance requirements (60 FPS, <100ms sync)

---

## Implementation Tasks (For Builder Agent)

### Phase 1: Service Layer (Foundation)
- [x] **Task 1.1**: Create group service methods in CanvasService
  - [x] Method: `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>`
  - [x] Method: `ungroupShapes(groupId: string): Promise<void>`
  - [x] Method: `getGroup(groupId: string): Promise<Group | null>`
  - [x] Method: `getShapesInGroup(groupId: string): Promise<Shape[]>`
  - [x] Method: `moveGroup(groupId: string, deltaX: number, deltaY: number): Promise<void>`
  - [x] Method: `deleteGroup(groupId: string): Promise<void>`
  - [x] Method: `duplicateGroup(groupId: string, offsetX: number, offsetY: number): Promise<string[]>`
  - [x] Method: `subscribeToGroups(canvasId: string, cb: (groups: Group[]) => void): Unsubscribe`
  - [x] Error handling: Network failures, invalid shapeIds, permission errors
  - [x] Examples: Follow patterns in `app/src/services/canvasService.ts`
  - [x] **Gate**: All service methods exist and are testable

- [x] **Task 1.2**: Add Firestore data model for groups
  - [x] Collection: `canvases/main/groups`
  - [x] Document structure: `{ id, name?, shapeIds, createdBy, createdAt, updatedAt }`
  - [x] Add `groupId: string | null` field to existing Shape interface
  - [x] Update TypeScript interfaces in `app/src/services/canvasService.ts`
  - [x] **Gate**: Data model matches PRD requirements

- [x] **Task 1.3**: Update Firestore security rules
  - [x] Firestore rules: Update `app/firestore.rules` for groups collection
  - [x] Add rules for group read/write operations
  - [x] Ensure users can only access groups they have permission for
  - [x] **Gate**: Rules deployed and tested with Firebase emulators

### Phase 2: UI Components (Interface)
- [x] **Task 2.1**: Create GroupingPanel component
  - [x] Component: `app/src/components/Canvas/GroupingPanel.tsx`
  - [x] Props interface: `{ selectedShapes: string[], onGroup: () => void, onUngroup: () => void }`
  - [x] State management: Group button visibility, ungroup button visibility
  - [x] Examples: Follow patterns in `app/src/components/Canvas/Canvas.tsx`
  - [x] **Gate**: Component renders without errors

- [x] **Task 2.2**: Add group/ungroup buttons to LeftToolbar
  - [x] Update: `app/src/components/Layout/LeftToolbar.tsx`
  - [x] Add Group button (appears when 2+ shapes selected)
  - [x] Add Ungroup button (appears when grouped shapes selected)
  - [x] Visual feedback: Button states, disabled states
  - [x] **Gate**: Buttons appear/disappear based on selection state

- [x] **Task 2.3**: Update Canvas component for group selection
  - [x] Update: `app/src/components/Canvas/Canvas.tsx`
  - [x] Add group selection logic (click any grouped shape → select entire group)
  - [x] Add visual indicators for grouped shapes (shared dashed border)
  - [x] Integrate with existing multi-select system
  - [x] **Gate**: Group selection works correctly

- [x] **Task 2.4**: Add keyboard shortcuts for grouping
  - [x] Shortcut: `Cmd/Ctrl+G` to group selected shapes
  - [x] Shortcut: `Cmd/Ctrl+Shift+G` to ungroup selected group
  - [x] Global keydown event listener in Canvas component
  - [x] Exclude shortcuts when typing in input fields
  - [x] **Gate**: Keyboard shortcuts work as expected

### Phase 3: Real-time Sync (Collaboration)
- [x] **Task 3.1**: Implement Firestore subscriptions for groups
  - [x] Subscription: `subscribeToGroups()` in CanvasService
  - [x] Update handlers: Sync group changes to UI state
  - [x] Cleanup: Unsubscribe on component unmount
  - [x] **Gate**: Real-time group updates work <100ms

- [x] **Task 3.2**: Handle concurrent group operations
  - [x] Conflict resolution: Use Firestore transactions for group operations
  - [x] Optimistic updates: Update UI immediately, rollback on failure
  - [x] Rollback handling: Restore previous state on error
  - [x] **Gate**: Concurrent group operations don't corrupt state

- [x] **Task 3.3**: Multi-user group testing
  - [x] Test with 2+ browser windows
  - [x] Verify group operations sync in real-time
  - [x] Test concurrent group operations
  - [x] **Gate**: Multi-user functionality works correctly

### Phase 4: Testing (Quality Assurance)
- [x] **Task 4.1**: Write integration tests for grouping
  - [x] File: `app/tests/integration/grouping.test.ts`
  - [x] Test: Basic group/ungroup functionality
  - [x] Test: Group operations (move, delete, duplicate)
  - [x] Test: Multi-user group sync
  - [x] **Gate**: All integration tests pass

- [x] **Task 4.2**: Write service unit tests for group methods
  - [x] File: `app/tests/unit/services/grouping.test.ts`
  - [x] Test: `groupShapes()` method behavior
  - [x] Test: `ungroupShapes()` method behavior
  - [x] Test: Error handling for invalid inputs
  - [x] **Gate**: All service tests pass

- [x] **Task 4.3**: Write component tests for GroupingPanel
  - [x] File: `app/tests/unit/components/GroupingPanel.test.tsx`
  - [x] Test: Component renders correctly
  - [x] Test: Button states based on selection
  - [x] Test: Click handlers work
  - [x] **Gate**: All component tests pass

### Phase 5: Multi-User Testing & Performance
- [x] **Task 5.1**: Multi-user testing with deployed site
  - [x] Test basic group operations with 2+ browser windows
  - [x] Verify real-time group sync <100ms between users
  - [x] Test concurrent group operations (multiple users grouping simultaneously)
  - [x] Test group selection and visual indicators sync across users
  - [x] Test group operations (move, delete, duplicate) with multiple users
  - [x] Verify performance with 3+ simultaneous users
  - [x] **Gate**: Multi-user functionality works correctly

- [x] **Task 5.2**: Performance optimization for group operations
  - [x] 60 FPS during group drag operations
  - [x] Smooth rendering with 10+ shapes in group
  - [x] Optimized re-renders for group selection
  - [x] **Gate**: Performance targets met

- [x] **Task 5.3**: Enhanced group visualization and UX
  - [x] Prominent group bounding box with resize handles
  - [x] Group selection logic (click group → select all, double-click → individual)
  - [x] Ungroup functionality with keyboard shortcuts
  - [x] Clean individual shapes without distracting borders
  - [x] **Gate**: Enhanced UX requirements met

---

## Acceptance Gates (Final Verification)

### Functional Requirements
- [x] **Gate 1**: Select 2+ shapes, click Group → shapes grouped with prominent purple bounding box
- [x] **Gate 2**: Drag grouped shapes → all move together maintaining relative positions
- [x] **Gate 3**: Click Ungroup → shapes become individually selectable
- [x] **Gate 4**: Group operations (delete, duplicate) work on all members

### Performance Requirements
- [x] **Gate 5**: 60 FPS during group drag operations
- [x] **Gate 6**: Group operations complete in <500ms
- [x] **Gate 7**: Works with 10+ shapes in group
- [x] **Gate 8**: No performance degradation with 50+ shapes on canvas

### Collaboration Requirements
- [x] **Gate 9**: Group operations sync to other users <100ms
- [x] **Gate 10**: Concurrent group operations don't conflict
- [x] **Gate 11**: Works with 3+ simultaneous users
- [x] **Gate 12**: Group behavior visible to all users

### Quality Requirements
- [x] **Gate 13**: All tests pass
- [x] **Gate 14**: No console errors
- [x] **Gate 15**: TypeScript types are correct
- [x] **Gate 16**: Code follows existing patterns

### Enhanced UX Requirements
- [x] **Gate 17**: Prominent group bounding box with resize handles
- [x] **Gate 18**: Group selection logic (click group → select all, double-click → individual)
- [x] **Gate 19**: Ungroup functionality with keyboard shortcuts (Cmd/Ctrl+Shift+G)
- [x] **Gate 20**: Clean individual shapes without distracting borders

---

## Implementation Notes

### Key Dependencies
- [ ] React dev server running (`npm run dev` from `app/` directory)
- [ ] Existing CanvasService patterns in `app/src/services/canvasService.ts`
- [ ] Multi-select system in `app/src/components/Canvas/Canvas.tsx`

### Potential Blockers
- [ ] Blocker 1: `Firestore batch write failures` → Mitigation: `Implement retry logic with exponential backoff`
- [ ] Blocker 2: `Real-time sync conflicts` → Mitigation: `Use Firestore transactions for group operations`
- [ ] Blocker 3: `Performance with large groups` → Mitigation: `Optimize group rendering, limit group size if needed`

### Code Patterns to Follow
- [ ] Use existing CanvasService patterns in `app/src/services/canvasService.ts`
- [ ] Follow React Context + hooks pattern in `app/src/contexts/` and `app/src/hooks/`
- [ ] Use TypeScript interfaces for all data (Group, Shape with groupId)
- [ ] Include proper error handling with toast notifications
- [ ] Add comments for complex group logic
- [ ] Follow existing component structure in `app/src/components/`
- [ ] Use Firebase emulators for testing (not production Firebase)

### Testing Strategy
- [ ] Use multiple browser windows for multi-user testing
- [ ] Verify real-time sync with network throttling
- [ ] Test edge cases: invalid shapeIds, network failures, locked shapes

---

## Definition of Done

- [x] All tasks completed and checked off
- [x] All acceptance gates pass (20/20 gates passed)
- [x] Code review self-checklist complete
- [x] Tests written and passing (integration, service, component tests)
- [x] Documentation updated
- [x] No console errors
- [x] Performance targets met (60 FPS, <100ms sync)
- [x] Multi-user functionality verified (3+ users, real-time sync)
- [x] Enhanced UX implemented (prominent group bounding box, selection logic, ungroup functionality)
- [x] Firestore rules deployed successfully
- [x] Ready for manual review and PR creation

---

## Post-Implementation

### Handoff Checklist
- [x] All files committed and pushed
- [x] Tests passing (integration, service, component tests)
- [x] Firestore rules deployed successfully
- [x] Ready for user manual review
- [ ] PR created with proper description (pending user approval)

### Manual Testing Required (User)
- [x] Visual appearance check (prominent group bounding box with resize handles)
- [x] Performance feel test (smooth group operations at 60 FPS)
- [x] Cross-browser testing (Chrome, Firefox, Safari)
- [x] Real 2-browser collaboration (group operations sync in real-time)
- [x] Verify real-time sync <100ms
- [x] Test group selection logic (click group → select all, double-click → individual)
- [x] Test ungroup functionality (button and keyboard shortcut)

---

**Remember**: Complete tasks in order, check off each one, and don't proceed until all gates pass. Quality over speed!
