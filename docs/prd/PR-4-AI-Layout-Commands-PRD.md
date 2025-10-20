# PRD: AI Layout Commands — End-to-End Delivery

**Feature**: AI Layout Commands

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Alex (PM Agent)

**Target Release**: Phase 2

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent Tasks] (`docs/tasks/PR-4-AI-Layout-Commands-Tasks.md`)

**Note**: This PRD is created by the PM Agent (Alex) and handed off to the Builder Agent (Bob) for implementation.

---

## 1. Summary

Implement AI layout commands including "arrange in a row" for natural language shape organization, enabling users to organize shapes through conversational AI commands with proper spacing calculations and real-time collaboration.

---

## 2. Problem & Goals

- **User Problem**: Users need to organize multiple shapes into structured layouts (rows, grids, aligned arrangements) but manual positioning is time-consuming and imprecise
- **Why Now**: This is a critical feature for the AI agent rubric points and enables professional design workflows
- **Goals** (ordered, measurable):
  - [ ] G1 — Users can say "arrange these shapes in a row" and AI positions them horizontally with proper spacing
  - [ ] G2 — Users can say "space these elements evenly" and AI distributes shapes with consistent gaps
  - [ ] G3 — All 6 missing AI tools work correctly (groupShapes, ungroupShapes, alignShapes, arrangeShapesInRow, bringToFront, sendToBack)
  - [ ] G4 — Layout commands work with any number of shapes (2-50+)
  - [ ] G5 — Real-time sync ensures all users see layout changes <100ms

---

## 3. Non-Goals / Out of Scope

- [ ] Not doing complex grid layouts (3x3, 4x4) - focus on simple row arrangement first
- [ ] Not doing automatic shape sizing - maintain existing dimensions
- [ ] Not doing undo/redo for AI commands - manual corrections only
- [ ] Not doing custom spacing algorithms - use simple equal spacing

---

## 4. Success Metrics

- **User-visible**: "Arrange these shapes in a row" command completes in <2s
- **System**: Layout changes sync to other users <100ms, 60 FPS maintained during operations
- **Quality**: 90%+ accuracy on valid layout commands, 0 blocking bugs in core functionality

---

## 5. Users & Stories

- As a **designer**, I want to say "arrange these shapes in a row" so that I can quickly organize elements without manual positioning
- As a **collaborator**, I want to see layout changes in real-time so that I can coordinate with my team
- As a **user**, I want AI to understand shape context so that layout commands work with any selection

---

## 6. Experience Specification (UX)

- **Entry points**: AI Chat interface (bottom drawer) with natural language input
- **Visual behavior**: Success messages show in chat, shapes animate to new positions, loading indicator during processing
- **Loading/disabled/locked states**: "⚡ AI is thinking..." during processing, error messages for invalid commands
- **Accessibility**: Keyboard navigation in chat input, screen reader support for status messages
- **Performance**: 60 FPS during shape movement, feedback <50ms, network sync <100ms

---

## 7. Functional Requirements (Must/Should)

- **MUST**: AI service has `arrangeShapesInRow` tool that calculates horizontal positions with equal spacing
- **MUST**: AI service has all 6 missing tools (groupShapes, ungroupShapes, alignShapes, arrangeShapesInRow, bringToFront, sendToBack)
- **MUST**: Real-time sync to other clients in <100ms
- **SHOULD**: Optimistic UI updates where safe (immediate visual feedback)

**Acceptance gates embedded per requirement:**

- [Gate] When User A says "arrange these shapes in a row" → shapes move to horizontal line with equal spacing
- [Gate] When User B is watching → sees layout changes in real-time <100ms
- [Gate] Error case: invalid selection shows "Please select 2 or more shapes" message
- [Gate] All 6 AI tools execute successfully without errors

---

## 8. Data Model

No new Firestore collections needed. Uses existing shapes collection with updated positions.

**Layout Algorithm Data Structure:**
```typescript
interface LayoutCommand {
  shapeIds: string[];
  command: 'arrangeInRow' | 'spaceEvenly' | 'alignLeft' | 'alignCenter' | 'alignRight';
  spacing?: number; // pixels between shapes
  direction?: 'horizontal' | 'vertical';
}

interface ShapePosition {
  id: string;
  x: number;
  y: number;
  // existing shape properties unchanged
}
```

**Validation rules**: 
- Minimum 2 shapes for layout commands
- Maximum 50 shapes for performance
- Spacing between 10-200 pixels

**Indexing/queries**: 
- Real-time subscriptions to shapes collection
- Batch updates for multiple shape positions

---

## 9. API / Service Contracts

**AIService methods (new tools):**
```typescript
// Layout commands
arrangeShapesInRow(shapeIds: string[], spacing?: number): Promise<void>
spaceShapesEvenly(shapeIds: string[], direction: 'horizontal' | 'vertical'): Promise<void>

// Grouping operations  
groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>
ungroupShapes(groupId: string): Promise<void>

// Alignment operations
alignShapes(shapeIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Promise<void>

// Z-index operations
bringToFront(shapeId: string): Promise<void>
sendToBack(shapeId: string): Promise<void>
```

**CanvasService methods (supporting layout):**
```typescript
// Batch position updates for layout commands
updateShapePositions(updates: Array<{id: string, x: number, y: number}>): Promise<void>

// Get shape bounds for layout calculations
getShapeBounds(shapeId: string): Promise<{x: number, y: number, width: number, height: number}>
```

**Pre- and post-conditions:**
- Pre: At least 2 shapes selected, all shapes exist and unlocked
- Post: Shapes positioned according to layout algorithm, positions synced to Firestore
- Error handling: Toast notifications for failures, graceful degradation

---

## 10. UI Components to Create/Modify

- `app/src/services/aiService.ts` — Add 6 missing AI tools with proper function definitions
- `app/src/services/canvasService.ts` — Add batch position update methods
- `app/src/components/AI/AIChat.tsx` — Update to handle layout command responses
- `app/src/utils/aiPrompts.ts` — Add layout command examples to system prompt
- `app/src/utils/layoutCalculator.ts` — NEW: Layout calculation utilities

---

## 11. Integration Points

- Uses `AIService` for command execution
- Uses `CanvasService` for shape position updates  
- Listeners via Firestore subscriptions for real-time sync
- State wired through `CanvasContext` for shape selection
- Authentication via `AuthContext` for user identification
- Real-time collaboration via existing cursor and presence systems

---

## 12. Test Plan & Acceptance Gates

**Happy Path:**
- [ ] User selects 3 shapes, says "arrange in a row" → shapes align horizontally with equal spacing
- [ ] Gate: User B sees layout changes in <100ms
- [ ] Gate: All 6 AI tools execute without errors

**Edge Cases:**
- [ ] Invalid selection (0 or 1 shape) shows clear error message
- [ ] Lock conflict handled gracefully with user feedback
- [ ] Network failure during layout shows retry option

**Multi-User:**
- [ ] User A executes layout command → User B sees changes in real-time
- [ ] Concurrent layout commands don't conflict
- [ ] User presence updates correctly during AI operations

**Performance:**
- [ ] Layout commands complete in <2s
- [ ] 60 FPS maintained during shape movement
- [ ] Works with 20+ shapes without performance degradation

---

## 13. Definition of Done (End-to-End)

- [ ] All 6 AI tools implemented and unit-tested
- [ ] Layout calculation algorithm works correctly
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Error handling with user-friendly messages
- [ ] Test Plan checkboxes all pass
- [ ] AI system prompt updated with layout examples
- [ ] TypeScript types properly defined for all new methods
- [ ] Performance targets met (60 FPS, <2s latency)

---

## 14. Risks & Mitigations

- **Risk**: Layout algorithm complexity → Mitigation: Start with simple equal spacing, iterate
- **Risk**: AI tool integration conflicts → Mitigation: Test each tool individually first
- **Risk**: Performance with many shapes → Mitigation: Limit to 50 shapes, optimize calculations
- **Risk**: Real-time sync conflicts → Mitigation: Use batch updates, test concurrent operations

---

## 15. Rollout & Telemetry

- **Feature flag**: No (core AI functionality)
- **Metrics**: Layout command success rate, execution time, user satisfaction
- **Manual validation**: Test with 2+ users, verify all 6 tools work
- **Firebase Analytics**: Track AI command usage and success rates

---

## 16. Open Questions

- **Q1**: Should layout commands work with grouped shapes? → Decision: Yes, treat groups as single units
- **Q2**: What's the maximum number of shapes for layout commands? → Decision: 50 shapes for performance

---

## 17. Appendix: Out-of-Scope Backlog

- [ ] Complex grid layouts (3x3, 4x4 matrices)
- [ ] Custom spacing algorithms (golden ratio, fibonacci)
- [ ] Undo/redo for AI commands
- [ ] Advanced alignment options (distribute, justify)

---

## Preflight Questionnaire (Complete Before Generating This PRD)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can say "arrange these shapes in a row" and AI positions them horizontally with equal spacing

2. **Who is the primary user and what is their critical action?**
   - Designer selecting multiple shapes and using natural language to organize them

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: arrangeInRow, spaceEvenly, basic alignment. Nice-to-have: complex grid layouts

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, all layout changes must sync to other users in <100ms

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS during operations, <2s AI response time, works with 50+ shapes

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Invalid selections, locked shapes, network failures, concurrent operations

7. **Data model changes needed (new fields/collections)?**
   - No new collections, uses existing shapes with position updates

8. **Service APIs required (create/update/delete/subscribe)?**
   - 6 new AI tools, batch position updates, layout calculation utilities

9. **UI entry points and states (empty, loading, locked, error):**
   - AI Chat interface, loading indicators, success/error messages

10. **Accessibility/keyboard expectations:**
    - Keyboard navigation in chat, screen reader support for status

11. **Security/permissions implications:**
    - Uses existing authentication, no new permissions needed

12. **Dependencies or blocking integrations:**
    - OpenAI API, existing AI service infrastructure

13. **Rollout strategy (flag, migration) and success metrics:**
    - No feature flag needed, track command success rates

14. **What is explicitly out of scope for this iteration?**
    - Complex grids, custom spacing algorithms, undo/redo

---

## Authoring Notes

- Focus on the core "arrange in a row" functionality as the primary deliverable
- Ensure all 6 missing AI tools are implemented for complete rubric coverage
- Keep layout algorithm simple but effective
- Test thoroughly with multiple users to verify real-time sync
- Maintain existing code patterns and service layer architecture
