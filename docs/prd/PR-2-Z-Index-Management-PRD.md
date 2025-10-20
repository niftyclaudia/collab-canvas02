# PRD: Z-Index Management — End-to-End Delivery

**Feature**: Z-Index Management

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Alex (PM Agent)

**Target Release**: Phase 2

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent Tasks] (`docs/tasks/pr-2-task.md`)

**Note**: This PRD is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## 1. Summary

Add z-index management with 4 buttons: Bring to Front, Send to Back, Bring Forward, Send Backward. Users can control layer ordering of overlapping shapes with real-time sync across all collaborators.

---

## 2. Problem & Goals

- **User Problem**: When shapes overlap, users need to control which shape appears on top. Currently, there's no way to change the stacking order of shapes.
- **Why Now**: Essential for professional design workflows where layering is critical (text over backgrounds, UI elements, etc.)
- **Goals**:
  - [ ] G1 — Users can bring any shape to the front of all other shapes
  - [ ] G2 — Users can send any shape to the back of all other shapes  
  - [ ] G3 — Users can move shapes forward/backward one layer at a time
  - [ ] G4 — All z-index changes sync to other users in <100ms
  - [ ] G5 — Keyboard shortcuts work for power users

---

## 3. Non-Goals / Out of Scope

- [ ] Not doing complex layer management (no layer groups, folders, or advanced organization)
- [ ] Not doing visual layer panel (keep it simple with 4 buttons only)
- [ ] Not doing z-index animation or transitions (instant changes only)

---

## 4. Success Metrics

- **User-visible**: 4 z-index operations work correctly, shapes render in proper order
- **System**: <100ms sync peer-to-peer, 60 FPS during interactions
- **Quality**: 0 blocking bugs, all acceptance gates pass

---

## 5. Users & Stories

- As a **designer**, I want to bring a text label to the front so that it's visible over background shapes.
- As a **collaborator**, I want to see layer changes in real-time so that I understand what other users are doing.
- As a **power user**, I want keyboard shortcuts so that I can work efficiently without clicking buttons.

---

## 6. Experience Specification (UX)

- **Entry points**: 4 buttons in controls panel when shape is selected
- **Visual behavior**: 
  - Buttons: ⬆️🔝 To Front, ⬇️⬇️ To Back, ⬆️ Forward, ⬇️ Backward
  - Tooltips: "Bring to Front", "Send to Back", "Bring Forward", "Send Backward"
  - Visual feedback: Shape immediately reorders in canvas
- **Loading/disabled/locked states**: Buttons disabled when no shape selected
- **Accessibility**: Keyboard shortcuts (Cmd/Ctrl+], Cmd/Ctrl+[, Cmd/Ctrl+Shift+], Cmd/Ctrl+Shift+[)
- **Performance**: 60 FPS during z-index changes; feedback <50ms; network sync <100ms

---

## 7. Functional Requirements (Must/Should)

- **MUST**: 4 z-index operations work for any selected shape
- **MUST**: Real-time sync to other clients in <100ms
- **MUST**: Shapes render in correct z-index order
- **SHOULD**: Keyboard shortcuts for all operations

**Acceptance gates embedded per requirement**:

- [Gate] When User A brings blue rectangle to front → User B sees it on top of red rectangle in <100ms
- [Gate] When User A sends shape to back → User B sees it behind all other shapes in <100ms
- [Gate] When User A moves shape forward → User B sees it move up one layer in <100ms
- [Gate] When User A moves shape backward → User B sees it move down one layer in <100ms
- [Gate] All 4 operations work with keyboard shortcuts
- [Gate] Error case: Invalid shape ID shows toast; no partial writes

---

## 8. Data Model

**Updated Shape Document**:
```typescript
interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color: string;
  zIndex: number; // NEW: Stacking order (higher = on top)
  groupId: string | null;
  createdBy: string;
  createdAt: Timestamp;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp;
}
```

**Validation rules**: zIndex must be number, can be negative
**Indexing/queries**: Shapes sorted by zIndex for rendering

---

## 9. API / Service Contracts

**CanvasService methods**:
```typescript
// Z-index operations
async bringToFront(shapeId: string): Promise<void>
async sendToBack(shapeId: string): Promise<void>
async bringForward(shapeId: string): Promise<void>
async sendBackward(shapeId: string): Promise<void>

// Helper method to get current z-index range
async getZIndexRange(): Promise<{ min: number; max: number }>
```

**Pre-conditions**: Shape must exist and be accessible
**Post-conditions**: Shape zIndex updated, all users see change
**Error handling**: Invalid shape ID shows toast, network errors retry once

---

## 10. UI Components to Create/Modify

- `src/components/Canvas/ZIndexPanel.tsx` — 4 z-index control buttons
- `src/components/Canvas/Canvas.tsx` — Add z-index rendering logic
- `src/components/Layout/LeftToolbar.tsx` — Integrate ZIndexPanel
- `src/components/Canvas/Canvas.tsx` — Add keyboard shortcut handlers

---

## 11. Integration Points

- Uses `CanvasService` for z-index mutations
- Listeners via Firestore subscriptions to shape updates
- State wired through `CanvasContext`
- Real-time collaboration via Firestore `onSnapshot()`
- Authentication via `AuthContext` and `AuthService`

---

## 12. Test Plan & Acceptance Gates

**Happy Path**:
- [ ] User selects shape, clicks "To Front" → shape appears on top
- [ ] User selects shape, clicks "To Back" → shape appears behind all others
- [ ] User selects shape, clicks "Forward" → shape moves up one layer
- [ ] User selects shape, clicks "Backward" → shape moves down one layer
- [ ] Gate: User B sees all changes in <100ms

**Edge Cases**:
- [ ] Invalid shape ID shows toast message
- [ ] Network error shows retry toast
- [ ] Gate: No partial writes or corrupted state

**Multi-User**:
- [ ] User A changes z-index → User B sees change immediately
- [ ] Concurrent z-index changes don't conflict
- [ ] Gate: All users see consistent layer ordering

**Performance**:
- [ ] 60 FPS during z-index changes with 50+ shapes
- [ ] Canvas renders smoothly with proper layer ordering
- [ ] Gate: No lag or stuttering during operations

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented and unit-tested
- [ ] UI implemented with 4 buttons and keyboard shortcuts
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard/Accessibility checks pass
- [ ] Test Plan checkboxes all pass
- [ ] Docs created: Action Plan, Quick Start, Summary
- [ ] Firebase rules updated if needed
- [ ] TypeScript types properly defined

---

## 14. Risks & Mitigations

- **Risk**: Z-index conflicts with concurrent users → **Mitigation**: Use atomic Firestore updates, last-write-wins
- **Risk**: Performance with many shapes → **Mitigation**: Efficient sorting algorithm, render optimization
- **Risk**: Keyboard shortcut conflicts → **Mitigation**: Test with existing shortcuts, use unique combinations

---

## 15. Rollout & Telemetry

- **Feature flag**: No (always enabled)
- **Metrics**: Z-index operation usage, error rates, sync latency
- **Manual validation**: Test with 2+ users, verify layer ordering
- **Firebase Analytics events**: z_index_bring_to_front, z_index_send_to_back, z_index_forward, z_index_backward

---

## 16. Open Questions

- Q1: Should z-index be preserved when duplicating shapes? → **Decision**: Yes, maintain same z-index
- Q2: What happens to z-index when grouping shapes? → **Decision**: Keep individual z-index values, don't unify

---

## 17. Appendix: Out-of-Scope Backlog

- [ ] Visual layer panel showing all shapes in z-order
- [ ] Z-index animation/transitions
- [ ] Layer groups or folders
- [ ] Z-index templates or presets

---

## Preflight Questionnaire (Complete Before Generating This PRD)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can select a shape and change its layer order with 4 operations, visible to all collaborators

2. **Who is the primary user and what is their critical action?**
   - Designer selecting overlapping shapes and bringing text to front for visibility

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: 4 z-index operations, real-time sync
   - Nice-to-have: Keyboard shortcuts, advanced error handling

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - 2-5 users, <100ms sync via Firestore

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS with 50+ shapes, <100ms sync

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Invalid shape IDs, network errors, concurrent z-index changes

7. **Data model changes needed (new fields/collections)?**
   - Add zIndex field to existing Shape interface

8. **Service APIs required (create/update/delete/subscribe)?**
   - 4 z-index methods in CanvasService, Firestore subscriptions

9. **UI entry points and states (empty, loading, locked, error):**
   - 4 buttons in controls panel, disabled when no selection

10. **Accessibility/keyboard expectations:**
    - Keyboard shortcuts for all 4 operations

11. **Security/permissions implications:**
    - Same as existing shape operations (authenticated users only)

12. **Dependencies or blocking integrations:**
    - Depends on existing CanvasService and Firestore setup

13. **Rollout strategy (flag, migration) and success metrics:**
    - Always enabled, track usage and sync latency

14. **What is explicitly out of scope for this iteration?**
    - Visual layer panel, z-index animation, layer groups

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Consider Firebase/Firestore limitations and optimize for real-time collaboration.
- Ensure TypeScript types are comprehensive for better development experience.

---
