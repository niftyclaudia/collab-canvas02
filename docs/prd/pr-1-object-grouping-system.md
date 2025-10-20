# PRD: Object Grouping System — End-to-End Delivery

**Feature**: Object Grouping System

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Alex (PM Agent)

**Target Release**: Phase 2 - Essential Features

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent Tasks] (`docs/tasks/pr-1-task.md`)

**Note**: This PRD is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## 1. Summary

Enable users to group multiple shapes together for unified operations, allowing them to move, delete, and manipulate multiple shapes as a single unit while maintaining real-time collaboration across all users.

---

## 2. Problem & Goals

**User Problem**: When working with complex designs, users need to manipulate multiple related shapes together (like form elements, UI components, or design patterns) but currently must select and move each shape individually, which is inefficient and error-prone.

**Why Now**: This is a core collaborative design feature required for Phase 2 production readiness. Grouping is essential for professional design workflows and is explicitly required in the rubric.

**Goals (ordered, measurable):**
- [ ] G1 — Users can select 2+ shapes and group them into a single moveable unit
- [ ] G2 — Grouped shapes maintain their relative positions when moved together
- [ ] G3 — All group operations (move, delete, duplicate) work on all group members
- [ ] G4 — Real-time sync ensures all users see group behavior simultaneously (<100ms)
- [ ] G5 — Visual indicators clearly show which shapes are grouped

---

## 3. Non-Goals / Out of Scope

- [ ] Complex group transforms (resize/rotate entire groups as single unit) - individual shape transforms only
- [ ] Nested groups (groups within groups) - flat grouping only
- [ ] Group naming or metadata beyond basic identification
- [ ] Group-level styling or properties
- [ ] Auto-grouping based on proximity or selection patterns

---

## 4. Success Metrics

- **User-visible**: Group 3 shapes in <3 clicks, move group as single unit
- **System**: <100ms sync peer-to-peer, 60 FPS during group operations
- **Quality**: 0 blocking bugs, all acceptance gates pass, real-time collaboration verified

---

## 5. Users & Stories

- As a **designer**, I want to group related shapes together so that I can move them as a single unit without losing their relative positions.
- As a **collaborator**, I want to see when other users group shapes so that I understand the current design structure.
- As a **team member**, I want group operations to sync in real-time so that we can collaborate on complex layouts without conflicts.

---

## 6. Experience Specification (UX)

**Entry Points and Flows:**
- Group button appears in controls panel when 2+ shapes are selected
- Click "Group" → shapes become grouped, visual indicator appears
- Click any grouped shape → entire group becomes selected
- "Ungroup" button appears when grouped shapes are selected

**Visual Behavior:**
- Grouped shapes show shared dashed border (3px, blue color)
- Group selection highlights all group members
- Controls panel shows "Group" button when 2+ shapes selected
- Controls panel shows "Ungroup" button when grouped shapes selected

**Loading/Disabled/Locked States:**
- Group button disabled if any selected shape is locked by another user
- Toast notification if grouping fails due to lock conflicts
- Loading state during group creation (optimistic UI)

**Accessibility:**
- Keyboard shortcut: Cmd/Ctrl+G to group selected shapes
- Keyboard shortcut: Cmd/Ctrl+Shift+G to ungroup
- Screen reader announces "Grouped" or "Ungrouped" when state changes
- Focus management when group state changes

**Performance:**
- 60 FPS during group operations
- Visual feedback <50ms
- Network sync <100ms

---

## 7. Functional Requirements (Must/Should)

**MUST:**
- [ ] Group button appears when 2+ shapes selected
- [ ] Group operation creates Firestore group document with shapeIds array
- [ ] All selected shapes updated with groupId field (batch write)
- [ ] Grouped shapes move together as single unit
- [ ] Visual indicators show grouping state (shared dashed border)
- [ ] Ungroup operation removes groupId from all shapes and deletes group document
- [ ] Real-time sync to other clients in <100ms
- [ ] Group operations work: move, delete, duplicate entire group
- [ ] Error handling for lock conflicts and invalid operations

**SHOULD:**
- [ ] Optimistic UI updates for immediate feedback
- [ ] Toast notifications for successful group/ungroup operations
- [ ] Keyboard shortcuts for power users

**Acceptance Gates:**
- [Gate] When User A selects 3 shapes and clicks Group → User B sees grouped behavior in <100ms
- [Gate] When User A moves grouped shapes → User B sees all shapes move together maintaining relative positions
- [Gate] When User A deletes grouped shapes → User B sees all group members deleted
- [Gate] Error case: Attempting to group locked shapes shows toast notification

---

## 8. Data Model

**New Collection: `canvases/main/groups`**
```typescript
interface Group {
  id: string;
  name?: string; // Optional user-defined name
  shapeIds: string[]; // Array of shape IDs in this group
  createdBy: string; // User ID who created the group
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Updated Shape Document:**
```typescript
interface Shape {
  // ... existing fields
  groupId: string | null; // Reference to group (if grouped)
  // ... rest of existing fields
}
```

**Validation Rules:**
- Group must have at least 2 shapes
- Shape can only belong to one group at a time
- Group deletion removes groupId from all member shapes
- Shape deletion removes shape from group (or deletes group if <2 members)

**Indexing/Queries:**
- Subscribe to groups collection for real-time updates
- Query shapes by groupId for group operations
- Batch writes for group creation/updates

---

## 9. API / Service Contracts

**CanvasService Methods:**
```typescript
// Grouping operations
async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>
async ungroupShapes(groupId: string): Promise<void>
async getGroup(groupId: string): Promise<Group | null>
async getShapesInGroup(groupId: string): Promise<Shape[]>

// Group-aware operations
async moveGroup(groupId: string, deltaX: number, deltaY: number): Promise<void>
async deleteGroup(groupId: string): Promise<void>
async duplicateGroup(groupId: string, offsetX: number, offsetY: number): Promise<string[]>

// Subscriptions
subscribeToGroups(canvasId: string, callback: (groups: Group[]) => void): Unsubscribe
subscribeToShapesInGroup(groupId: string, callback: (shapes: Shape[]) => void): Unsubscribe
```

**Pre-conditions:**
- All shapes must be unlocked by current user
- At least 2 shapes must be selected
- Shapes must not already be in a group

**Post-conditions:**
- Group document created in Firestore
- All shapes updated with groupId
- Real-time sync triggered to all clients

**Error Handling:**
- Lock conflicts: Show toast "Cannot group: Some shapes are locked by other users"
- Invalid selection: Show toast "Select at least 2 shapes to group"
- Network errors: Retry with exponential backoff, show error toast

---

## 10. UI Components to Create/Modify

**New Components:**
- `src/components/Canvas/GroupingPanel.tsx` — Group/ungroup controls panel
- `src/components/Canvas/GroupVisualIndicator.tsx` — Dashed border for grouped shapes

**Modified Components:**
- `src/components/Canvas/Canvas.tsx` — Add group selection logic and visual indicators
- `src/components/Layout/LeftToolbar.tsx` — Add group/ungroup buttons to controls panel
- `src/hooks/useCanvas.ts` — Add group state management and operations
- `src/services/canvasService.ts` — Add group-related service methods

---

## 11. Integration Points

- **Uses `CanvasService`** for group mutations and queries
- **Listeners via Firestore** subscriptions for real-time group updates
- **State wired through `CanvasContext`** for group state management
- **Real-time collaboration** via existing cursor and presence services
- **Authentication via `AuthContext`** for user identification
- **Toast notifications** via `ToastContext` for user feedback

---

## 12. Test Plan & Acceptance Gates

**Happy Path:**
- [ ] Select 2+ shapes → Group button appears in controls panel
- [ ] Click Group → shapes show shared dashed border, move together
- [ ] Click Ungroup → shapes become individually selectable again
- [ ] Gate: User B sees group behavior in <100ms

**Edge Cases:**
- [ ] Attempt to group locked shapes → toast notification shown
- [ ] Attempt to group <2 shapes → button disabled
- [ ] Delete individual shape from group → group dissolves if <2 members
- [ ] Network error during group operation → retry with user feedback

**Multi-User:**
- [ ] User A groups shapes → User B sees group immediately
- [ ] User A moves group → User B sees all shapes move together
- [ ] User A deletes group → User B sees all shapes deleted
- [ ] Concurrent group operations don't corrupt state
- [ ] **Test in production NOT Firebase emulators**

**Performance:**
- [ ] 60 FPS during group operations with 50+ shapes
- [ ] Group operations complete in <100ms
- [ ] Visual indicators render smoothly

---

## 13. Definition of Done (End-to-End)

- [ ] CanvasService group methods implemented and unit-tested
- [ ] GroupingPanel UI implemented with proper state management
- [ ] Visual indicators show grouping state correctly
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard shortcuts work (Cmd/Ctrl+G, Cmd/Ctrl+Shift+G)
- [ ] All Test Plan checkboxes pass
- [ ] Group operations work: move, delete, duplicate
- [ ] Error handling for lock conflicts and edge cases
- [ ] TypeScript types properly defined for Group interface
- [ ] Firestore security rules updated for groups collection

---

## 14. Risks & Mitigations

- **Risk**: Lock conflicts during group operations → **Mitigation**: Check all shapes unlocked before grouping, show clear error messages
- **Risk**: Performance impact with many groups → **Mitigation**: Optimize batch writes, limit group size
- **Risk**: Real-time sync conflicts → **Mitigation**: Use Firestore batch writes for atomic operations
- **Risk**: Complex group selection logic → **Mitigation**: Start with simple click-to-select-group approach

---

## 15. Rollout & Telemetry

- **Feature flag**: No (core feature, always enabled)
- **Metrics**: Group creation/ungroup events, group operation success rates
- **Manual validation**: Test with 2+ users, verify real-time sync
- **Firebase Analytics**: Track group operations for usage insights

---

## 16. Open Questions

- **Q1**: Should groups have names/labels for better identification?
- **Q2**: What's the maximum recommended group size for performance?

---

## 17. Appendix: Out-of-Scope Backlog

- [ ] Nested groups (groups within groups)
- [ ] Group-level styling and properties
- [ ] Auto-grouping based on proximity
- [ ] Group templates or presets
- [ ] Group export/import functionality

---

## Preflight Questionnaire (Complete Before Generating This PRD)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User selects 2+ shapes, groups them, moves the group as a single unit, and other users see this in real-time.

2. **Who is the primary user and what is their critical action?**
   - Designer/collaborator who needs to manipulate multiple related shapes together efficiently.

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: Basic group/ungroup, move together, visual indicators. Nice-to-have: Group naming, complex transforms.

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - 2-5 concurrent users, <100ms sync for all group operations.

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS with 50+ shapes, <100ms group operations, maintain performance with multiple groups.

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Lock conflicts, invalid selections, network errors, group dissolution when <2 members.

7. **Data model changes needed (new fields/collections)?**
   - New groups collection, groupId field added to shapes.

8. **Service APIs required (create/update/delete/subscribe)?**
   - groupShapes, ungroupShapes, moveGroup, deleteGroup, subscribeToGroups.

9. **UI entry points and states (empty, loading, locked, error):**
   - Group button in controls panel, visual indicators, toast notifications for errors.

10. **Accessibility/keyboard expectations:**
    - Cmd/Ctrl+G to group, Cmd/Ctrl+Shift+G to ungroup, screen reader support.

11. **Security/permissions implications:**
    - Users can only group shapes they can edit, respect existing lock system.

12. **Dependencies or blocking integrations:**
    - Depends on existing CanvasService, Firestore, real-time sync infrastructure.

13. **Rollout strategy (flag, migration) and success metrics:**
    - No feature flag needed, track group operation success rates.

14. **What is explicitly out of scope for this iteration?**
    - Nested groups, group-level styling, auto-grouping, complex transforms.

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Consider Firebase/Firestore limitations and optimize for real-time collaboration.
- Ensure TypeScript types are comprehensive for better development experience.

---