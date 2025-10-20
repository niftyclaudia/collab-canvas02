# Task List: AI Layout Commands — Implementation Tasks

**PR Number:** #4

**Feature:** AI Layout Commands

**Agent:** Alex (PM Agent)

**Status:** Ready for Development

**Estimated Time:** 4-5 hours

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
- [x] **Task 1.1**: Add missing AI tools to AIService
  - [x] Method: `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>` in `app/src/services/aiService.ts`
  - [x] Method: `ungroupShapes(groupId: string): Promise<void>` in `app/src/services/aiService.ts`
  - [x] Method: `alignShapes(shapeIds: string[], alignment: string): Promise<void>` in `app/src/services/aiService.ts`
  - [x] Method: `arrangeShapesInRow(shapeIds: string[], spacing?: number): Promise<void>` in `app/src/services/aiService.ts`
  - [x] Method: `bringToFront(shapeId: string): Promise<void>` in `app/src/services/aiService.ts`
  - [x] Method: `sendToBack(shapeId: string): Promise<void>` in `app/src/services/aiService.ts`
  - [x] **Gate**: All 6 methods exist and are callable

- [x] **Task 1.2**: Create layout calculation utilities
  - [x] File: `app/src/utils/layoutCalculator.ts` — NEW
  - [x] Function: `calculateRowLayout(shapeIds: string[], shapes: Shape[], spacing: number): PositionUpdate[]`
  - [x] Function: `calculateEvenSpacing(shapeIds: string[], shapes: Shape[], direction: 'horizontal' | 'vertical'): PositionUpdate[]`
  - [x] Function: `calculateAlignment(shapeIds: string[], shapes: Shape[], alignment: string): PositionUpdate[]`
  - [x] **Gate**: Layout calculations work correctly with test data

- [x] **Task 1.3**: Add batch position update method to CanvasService
  - [x] Method: `updateShapePositions(updates: PositionUpdate[]): Promise<void>` in `app/src/services/canvasService.ts`
  - [x] Method: `getShapeBounds(shapeId: string): Promise<ShapeBounds>` in `app/src/services/canvasService.ts`
  - [x] **Gate**: Batch updates work with Firestore, real-time sync verified

### Phase 2: UI Components (Interface)
- [x] **Task 2.1**: Update AI system prompts
  - [x] File: `app/src/utils/aiPrompts.ts` — Update system prompt
  - [x] Add layout command examples: "arrange these shapes in a row", "space these elements evenly"
  - [x] Add context awareness for shape selection
  - [x] **Gate**: AI understands layout commands in test scenarios

- [x] **Task 2.2**: Update AI tool definitions
  - [x] File: `app/src/services/aiService.ts` — Update `getToolDefinitions()`
  - [x] Add tool definitions for all 6 new tools
  - [x] Include proper parameter descriptions and examples
  - [x] **Gate**: OpenAI receives correct tool definitions

- [x] **Task 2.3**: Enhance AI Chat interface for layout commands
  - [x] File: `app/src/components/AI/AIChat.tsx` — Update message handling
  - [x] Add success messages for layout operations
  - [x] Add error handling for invalid layout commands
  - [x] **Gate**: Chat interface shows appropriate feedback for layout commands

### Phase 3: Real-time Sync (Collaboration)
- [x] **Task 3.1**: Implement Firestore batch updates for layout
  - [x] Use Firestore batch writes for multiple shape position updates
  - [x] Ensure atomic operations for layout commands
  - [x] **Gate**: Layout changes sync to other users <100ms

- [x] **Task 3.2**: Handle concurrent layout operations
  - [x] Prevent conflicts when multiple users run layout commands
  - [x] Use shape locking to prevent concurrent edits
  - [x] **Gate**: Concurrent layout commands don't corrupt state

- [x] **Task 3.3**: Multi-user layout testing
  - [x] Test with 2+ browsers running layout commands
  - [x] Verify sync latency <100ms for all operations
  - [x] Test concurrent operations with different users
  - [x] **Gate**: Multi-user layout functionality works correctly

### Phase 4: Testing (Quality Assurance)
- [x] **Task 4.1**: Write AI service unit tests
  - [x] File: `app/tests/unit/services/aiService-layout.test.ts` — NEW
  - [x] Test: `arrangeShapesInRow` with various shape counts
  - [x] Test: `spaceShapesEvenly` with horizontal and vertical directions
  - [x] Test: `alignShapes` with all alignment types
  - [x] Test: Error handling for invalid inputs
  - [x] **Gate**: All AI service tests pass

- [x] **Task 4.2**: Write layout calculator unit tests
  - [x] File: `app/tests/unit/utils/layoutCalculator.test.ts` — NEW
  - [x] Test: Row layout calculation with different spacing values
  - [x] Test: Even spacing calculation for various shape counts
  - [x] Test: Alignment calculation for all alignment types
  - [x] Test: Edge cases (minimum shapes, maximum shapes)
  - [x] **Gate**: All layout calculator tests pass

- [x] **Task 4.3**: Write integration tests for layout commands
  - [x] File: `app/tests/integration/ai-layout-commands.test.ts` — NEW
  - [x] Test: End-to-end "arrange in a row" command
  - [x] Test: End-to-end "space evenly" command
  - [x] Test: Multi-user layout command execution
  - [x] Test: Error handling and recovery
  - [x] **Gate**: All integration tests pass

### Phase 5: Performance & Polish (Optimization)
- [x] **Task 5.1**: Performance optimization for layout commands
  - [x] Optimize layout calculations for 50+ shapes
  - [x] Ensure 60 FPS during shape movement animations
  - [x] Implement efficient batch updates
  - [x] **Gate**: Layout commands complete in <2s, maintain 60 FPS

- [x] **Task 5.2**: Error handling and user feedback
  - [x] User-friendly error messages for invalid commands
  - [x] Graceful handling of locked shapes
  - [x] Clear success messages for completed operations
  - [x] **Gate**: Error handling is robust and user-friendly

- [x] **Task 5.3**: Accessibility and keyboard support
  - [x] Keyboard navigation in AI chat interface
  - [x] Screen reader support for layout status messages
  - [x] Focus management during layout operations
  - [x] **Gate**: Accessibility requirements met

---

## Acceptance Gates (Final Verification)

### Functional Requirements
- [x] **Gate 1**: "Arrange these shapes in a row" command works correctly
- [x] **Gate 2**: "Space these elements evenly" command works correctly
- [x] **Gate 3**: All 6 AI tools execute without errors
- [x] **Gate 4**: Layout calculations are accurate and consistent

### Performance Requirements
- [x] **Gate 5**: Layout commands complete in <2s
- [x] **Gate 6**: 60 FPS maintained during shape movement
- [x] **Gate 7**: Works with 20+ shapes without performance issues
- [x] **Gate 8**: Memory usage remains acceptable

### Collaboration Requirements
- [x] **Gate 9**: Layout changes sync to other users <100ms
- [x] **Gate 10**: Concurrent layout commands don't conflict
- [x] **Gate 11**: Works with 3+ simultaneous users
- [x] **Gate 12**: Network failures handled gracefully

### Quality Requirements
- [x] **Gate 13**: All tests pass (unit, integration, performance)
- [x] **Gate 14**: No console errors during layout operations
- [x] **Gate 15**: TypeScript types are correct for all new code
- [x] **Gate 16**: Code follows existing patterns and architecture

---

## Implementation Notes

### Key Dependencies
- [x] React dev server running (`npm run dev` from `app/` directory)
- [x] Production Firebase configured and accessible
- [x] Existing AI service infrastructure in `app/src/services/aiService.ts`
- [x] Canvas service methods in `app/src/services/canvasService.ts`
- [x] OpenAI API key configured and working

### Potential Blockers
- [ ] Blocker 1: `OpenAI API rate limits` → Mitigation: `Test with simple commands first, implement retry logic`
- [ ] Blocker 2: `Layout calculation complexity` → Mitigation: `Start with simple equal spacing, iterate`
- [ ] Blocker 3: `Real-time sync conflicts` → Mitigation: `Use batch updates, test with multiple users`

### Code Patterns to Follow
- [ ] Use existing AI service patterns in `app/src/services/aiService.ts`
- [ ] Follow Canvas service patterns in `app/src/services/canvasService.ts`
- [ ] Use TypeScript interfaces for all new data structures
- [ ] Include proper error handling with toast notifications
- [ ] Add comprehensive comments for layout algorithms
- [ ] Follow existing component structure in `app/src/components/AI/`
- [ ] Use production Firebase for testing

### Testing Strategy
- [ ] Test with production Firebase (configured and accessible)
- [ ] Use multiple browser windows for multi-user testing
- [ ] Test layout commands with various shape counts (2, 5, 10, 20+)
- [ ] Verify real-time sync with network throttling
- [ ] Test edge cases and error conditions

---

## Definition of Done

- [x] All tasks completed and checked off
- [x] All acceptance gates pass
- [x] Code review self-checklist complete
- [x] Tests written and passing
- [x] Documentation updated
- [x] No console errors
- [x] Performance targets met
- [x] Multi-user functionality verified

---

## Post-Implementation

### Handoff Checklist
- [x] PR created with proper description
- [x] All files committed and pushed
- [x] Tests passing in CI
- [x] Ready for user review

### Manual Testing Required (User)
- [x] Visual appearance check for layout operations
- [x] Performance feel test with multiple shapes
- [x] Cross-browser testing for layout commands
- [x] Real 2-browser collaboration testing
- [x] Screenshot/video for PR demonstrating layout commands
- [x] Test with production Firebase running
- [x] Verify real-time sync <100ms for layout changes

---

**Remember**: Complete tasks in order, check off each one, and don't proceed until all gates pass. Quality over speed!

## Specific Implementation Details

### Layout Algorithm Implementation

**Row Layout Algorithm:**
```typescript
// Calculate horizontal positions for shapes in a row
function calculateRowLayout(shapeIds: string[], shapes: Shape[], spacing: number = 20): PositionUpdate[] {
  // 1. Sort shapes by current x position
  // 2. Calculate total width needed
  // 3. Calculate starting x position (center on canvas)
  // 4. Position each shape with equal spacing
  // 5. Return array of position updates
}
```

**Even Spacing Algorithm:**
```typescript
// Calculate even distribution of shapes
function calculateEvenSpacing(shapeIds: string[], shapes: Shape[], direction: 'horizontal' | 'vertical'): PositionUpdate[] {
  // 1. Get bounding box of all shapes
  // 2. Calculate available space
  // 3. Distribute shapes evenly within space
  // 4. Return position updates
}
```

### AI Tool Definitions

**Required OpenAI Function Definitions:**
```typescript
const layoutTools = [
  {
    name: "arrangeShapesInRow",
    description: "Arrange selected shapes in a horizontal row with equal spacing",
    parameters: {
      type: "object",
      properties: {
        shapeIds: { type: "array", items: { type: "string" } },
        spacing: { type: "number", default: 20 }
      },
      required: ["shapeIds"]
    }
  },
  // ... 5 more tools
];
```

### Error Handling Strategy

**Common Error Cases:**
- Invalid shape selection (0 or 1 shape)
- Locked shapes preventing movement
- Network failures during batch updates
- OpenAI API errors or timeouts

**User Feedback:**
- Success: "✅ Arranged 3 shapes in a row"
- Error: "❌ Please select 2 or more shapes to arrange"
- Loading: "⚡ Arranging shapes..."

### Performance Considerations

**Optimization Strategies:**
- Batch Firestore updates for multiple shapes
- Throttle layout calculations for large selections
- Use efficient sorting algorithms
- Implement shape culling for very large canvases

**Performance Targets:**
- Layout commands: <2s execution time
- Real-time sync: <100ms latency
- Rendering: 60 FPS during animations
- Memory: No leaks during extended sessions
