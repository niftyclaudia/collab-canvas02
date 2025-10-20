# CollabCanvas Phase 2 - PR Briefs for Agents

**Purpose**: This document contains PR briefs for the **MISSING** features that need to be implemented for Phase 2. Based on `prd-full-features.md`, many features are already completed.

**Current Status**: Phase 1 Complete ✅ → Phase 2 (Missing Features Only)

**Template Reference**: Use `agent/prd-template.md` to create detailed PRDs from these briefs.

---

## ✅ Already Implemented (Phase 1 Complete)

Based on `prd-full-features.md`, these features are **ALREADY DONE**:
- [x] User authentication (signup/login)
- [x] Canvas persistence (Firestore)
- [x] Real-time collaboration with live cursors
- [x] Shape tools (rectangle, circle, triangle, text)
- [x] Shape manipulation (move, resize, rotate, delete)
- [x] Multi-select (shift+click, marquee)
- [x] Keyboard shortcuts (delete, duplicate, copy/paste)
- [x] Text formatting (bold, italic, underline)
- [x] AI service with 9 tools (4 creation + 5 manipulation + 1 state)
- [x] Live cursors, presence, edit locks
- [x] Shape locking with toast notifications

---

## 🚧 Missing Features for Phase 2

### PR #1: Object Grouping System

**Feature**: Group shapes together for unified operations
**Priority**: P0 - REQUIRED
**Estimated Time**: 5-6 hours

#### Brief
Implement grouping system where multiple shapes can be grouped together and move as one unit.

#### Key Requirements
- Group button appears when 2+ shapes selected
- Grouped shapes move together as one unit
- Visual indicators for grouped shapes (shared dashed border)
- Ungroup functionality
- Group operations: move, delete, duplicate entire group
- Firestore groups collection with shapeIds array
- Real-time sync across users

#### Acceptance Gates
- [ ] User A selects 3 shapes, clicks Group → they move together
- [ ] User B sees grouped behavior in real-time
- [ ] Can ungroup shapes
- [ ] Group operations work on all members
- [ ] Visual indicators show grouping state

---

### PR #2: Z-Index Management

**Feature**: Layer ordering with bring to front/back controls
**Priority**: P0 - REQUIRED
**Estimated Time**: 3-4 hours

#### Brief
Add z-index management with 4 buttons: Bring to Front, Send to Back, Bring Forward, Send Backward.

#### Key Requirements
- 4 buttons in controls panel: ⬆️🔝 To Front, ⬇️⬇️ To Back, ⬆️ Forward, ⬇️ Backward
- Z-index field in Firestore shape documents
- Shapes render sorted by z-index
- Real-time layer changes sync to other users
- Keyboard shortcuts: Cmd+], Cmd+[, Cmd+Shift+], Cmd+Shift+[

#### Acceptance Gates
- [ ] User A brings blue rectangle to front → appears on top of red rectangle
- [ ] User B sees layer change in real-time
- [ ] All 4 z-index operations work
- [ ] Shapes render in correct order
- [ ] Keyboard shortcuts work

---

### PR #3: AI Chat UI

**Feature**: Bottom drawer chat interface for AI commands
**Priority**: P0 - REQUIRED
**Estimated Time**: 5-6 hours

#### Brief
Create AI chat interface as bottom drawer for natural language commands.

#### Key Requirements
- Bottom drawer layout (300px initial height, resizable)
- Message history with scroll
- Input field with send button
- Status indicators (processing, success, error)
- Message formatting for user/AI messages
- Collapsible/expandable interface
- Real-time message updates

#### Acceptance Gates
- [ ] User types "create a blue rectangle" → AI processes → shape appears
- [ ] Success message shows in chat
- [ ] Error messages are clear
- [ ] Message history persists
- [ ] Interface is responsive and usable

---

### PR #4: AI Layout Commands

**Feature**: AI layout commands for shape organization
**Priority**: P0 - REQUIRED
**Estimated Time**: 4-5 hours

#### Brief
Implement AI layout commands including "arrange in a row" for natural language shape organization.

#### Key Requirements
- Add missing AI tools: groupShapes, ungroupShapes, alignShapes, arrangeShapesInRow, bringToFront, sendToBack
- "Arrange these shapes in a horizontal row" command
- "Space these elements evenly" command
- Layout algorithm with proper spacing calculation
- Integration with arrangeShapesInRow tool
- Context awareness for shape selection

#### Acceptance Gates
- [ ] "Arrange these shapes in a row" works correctly
- [ ] "Space these elements evenly" works
- [ ] All 6 missing AI tools work
- [ ] Layout calculations are accurate
- [ ] Commands work with any number of shapes

---

## 🎯 Nice-to-Have (Optional - If Time Permits)

### PR #5: Complex AI Commands

**Feature**: Multi-step AI commands for complex operations
**Priority**: P1 - Nice-to-Have
**Estimated Time**: 4-5 hours

#### Brief
Implement complex AI commands like "create login form", "make 3x3 grid", and other multi-step operations.

#### Key Requirements
- "Create login form" (6 elements: labels, inputs, button)
- "Make 3x3 grid of squares" (9 shapes with proper spacing)
- Multi-step command execution
- Proper positioning and sizing
- Error handling for complex operations
- Success feedback for multi-step operations

#### Acceptance Gates
- [ ] "Create login form" creates 6 properly positioned elements
- [ ] "Make 3x3 grid" creates 9 squares in grid
- [ ] Multi-step operations complete successfully
- [ ] Error handling works for failed steps
- [ ] Success messages are clear

---

### PR #6: Comments System

**Feature**: Comments attached to shapes for team collaboration
**Priority**: P1 - Nice-to-Have
**Estimated Time**: 8-10 hours

#### Brief
Add collaborative comments system where users can attach comments to shapes. Include comment indicators, comment panel, reply system, and real-time comment updates.

#### Key Requirements
- Comment icon (💬) appears on shapes with comments
- Comment panel opens when clicking comment icon
- Add comment functionality with text input
- Reply system for comment threads
- Resolve/unresolve comments
- Real-time comment updates
- Comment count badges

#### Acceptance Gates
- [ ] User A adds comment "Make this bigger" to blue rectangle
- [ ] User B sees comment icon appear, clicks it, reads comment
- [ ] User B replies "Done" → User A sees reply in real-time
- [ ] Comment panel shows all comments and replies
- [ ] Resolve functionality works

---

### PR #7: Advanced Keyboard Shortcuts

**Feature**: Additional power user keyboard shortcuts
**Priority**: P1 - Nice-to-Have
**Estimated Time**: 3-4 hours

#### Brief
Add additional keyboard shortcuts for group operations, z-index controls, and selection shortcuts.

#### Key Requirements
- Cmd/Ctrl+G: Group selected shapes
- Cmd/Ctrl+Shift+G: Ungroup selected group
- Cmd/Ctrl+]/[: Z-index controls
- Cmd/Ctrl+A: Select all
- Arrow keys: Nudge shapes (10px, 1px with Shift)
- Escape: Clear selection

#### Acceptance Gates
- [ ] All shortcuts work as expected
- [ ] No conflicts with input fields
- [ ] Visual feedback for operations
- [ ] Real-time sync for all operations

---

### PR #8: Performance Optimization

**Feature**: Optimize for 500+ shapes and 5+ users
**Priority**: P1 - Nice-to-Have
**Estimated Time**: 4-5 hours

#### Brief
Optimize performance for large canvases with 500+ shapes and 5+ concurrent users while maintaining 60 FPS.

#### Key Requirements
- 60 FPS maintained with 500+ shapes
- Efficient marquee selection
- Optimized AI response times
- Shape culling for large canvases
- Memory management improvements

#### Acceptance Gates
- [ ] 60 FPS maintained with 500+ shapes
- [ ] All sync operations <100ms
- [ ] AI commands meet latency targets
- [ ] No memory leaks or performance degradation

---

### PR #9: Alignment Tools

**Feature**: Align and distribute multiple shapes
**Priority**: P1 - Nice-to-Have
**Estimated Time**: 6-7 hours

#### Brief
Add alignment toolbar with 6 alignment options (left, center, right, top, middle, bottom) and 2 distribution options (horizontal, vertical). Appears when 2+ shapes selected.

#### Key Requirements
- Alignment toolbar: [⬅️ Left] [↔️ Center] [➡️ Right] | [⬆️ Top] [↕️ Middle] [⬇️ Bottom]
- Distribution: [↔️ Distribute H] [↕️ Distribute V]
- Calculate target positions based on alignment type
- Batch update all shapes with new positions
- Real-time sync of alignment changes

#### Acceptance Gates
- [ ] User A selects 4 shapes, clicks "Align Left" → all align to leftmost edge
- [ ] User B sees alignment in real-time
- [ ] All 6 alignment options work
- [ ] Distribution options work
- [ ] Batch updates are atomic

---

## Development Phases

### Phase 2: Essential Features (PRs #1-4)
- Grouping, Z-Index, AI Chat UI, AI Layout Commands
- **Time**: 17-22 hours
- **Focus**: Core collaborative design features

### Phase 3: Nice-to-Have (PRs #5-9)
- Complex AI, Comments, Advanced Shortcuts, Performance, Alignment Tools
- **Time**: 25-34 hours
- **Focus**: Polish and advanced features

**Total Estimated Time**: 42-56 hours (fits within 72-hour window)

---

## Success Criteria

### Must Pass (Critical)
- [ ] **Grouping** - Select 2+ shapes, group/ungroup functionality
- [ ] **Z-Index Management** - Bring to front/back, forward/backward
- [ ] **AI Chat UI** - Bottom drawer interface for AI commands
- [ ] **AI Layout Commands** - "Arrange these shapes in a row" works
- [ ] **Deployed to Production** - Working URL
- [ ] **Basic Testing** - 2+ users, real-time sync works

---

## Notes for Agents

1. **Use the PRD Template**: Each PR should be developed using the template in `agent/prd-template.md`
2. **Focus on Required Features**: PRs #1-4 are essential for the complete feature set
3. **Real-time Sync**: All features must sync to other users in <100ms
4. **AI Integration**: AI features use the same CanvasService methods as manual features
5. **User Experience**: Prioritize features that enhance collaborative design workflows
6. **Testing**: Include comprehensive acceptance gates for each PR
7. **Performance**: Maintain 60 FPS with 500+ shapes and 5+ users

Each PR should be developed as a complete, testable feature that can be demonstrated independently while contributing to the overall system.

