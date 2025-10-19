# PRD: [Feature Name] — End-to-End Delivery

**Feature**: [short name]

**Version**: 1.0

**Status**: Draft | Ready for Development | In Progress | Shipped

**Agent**: Alex (PM Agent)

**Target Release**: [date or sprint]

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent Tasks] (`docs/tasks/pr-{number}-task.md`)

**Note**: This PRD is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## 1. Summary

One or two sentences that state the problem and the outcome. Focus on the minimum vertical slice that delivers user value independently.

---

## 2. Problem & Goals

- What user problem are we solving?
- Why now? (tie to rubric/OKR if relevant)
- Goals (ordered, measurable):
  - [ ] G1 — [clear goal]
  - [ ] G2 — [clear goal]

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not doing X (explain why)
- [ ] Not doing Y (explain why)

---

## 4. Success Metrics

- User-visible: [time to complete task, number of clicks, etc.]
- System: [<100ms sync peer-to-peer, 60 FPS during interactions]
- Quality: [0 blocking bugs, all acceptance gates pass]

---

## 5. Users & Stories

- As a [role], I want [action] so that [outcome].
- As a [collaborator], I want [real-time effect] so that [coordination].

---

## 6. Experience Specification (UX)

- Entry points and flows: [where in UI, how it's triggered]
- Visual behavior: [controls, tooltips, empty states]
- Loading/disabled/locked states: [what user sees/feels]
- Accessibility: [keyboard, screen reader text, focus order]
- Performance: 60 FPS during drag/resize; feedback <50ms; network sync <100ms.

If designs exist, link them; otherwise provide small ASCII sketches or bullet specs.

---

## 7. Functional Requirements (Must/Should)

- MUST: [deterministic service-layer method exists for each user action]
- MUST: [real-time sync to other clients in <100ms]
- SHOULD: [optimistic UI where safe]

Acceptance gates embedded per requirement:

- [Gate] When User A does X → User B sees Y in <100ms.
- [Gate] Error case: invalid input shows toast; no partial writes.

---

## 8. Data Model

Describe new/changed documents, schemas, and invariants.

```typescript
// Example for collaborative canvas project
{
  id: string,
  type: "rectangle | text | circle | triangle | line | image",
  position: { x: number, y: number },
  size: { width: number, height: number },
  style: {
    fillColor?: string,
    strokeColor?: string,
    strokeWidth?: number,
    opacity?: number
  },
  content?: string, // for text elements
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  canvasId: string
}
```

- Validation rules: [ranges, enums]
- Indexing/queries: [subscriptions, listeners]

---

## 9. API / Service Contracts

Specify the concrete methods at the service layer. Include parameters, validation, return values, and error conditions.

```typescript
// Example signatures for canvas project
// CanvasService methods
createShape(payload: CreateShapeInput): Promise<string>
updateShape(id: string, changes: Partial<Shape>): Promise<void>
deleteShape(id: string): Promise<void>
subscribeToShapes(canvasId: string, cb: (shapes: Shape[]) => void): Unsubscribe

// CursorService methods
updateCursorPosition(position: CursorPosition): Promise<void>
subscribeToCursors(canvasId: string, cb: (cursors: Cursor[]) => void): Unsubscribe

// PresenceService methods
updateUserPresence(status: UserPresence): Promise<void>
subscribeToPresence(canvasId: string, cb: (users: UserPresence[]) => void): Unsubscribe
```

- Pre- and post-conditions for each method
- Error handling strategy (surface via toasts, retries, etc.)

---

## 10. UI Components to Create/Modify

List paths to be added/edited with a one-line purpose each.

- `src/components/Canvas/[ComponentName].tsx` — [purpose]
- `src/components/Collaboration/[ComponentName].tsx` — [purpose]
- `src/components/Layout/[ComponentName].tsx` — [purpose]
- `src/components/UI/[ComponentName].tsx` — [purpose]

---

## 11. Integration Points

- Uses `CanvasService` for mutations
- Listeners via Firestore/RTDB subscriptions
- State wired through `CanvasContext`
- Real-time collaboration via `CursorService` and `PresenceService`
- Authentication via `AuthContext` and `AuthService`

---

## 12. Test Plan & Acceptance Gates

Define BEFORE implementation. Use checkboxes; each sub-task must have a gate.

- Happy Path
  - [ ] Action A creates record; appears on canvas
  - [ ] Gate: User B sees in <100ms
- Edge Cases
  - [ ] Invalid inputs rejected with clear message
  - [ ] Lock conflict handled predictably
- Multi-User
  - [ ] Concurrent actions do not corrupt state
  - [ ] Cursor positions sync in real-time
  - [ ] User presence updates correctly
- Performance
  - [ ] 60 FPS during drag/resize with 50+ shapes
  - [ ] Canvas renders smoothly with 100+ elements

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented and unit-tested
- [ ] UI implemented with loading/empty/error states
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard/Accessibility checks pass
- [ ] Test Plan checkboxes all pass
- [ ] Docs created: Action Plan, Quick Start, Summary
- [ ] Firebase rules updated if needed
- [ ] TypeScript types properly defined

---

## 14. Risks & Mitigations

- Risk: [area] → Mitigation: [approach]
- Risk: [performance/consistency] → Mitigation: [throttle, batch writes]
- Risk: Real-time sync conflicts → Mitigation: Operational transforms or conflict resolution
- Risk: Firebase quota limits → Mitigation: Optimize queries, implement pagination

---

## 15. Rollout & Telemetry

- Feature flag? [yes/no]
- Metrics: [usage, errors, latency]
- Manual validation steps post-deploy
- Firebase Analytics events to track

---

## 16. Open Questions

- Q1: [decision needed]
- Q2: [dependency/owner]

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] Future X
- [ ] Future Y

---

## Preflight Questionnaire (Complete Before Generating This PRD)

Answer succinctly; these drive the vertical slice and acceptance gates.

1. What is the smallest end-to-end user outcome we must deliver in this PR?
2. Who is the primary user and what is their critical action?
3. Must-have vs nice-to-have: what gets cut first if time tight?
4. Real-time collaboration requirements (peers, <100ms sync)?
5. Performance constraints (FPS, shape count, latency targets)?
6. Error/edge cases we must handle (validation, conflicts, offline)?
7. Data model changes needed (new fields/collections)?
8. Service APIs required (create/update/delete/subscribe)?
9. UI entry points and states (empty, loading, locked, error):
10. Accessibility/keyboard expectations:
11. Security/permissions implications:
12. Dependencies or blocking integrations:
13. Rollout strategy (flag, migration) and success metrics:
14. What is explicitly out of scope for this iteration?

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Consider Firebase/Firestore limitations and optimize for real-time collaboration.
- Ensure TypeScript types are comprehensive for better development experience.

---
