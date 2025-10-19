# Task List: Z-Index Management — Implementation Tasks

**PR Number:** #2

**Feature:** Z-Index Management

**Agent:** Alex (PM Agent)

**Status:** Ready for Development

**Estimated Time:** 3-4 hours

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
- [ ] **Task 1.1**: Add z-index methods to CanvasService
  - [ ] Method: `bringToFront(shapeId: string): Promise<void>` in `app/src/services/canvasService.ts`
  - [ ] Method: `sendToBack(shapeId: string): Promise<void>` in `app/src/services/canvasService.ts`
  - [ ] Method: `bringForward(shapeId: string): Promise<void>` in `app/src/services/canvasService.ts`
  - [ ] Method: `sendBackward(shapeId: string): Promise<void>` in `app/src/services/canvasService.ts`
  - [ ] Method: `getZIndexRange(): Promise<{ min: number; max: number }>` in `app/src/services/canvasService.ts`
  - [ ] Error handling: Invalid shape ID, network errors, concurrent updates
  - [ ] Examples: Follow patterns in `canvasService.ts` for other shape operations
  - [ ] **Gate**: All 5 methods exist and are testable

- [ ] **Task 1.2**: Update Shape interface with zIndex field
  - [ ] Update: `app/src/services/canvasService.ts` Shape interface
  - [ ] Add: `zIndex: number` field to Shape type
  - [ ] Update: All shape creation methods to include zIndex
  - [ ] Update: Shape rendering to sort by zIndex
  - [ ] **Gate**: Shape interface includes zIndex field

- [ ] **Task 1.3**: Update Firestore security rules (if needed)
  - [ ] Check: `app/firestore.rules` for shape updates
  - [ ] Ensure: zIndex field can be updated by authenticated users
  - [ ] **Gate**: Security rules allow zIndex updates

### Phase 2: UI Components (Interface)
- [ ] **Task 2.1**: Create ZIndexPanel component
  - [ ] Component: `app/src/components/Canvas/ZIndexPanel.tsx`
  - [ ] Props interface: `{ selectedShapeId: string | null; onZIndexChange: (operation: string) => void }`
  - [ ] State management: `useState` for button states
  - [ ] 4 buttons: To Front, To Back, Forward, Backward
  - [ ] Examples: Follow `GroupingPanel.tsx` pattern
  - [ ] **Gate**: Component renders 4 buttons correctly

- [ ] **Task 2.2**: Add z-index button interactions
  - [ ] Click handlers: `handleBringToFront`, `handleSendToBack`, `handleBringForward`, `handleSendBackward`
  - [ ] Service calls: Use CanvasService z-index methods
  - [ ] Visual feedback: Toast notifications for success/error
  - [ ] Loading states: Disable buttons during operation
  - [ ] **Gate**: All 4 button clicks work and call service methods

- [ ] **Task 2.3**: Integrate ZIndexPanel with Canvas
  - [ ] Import: ZIndexPanel in `app/src/components/Canvas/Canvas.tsx`
  - [ ] Render: Show ZIndexPanel when shape is selected
  - [ ] Props: Pass selectedShapeId and onZIndexChange handler
  - [ ] **Gate**: ZIndexPanel appears when shape is selected

- [ ] **Task 2.4**: Add keyboard shortcuts
  - [ ] Shortcuts: Cmd/Ctrl+Shift+] (To Front), Cmd/Ctrl+Shift+[ (To Back), Cmd/Ctrl+] (Forward), Cmd/Ctrl+[ (Backward)
  - [ ] Handler: Add to Canvas component keydown listener
  - [ ] Platform detection: Mac metaKey vs Windows/Linux ctrlKey
  - [ ] **Gate**: All 4 keyboard shortcuts work

### Phase 3: Real-time Sync (Collaboration)
- [ ] **Task 3.1**: Update shape rendering to sort by zIndex
  - [ ] Update: `app/src/components/Canvas/Canvas.tsx` shape rendering
  - [ ] Sort: `shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))`
  - [ ] Render: Shapes in sorted order (lower zIndex first, higher on top)
  - [ ] **Gate**: Shapes render in correct z-index order

- [ ] **Task 3.2**: Handle concurrent z-index changes
  - [ ] Conflict resolution: Last-write-wins for z-index updates
  - [ ] Optimistic updates: Update UI immediately, rollback on error
  - [ ] Rollback handling: Revert z-index on service error
  - [ ] **Gate**: Concurrent z-index changes don't corrupt state

- [ ] **Task 3.3**: Multi-user testing
  - [ ] Test with 2+ browsers
  - [ ] Verify sync latency <100ms
  - [ ] Test concurrent z-index operations
  - [ ] **Gate**: Multi-user z-index functionality works

### Phase 4: Testing (Quality Assurance)
- [ ] **Task 4.1**: Write integration tests
  - [ ] File: `app/tests/integration/z-index.test.ts`
  - [ ] Test: Basic z-index operations
  - [ ] Test: Firestore sync for z-index changes
  - [ ] Test: Multi-user z-index scenarios
  - [ ] **Gate**: All integration tests pass

- [ ] **Task 4.2**: Write service unit tests
  - [ ] File: `app/tests/unit/services/canvasService-zindex.test.ts`
  - [ ] Test: bringToFront method behavior
  - [ ] Test: sendToBack method behavior
  - [ ] Test: bringForward method behavior
  - [ ] Test: sendBackward method behavior
  - [ ] Test: getZIndexRange method behavior
  - [ ] Test: Error handling for invalid shape IDs
  - [ ] **Gate**: All service tests pass

- [ ] **Task 4.3**: Write component unit tests
  - [ ] File: `app/tests/unit/components/ZIndexPanel.test.tsx`
  - [ ] Test: Component renders 4 buttons
  - [ ] Test: Button clicks call correct handlers
  - [ ] Test: Keyboard shortcuts work
  - [ ] **Gate**: All component tests pass

### Phase 5: Performance & Polish (Optimization)
- [ ] **Task 5.1**: Performance optimization
  - [ ] 60 FPS during z-index changes
  - [ ] Smooth rendering with 50+ shapes
  - [ ] Optimized shape sorting algorithm
  - [ ] **Gate**: Performance targets met

- [ ] **Task 5.2**: Error handling
  - [ ] User-friendly error messages for invalid operations
  - [ ] Graceful degradation for network errors
  - [ ] Recovery mechanisms for failed z-index updates
  - [ ] **Gate**: Error handling is robust

- [ ] **Task 5.3**: Accessibility
  - [ ] Keyboard navigation for z-index buttons
  - [ ] Screen reader support for button labels
  - [ ] Focus management for keyboard shortcuts
  - [ ] **Gate**: Accessibility requirements met

---

## Acceptance Gates (Final Verification)

### Functional Requirements
- [ ] **Gate 1**: All 4 z-index operations work correctly
- [ ] **Gate 2**: Shapes render in proper z-index order
- [ ] **Gate 3**: Error states handled gracefully with toast messages
- [ ] **Gate 4**: Loading states shown during operations

### Performance Requirements
- [ ] **Gate 5**: 60 FPS during z-index changes
- [ ] **Gate 6**: No lag or stuttering with 50+ shapes
- [ ] **Gate 7**: Smooth rendering with proper layer ordering
- [ ] **Gate 8**: Memory usage acceptable

### Collaboration Requirements
- [ ] **Gate 9**: Z-index changes sync to other users <100ms
- [ ] **Gate 10**: Concurrent z-index changes don't conflict
- [ ] **Gate 11**: Works with 3+ simultaneous users
- [ ] **Gate 12**: Disconnection handled gracefully

### Quality Requirements
- [ ] **Gate 13**: All tests pass
- [ ] **Gate 14**: No console errors
- [ ] **Gate 15**: TypeScript types are correct
- [ ] **Gate 16**: Code follows existing patterns

---

## Implementation Notes

### Key Dependencies
- [ ] React dev server running (`npm run dev` from `app/` directory)
- [ ] Production Firebase connection configured
- [ ] Existing CanvasService patterns in `app/src/services/canvasService.ts`
- [ ] Canvas context and hooks in `app/src/contexts/CanvasContext.tsx`

### Potential Blockers
- [ ] Blocker 1: `Production Firebase connection issues` → Mitigation: `Check Firebase config, verify API keys`
- [ ] Blocker 2: `Real-time sync conflicts` → Mitigation: `Test with multiple browser windows, check Firestore rules`
- [ ] Blocker 3: `Z-index sorting performance` → Mitigation: `Use efficient sorting algorithm, test with 50+ shapes`

### Code Patterns to Follow
- [ ] Use existing CanvasService patterns in `app/src/services/canvasService.ts`
- [ ] Follow React Context + hooks pattern in `app/src/contexts/CanvasContext.tsx`
- [ ] Use TypeScript interfaces for all data
- [ ] Include proper error handling with toast notifications
- [ ] Add comments for complex z-index logic
- [ ] Follow existing component structure in `app/src/components/Canvas/`
- [ ] Use production Firebase for testing

### Testing Strategy
- [ ] Test with production Firebase
- [ ] Use multiple browser windows for multi-user testing
- [ ] Verify real-time sync with network throttling
- [ ] Test edge cases: invalid shape IDs, network errors, concurrent updates

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
- [ ] Visual appearance check for z-index buttons
- [ ] Performance feel test with 50+ shapes
- [ ] Cross-browser testing
- [ ] Real 2-browser collaboration
- [ ] Screenshot/video for PR
- [ ] Test with production Firebase
- [ ] Verify real-time sync <100ms

---

**Remember**: Complete tasks in order, check off each one, and don't proceed until all gates pass. Quality over speed!
