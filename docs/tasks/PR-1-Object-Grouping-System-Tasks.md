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
- [ ] **Task 1.1**: Create group service methods in CanvasService
  - [ ] Method: `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>`
  - [ ] Method: `ungroupShapes(groupId: string): Promise<void>`
  - [ ] Method: `getGroup(groupId: string): Promise<Group | null>`
  - [ ] Method: `getShapesInGroup(groupId: string): Promise<Shape[]>`
  - [ ] Method: `moveGroup(groupId: string, deltaX: number, deltaY: number): Promise<void>`
  - [ ] Method: `deleteGroup(groupId: string): Promise<void>`
  - [ ] Method: `duplicateGroup(groupId: string, offsetX: number, offsetY: number): Promise<string[]>`
  - [ ] Method: `subscribeToGroups(canvasId: string, cb: (groups: Group[]) => void): Unsubscribe`
  - [ ] Error handling: Network failures, invalid shapeIds, permission errors
  - [ ] Examples: Follow patterns in `app/src/services/canvasService.ts`
  - [ ] **Gate**: All service methods exist and are testable

- [ ] **Task 1.2**: Add Firestore data model for groups
  - [ ] Collection: `canvases/main/groups`
  - [ ] Document structure: `{ id, name?, shapeIds, createdBy, createdAt, updatedAt }`
  - [ ] Add `groupId: string | null` field to existing Shape interface
  - [ ] Update TypeScript interfaces in `app/src/services/canvasService.ts`
  - [ ] **Gate**: Data model matches PRD requirements

- [ ] **Task 1.3**: Update Firestore security rules
  - [ ] Firestore rules: Update `app/firestore.rules` for groups collection
  - [ ] Add rules for group read/write operations
  - [ ] Ensure users can only access groups they have permission for
  - [ ] **Gate**: Rules deployed and tested with Firebase emulators

### Phase 2: UI Components (Interface)
- [ ] **Task 2.1**: Create GroupingPanel component
  - [ ] Component: `app/src/components/Canvas/GroupingPanel.tsx`
  - [ ] Props interface: `{ selectedShapes: string[], onGroup: () => void, onUngroup: () => void }`
  - [ ] State management: Group button visibility, ungroup button visibility
  - [ ] Examples: Follow patterns in `app/src/components/Canvas/Canvas.tsx`
  - [ ] **Gate**: Component renders without errors

- [ ] **Task 2.2**: Add group/ungroup buttons to LeftToolbar
  - [ ] Update: `app/src/components/Layout/LeftToolbar.tsx`
  - [ ] Add Group button (appears when 2+ shapes selected)
  - [ ] Add Ungroup button (appears when grouped shapes selected)
  - [ ] Visual feedback: Button states, disabled states
  - [ ] **Gate**: Buttons appear/disappear based on selection state

- [ ] **Task 2.3**: Update Canvas component for group selection
  - [ ] Update: `app/src/components/Canvas/Canvas.tsx`
  - [ ] Add group selection logic (click any grouped shape → select entire group)
  - [ ] Add visual indicators for grouped shapes (shared dashed border)
  - [ ] Integrate with existing multi-select system
  - [ ] **Gate**: Group selection works correctly

- [ ] **Task 2.4**: Add keyboard shortcuts for grouping
  - [ ] Shortcut: `Cmd/Ctrl+G` to group selected shapes
  - [ ] Shortcut: `Cmd/Ctrl+Shift+G` to ungroup selected group
  - [ ] Global keydown event listener in Canvas component
  - [ ] Exclude shortcuts when typing in input fields
  - [ ] **Gate**: Keyboard shortcuts work as expected

### Phase 3: Real-time Sync (Collaboration)
- [ ] **Task 3.1**: Implement Firestore subscriptions for groups
  - [ ] Subscription: `subscribeToGroups()` in CanvasService
  - [ ] Update handlers: Sync group changes to UI state
  - [ ] Cleanup: Unsubscribe on component unmount
  - [ ] **Gate**: Real-time group updates work <100ms

- [ ] **Task 3.2**: Handle concurrent group operations
  - [ ] Conflict resolution: Use Firestore transactions for group operations
  - [ ] Optimistic updates: Update UI immediately, rollback on failure
  - [ ] Rollback handling: Restore previous state on error
  - [ ] **Gate**: Concurrent group operations don't corrupt state

- [ ] **Task 3.3**: Multi-user group testing
  - [ ] Test with 2+ browser windows
  - [ ] Verify group operations sync in real-time
  - [ ] Test concurrent group operations
  - [ ] **Gate**: Multi-user functionality works correctly

### Phase 4: Testing (Quality Assurance)
- [ ] **Task 4.1**: Write integration tests for grouping
  - [ ] File: `app/tests/integration/grouping.test.ts`
  - [ ] Test: Basic group/ungroup functionality
  - [ ] Test: Group operations (move, delete, duplicate)
  - [ ] Test: Multi-user group sync
  - [ ] **Gate**: All integration tests pass

- [ ] **Task 4.2**: Write service unit tests for group methods
  - [ ] File: `app/tests/unit/services/grouping.test.ts`
  - [ ] Test: `groupShapes()` method behavior
  - [ ] Test: `ungroupShapes()` method behavior
  - [ ] Test: Error handling for invalid inputs
  - [ ] **Gate**: All service tests pass

- [ ] **Task 4.3**: Write component tests for GroupingPanel
  - [ ] File: `app/tests/unit/components/GroupingPanel.test.tsx`
  - [ ] Test: Component renders correctly
  - [ ] Test: Button states based on selection
  - [ ] Test: Click handlers work
  - [ ] **Gate**: All component tests pass

### Phase 5: Performance & Polish (Optimization)
- [ ] **Task 5.1**: Performance optimization for group operations
  - [ ] 60 FPS during group drag operations
  - [ ] Smooth rendering with 10+ shapes in group
  - [ ] Optimized re-renders for group selection
  - [ ] **Gate**: Performance targets met

- [ ] **Task 5.2**: Error handling and user feedback
  - [ ] User-friendly error messages for group operations
  - [ ] Toast notifications: "Grouped 3 shapes" / "Ungrouped 3 shapes"
  - [ ] Graceful degradation on network errors
  - [ ] **Gate**: Error handling is robust

- [ ] **Task 5.3**: Accessibility and keyboard support
  - [ ] Keyboard navigation for group controls
  - [ ] Screen reader support for group operations
  - [ ] Focus management after group operations
  - [ ] **Gate**: Accessibility requirements met

---

## Acceptance Gates (Final Verification)

### Functional Requirements
- [ ] **Gate 1**: Select 2+ shapes, click Group → shapes grouped with dashed border
- [ ] **Gate 2**: Drag grouped shapes → all move together maintaining relative positions
- [ ] **Gate 3**: Click Ungroup → shapes become individually selectable
- [ ] **Gate 4**: Group operations (delete, duplicate) work on all members

### Performance Requirements
- [ ] **Gate 5**: 60 FPS during group drag operations
- [ ] **Gate 6**: Group operations complete in <500ms
- [ ] **Gate 7**: Works with 10+ shapes in group
- [ ] **Gate 8**: No performance degradation with 50+ shapes on canvas

### Collaboration Requirements
- [ ] **Gate 9**: Group operations sync to other users <100ms
- [ ] **Gate 10**: Concurrent group operations don't conflict
- [ ] **Gate 11**: Works with 3+ simultaneous users
- [ ] **Gate 12**: Group behavior visible to all users

### Quality Requirements
- [ ] **Gate 13**: All tests pass
- [ ] **Gate 14**: No console errors
- [ ] **Gate 15**: TypeScript types are correct
- [ ] **Gate 16**: Code follows existing patterns

---

## Implementation Notes

### Key Dependencies
- [ ] Firebase emulators running (`npm run emulate` from `app/` directory)
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
- [ ] Test with Firebase emulators (run `npm run emulate` from `app/` directory)
- [ ] Use multiple browser windows for multi-user testing
- [ ] Verify real-time sync with network throttling
- [ ] Test edge cases: invalid shapeIds, network failures, locked shapes

---

## Definition of Done

- [ ] All tasks completed and checked off
- [ ] All acceptance gates pass
- [ ] Code review self-checklist complete
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance targets met
- [ ] Multi-user functionality verified

---

## Post-Implementation

### Handoff Checklist
- [ ] PR created with proper description
- [ ] All files committed and pushed
- [ ] Tests passing in CI
- [ ] Ready for user review

### Manual Testing Required (User)
- [ ] Visual appearance check (grouped shapes show dashed border)
- [ ] Performance feel test (smooth group operations)
- [ ] Cross-browser testing
- [ ] Real 2-browser collaboration
- [ ] Screenshot/video for PR
- [ ] Test with Firebase emulators running
- [ ] Verify real-time sync <100ms

---

**Remember**: Complete tasks in order, check off each one, and don't proceed until all gates pass. Quality over speed!
