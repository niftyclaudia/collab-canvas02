# PRD: Object Grouping System — End-to-End Delivery

**Feature**: Object Grouping System

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Alex (PM Agent)

**Target Release**: Phase 2 - Essential Features

**Links**: [Task List](docs/tasks/PR-1-Object-Grouping-System-Tasks.md), [Architecture](docs/architecture.md), [PR Briefs](docs/prd-briefs.md)

**Note**: This PRD is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## 1. Summary

Enable users to group multiple shapes together so they move, delete, and duplicate as a single unit, with real-time synchronization across all collaborative users.

---

## 2. Problem & Goals

**User Problem**: When working with multiple related shapes (like form elements, UI components, or design elements), users need to manipulate them as a cohesive unit rather than individually selecting and moving each shape.

**Why Now**: This is a core collaborative design feature that enables users to create complex layouts efficiently. Without grouping, users must manually select multiple shapes for every operation, which is tedious and error-prone.

**Goals (ordered, measurable):**
- [ ] G1 — Users can group 2+ selected shapes into a single moveable unit
- [ ] G2 — Grouped shapes maintain their relative positions when moved
- [ ] G3 — All group operations (move, delete, duplicate) work on all group members
- [ ] G4 — Real-time sync ensures all users see group behavior <100ms
- [ ] G5 — Users can ungroup shapes to return to individual manipulation

---

## 3. Non-Goals / Out of Scope

- [ ] Not doing complex group transforms (resize/rotate entire group) - individual shape transforms only
- [ ] Not doing nested groups (groups within groups) - single level only
- [ ] Not doing group naming or metadata beyond basic identification
- [ ] Not doing group-level styling (colors, borders) - individual shape styling preserved
- [ ] Not doing group locking (individual shape locking still applies)

---

## 4. Success Metrics

- **User-visible**: Group 2+ shapes in <3 clicks, move group as single unit
- **System**: <100ms sync peer-to-peer, 60 FPS during group operations
- **Quality**: 0 blocking bugs, all acceptance gates pass

---

## 5. Users & Stories

- As a **designer**, I want to group related shapes together so that I can move them as one unit and maintain their relative positions.
- As a **collaborator**, I want to see when other users group shapes so that I understand the design structure and can work with grouped elements.
- As a **team member**, I want group operations to sync in real-time so that all users see the same group behavior simultaneously.

---

## 6. Experience Specification (UX)

**Entry points and flows:**
- Select 2+ shapes using shift+click or marquee selection
- "Group" button appears in controls panel (left toolbar)
- Click Group → shapes become grouped with shared dashed border
- Click any grouped shape → entire group selected
- "Ungroup" button appears when grouped shapes are selected

**Visual behavior:**
- Grouped shapes show shared dashed blue border (3px, #3b82f6)
- Group selection shows all member shapes with individual selection indicators
- Ungroup button appears in controls panel when grouped shapes selected
- Toast notification: "Grouped 3 shapes" / "Ungrouped 3 shapes"

**Loading/disabled/locked states:**
- Group button disabled when <2 shapes selected
- Group operations respect individual shape locking
- Loading state during Firestore batch operations

**Accessibility:**
- Keyboard shortcut: Cmd/Ctrl+G to group, Cmd/Ctrl+Shift+G to ungroup
- Screen reader: "Grouped 3 shapes" announcement
- Focus management: Group button receives focus after grouping

**Performance:** 60 FPS during group drag operations; feedback <50ms; network sync <100ms.

---

## 7. Functional Requirements (Must/Should)

**MUST:**
- Group button appears when 2+ shapes selected
- Grouped shapes move together as single unit
- Visual indicators show grouping state (shared dashed border)
- Ungroup functionality restores individual shape control
- Group operations (move, delete, duplicate) work on all members
- Real-time sync to other clients in <100ms
- Firestore groups collection with shapeIds array
- Batch updates for group creation/dissolution

**SHOULD:**
- Optimistic UI updates for immediate feedback
- Toast notifications for group operations
- Keyboard shortcuts for power users
- Group operations respect individual shape locking

**Acceptance gates embedded per requirement:**

- [Gate] When User A selects 3 shapes and clicks Group → User B sees grouped behavior in <100ms
- [Gate] When User A moves grouped shapes → all group members move together maintaining relative positions
- [Gate] When User A deletes grouped shapes → all group members deleted
- [Gate] When User A ungroups shapes → shapes become individually selectable again
- [Gate] Error case: Grouping locked shapes shows appropriate error message

---

## 8. Data Model

**New Firestore Collection: `canvases/main/groups`**

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
  // ... other existing fields
}
```

**Validation rules:**
- Group must have 2+ shapeIds
- ShapeIds must exist in shapes collection
- GroupId must be valid UUID format
- No duplicate shapeIds in same group

**Indexing/queries:**
- Query shapes by groupId for group operations
- Subscribe to groups collection for real-time updates
- Batch write operations for group creation/dissolution

---

## 9. API / Service Contracts

**CanvasService Methods:**

```typescript
// Group operations
async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>
async ungroupShapes(groupId: string): Promise<void>
async getGroup(groupId: string): Promise<Group | null>
async getShapesInGroup(groupId: string): Promise<Shape[]>

// Group-aware operations
async moveGroup(groupId: string, deltaX: number, deltaY: number): Promise<void>
async deleteGroup(groupId: string): Promise<void>
async duplicateGroup(groupId: string, offsetX: number, offsetY: number): Promise<string[]>

// Subscription
subscribeToGroups(canvasId: string, cb: (groups: Group[]) => void): Unsubscribe
```

**Pre-conditions:**
- User must be authenticated
- ShapeIds must exist and be accessible
- User must have permission to modify shapes

**Post-conditions:**
- Group document created in Firestore
- All shapes updated with groupId
- Real-time sync triggered to all clients

**Error handling strategy:**
- Invalid shapeIds → Toast: "Some shapes could not be grouped"
- Network errors → Retry with exponential backoff
- Permission errors → Toast: "You don't have permission to group these shapes"

---

## 10. UI Components to Create/Modify

- `src/components/Canvas/Canvas.tsx` — Add group selection logic and visual indicators
- `src/components/Layout/LeftToolbar.tsx` — Add Group/Ungroup buttons
- `src/components/Canvas/GroupingPanel.tsx` — NEW: Group controls and status
- `src/components/UI/ToastContainer.tsx` — Add group operation notifications

---

## 11. Integration Points

- Uses `CanvasService` for group mutations
- Listeners via Firestore subscriptions to groups collection
- State wired through `CanvasContext` for group selection
- Real-time collaboration via existing cursor/presence systems
- Authentication via `AuthContext` and `AuthService`
- Integrates with existing multi-select system

---

## 12. Test Plan & Acceptance Gates

**Happy Path:**
- [ ] Select 3 shapes, click Group → shapes grouped with dashed border
- [ ] Gate: User B sees grouped behavior in <100ms
- [ ] Drag grouped shapes → all move together maintaining relative positions
- [ ] Click Ungroup → shapes become individually selectable

**Edge Cases:**
- [ ] Grouping locked shapes shows appropriate error message
- [ ] Network disconnection during group operation handled gracefully
- [ ] Invalid shapeIds rejected with clear error message

**Multi-User:**
- [ ] User A groups shapes → User B sees group behavior immediately
- [ ] Concurrent group operations don't corrupt state
- [ ] Group operations sync in real-time across all users

**Performance:**
- [ ] 60 FPS during group drag operations with 10+ shapes
- [ ] Group operations complete in <500ms
- [ ] No performance degradation with 50+ shapes on canvas

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented and unit-tested
- [ ] UI implemented with group/ungroup buttons and visual indicators
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard shortcuts work (Cmd/Ctrl+G, Cmd/Ctrl+Shift+G)
- [ ] Test Plan checkboxes all pass
- [ ] Firestore rules updated for groups collection
- [ ] TypeScript types properly defined for Group interface
- [ ] Toast notifications for all group operations
- [ ] Integration with existing multi-select system

---

## 14. Risks & Mitigations

- **Risk**: Firestore batch write failures → **Mitigation**: Retry logic with exponential backoff
- **Risk**: Real-time sync conflicts → **Mitigation**: Use Firestore transactions for group operations
- **Risk**: Performance impact with large groups → **Mitigation**: Optimize group rendering, limit group size
- **Risk**: User confusion about group behavior → **Mitigation**: Clear visual indicators and toast messages

---

## 15. Rollout & Telemetry

- **Feature flag**: No (core feature, always enabled)
- **Metrics**: Group creation rate, group size distribution, ungroup frequency
- **Manual validation steps post-deploy**: Test with 2+ users, verify real-time sync
- **Firebase Analytics events**: `group_created`, `group_moved`, `group_ungrouped`

---

## 16. Open Questions

- **Q1**: Should groups have a maximum size limit? → **Decision**: No limit for MVP, monitor performance
- **Q2**: Should grouped shapes show individual selection handles? → **Decision**: Yes, for consistency with existing behavior

---

## 17. Appendix: Out-of-Scope Backlog

- [ ] Nested groups (groups within groups)
- [ ] Group-level styling and formatting
- [ ] Group templates and presets
- [ ] Advanced group transforms (resize entire group)
- [ ] Group locking and permissions

---

## Preflight Questionnaire (Complete Before Generating This PRD)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User selects 2+ shapes, groups them, moves the group as a single unit, then ungroups them.

2. **Who is the primary user and what is their critical action?**
   - Designer creating UI layouts who needs to manipulate related shapes together.

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: Basic group/ungroup, move together, visual indicators. Nice-to-have: Group naming, advanced keyboard shortcuts.

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - 2-5 concurrent users, all group operations must sync in <100ms.

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS during group operations, works with 50+ shapes, <100ms sync latency.

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Invalid shapeIds, network failures, locked shapes, concurrent group operations.

7. **Data model changes needed (new fields/collections)?**
   - New `groups` collection, `groupId` field added to shapes.

8. **Service APIs required (create/update/delete/subscribe)?**
   - `groupShapes()`, `ungroupShapes()`, `moveGroup()`, `deleteGroup()`, `subscribeToGroups()`.

9. **UI entry points and states (empty, loading, locked, error):**
   - Group button in controls panel, visual indicators, toast notifications.

10. **Accessibility/keyboard expectations:**
    - Cmd/Ctrl+G to group, Cmd/Ctrl+Shift+G to ungroup, screen reader announcements.

11. **Security/permissions implications:**
    - Users can only group shapes they have access to, group operations respect shape locking.

12. **Dependencies or blocking integrations:**
    - Requires existing multi-select system, CanvasService, Firestore setup.

13. **Rollout strategy (flag, migration) and success metrics:**
    - No feature flag needed, track group creation/usage metrics.

14. **What is explicitly out of scope for this iteration?**
    - Nested groups, group-level styling, complex group transforms.

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Consider Firebase/Firestore limitations and optimize for real-time collaboration.
- Ensure TypeScript types are comprehensive for better development experience.

---
