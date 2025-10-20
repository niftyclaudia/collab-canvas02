# CollabCanvas Phase 2 — Product Requirements

**Tagline:** "Make patterns together, keep them forever."

**Goal:** Transform MVP into production-ready collaborative design tool with AI assistance

**Status:** Phase 1 Complete ✅ → Phase 2 (Developing)

---

## 🎯 What It Is

**Real-time collaborative canvas for friends/family to co-create simple shape art.**

A collaborative design tool where 2-4 "memory makers" craft gifts and keepsakes remotely. Users create shapes and layouts with friends in real-time, enhanced with AI natural language commands. Think: Figma meets ChatGPT for collaborative design.

**Promise:** Collaborative creativity → tangible memories.

---

## 👤 User Flow

1. **Entry & Setup**
   - Visit CollabCanvas
   - Sign up/log in
   - Enter shared canvas

2. **Collaborative Creation**
   - Each user gets their own layer
   - Create shapes: rectangles, circles, triangles, text
   - See each other online in real-time
   - Shape locking with toast notifications
   - Live cursor tracking

3. **AI-Assisted Layout** (Phase 2)
   - Click AI chat interface
   - Natural language commands
   - AI repositions shapes while maintaining design

4. **Grouping & Organization** (Phase 2)
   - Group shapes to move together
   - Layers stay separate per user
   - Organize complex designs

5. **Pattern Generation** (Future)
   - Click "Generate" button
   - Convert to ASCII art (1080×1080)
   - Options: color ASCII or black/white
   - Single piece OR repeating pattern

6. **Export & Share** (Future)
   - Export as PNG, SVG, or ASCII text
   - See mockup on products (mug, blanket)
   - Eventually: refer to print-on-demand services

---

## 📐 Technical Specs

- **Canvas:** 5000×5000 pixels collaborative workspace
- **Real-time:** Live cursors, presence, shape locking
- **AI:** OpenAI GPT-4-turbo with 15 function tools
- **Database:** Firebase Firestore + Realtime Database
- **Performance:** 60 FPS with 500+ shapes, 5+ concurrent users
- **Output:** Generate ASCII patterns (1080×1080), PNG/SVG/ASCII exports
- **Share:** Mock on mugs/blankets; export for print-on-demand

---

## 🎨 Design Notes

**AI Chat Interface:** Bottom drawer with message history, natural language commands, and real-time feedback

---

## ✅ Feature Checklist

### Infrastructure (Completed)
- [x] User authentication (signup/login)
- [x] Canvas persistence (Firestore)
- [x] Real-time collaboration with live cursors
- [x] Shape tools (rectangle, circle, triangle, text)
- [x] Shape manipulation (move, resize, rotate, delete)
- [x] Multi-select (shift+click, marquee)
- [x] Keyboard shortcuts (delete, duplicate, copy/paste)
- [x] Text formatting (bold, italic, underline)
- [x] AI service with 9 tools (4 creation + 5 manipulation + 1 state)
  - [x] **Creation (4 tools):** createRectangle, createCircle, createTriangle, createText
  - [x] **Manipulation (5 tools):** moveShape, resizeShape, rotateShape, duplicateShape, deleteShape
  - [x] **State (1 tool):** getCanvasState
  - [ ] **Missing (6 tools):** groupShapes, ungroupShapes, alignShapes, arrangeShapesInRow, bringToFront, sendToBack
- [x] Live cursors, presence, edit locks
- [x] Shape locking with toast notifications

### Advanced Features (Missing - Phase 2)
- [ ] **Grouping**
  - [ ] Select 2+ shapes, group/ungroup functionality
  - [ ] Grouped shapes move as one unit
  - [ ] Visual indicators for grouped shapes
  - [ ] Real-time sync across users
- [ ] **Z-Index Management**
  - [ ] Bring to front/back buttons
  - [ ] Bring forward/backward buttons
  - [ ] Visual layer ordering
  - [ ] Real-time sync
- [ ] **AI Chat UI**
  - [ ] Bottom drawer chat interface
  - [ ] Message history with scroll
  - [ ] Input field with send button
  - [ ] Status indicators (processing, success, error)
- [ ] **AI Layout Commands** ("arrange in a row")
  - [ ] Add `arrangeShapesInRow` tool to AIService
  - [ ] "Arrange these shapes in a horizontal row"
  - [ ] "Space these elements evenly"
  - [ ] Layout command execution
  - [ ] Error handling for invalid commands

### Nice-to-Have (Optional)
- [ ] **Alignment Tools**
  - [ ] Align left, center, right, top, middle, bottom
  - [ ] Distribute horizontally/vertically
  - [ ] Multi-shape operations
  - [ ] Visual feedback during alignment
- [ ] **Comments System**
  - [ ] Add comments to shapes
  - [ ] Comment threads with replies
  - [ ] Real-time comment sync
  - [ ] Comment indicators on shapes
- [ ] **Advanced Keyboard Shortcuts**
  - [ ] Group operations (Cmd/Ctrl+G)
  - [ ] Z-index shortcuts (Cmd/Ctrl+], Cmd/Ctrl+[)
  - [ ] Select all (Cmd/Ctrl+A)
  - [ ] Arrow keys for nudging
- [ ] **Performance Optimization** (500+ shapes)
  - [ ] 60 FPS with 500+ shapes
  - [ ] Efficient marquee selection
  - [ ] Optimized AI response times
  - [ ] Shape culling for large canvases
- [ ] **Complex AI Commands** (login form, grids)
  - [ ] "Create a login form" (6 elements)
  - [ ] "Make a 3x3 grid of squares"
  - [ ] Multi-step AI operations
  - [ ] Complex layout generation

### Future Vision (Post-Phase 2)
- [ ] **Pattern Generation** (Magic Soon)
  - [ ] "Grid this", "balance these", "circular pattern" AI commands
  - [ ] Generate ASCII patterns (1080×1080)
  - [ ] Color ASCII or black/white options
  - [ ] Single piece OR repeating pattern
- [ ] **Export & Share** (Future)
  - [ ] Export as PNG, SVG, or ASCII text
  - [ ] Mock on mugs/blankets
  - [ ] Print-on-demand integration
  - [ ] Collaborative creativity → tangible memories

---

## 🚀 PR Roadmap

### Phase 2: Essential Features
1. **PR #1: Grouping** - Select 2+ shapes, group/ungroup functionality
2. **PR #2: Z-Index Management** - Bring to front/back, forward/backward  
3. **PR #3: AI Chat UI** - Bottom drawer interface for AI commands
4. **PR #4: AI Layout Commands** - "Arrange these shapes in a row" works
5. **PR #5: Demo Video** - 3-5 minutes showing all features
6. **PR #6: Testing & Deploy** - Production readiness

### Phase 3: Nice-to-Have (If Time Permits)
7. **PR #7: Alignment Tools** - Align left/center/right, distribute
8. **PR #8: Comments System** - Collaborative commenting on shapes
9. **PR #9: Advanced Shortcuts** - Group operations, z-index shortcuts
10. **PR #10: Performance** - 500+ shapes, optimization

---

## 🎯 School Project Requirements

**Core (Must Have):**
- **Grouping** ← REQUIRED
- **Z-Index Management** ← REQUIRED  
- **AI Chat UI** (AI functionality) ← REQUIRED
- **AI Layout Commands** ("arrange in a row") ← REQUIRED
- Real-time collaboration (already working)
- Multi-select and shape manipulation (already working)

**Stretch Goals (If Time Permits):**
- Alignment Tools
- Comments System
- Advanced Keyboard Shortcuts
- Performance Optimization (500+ shapes)
- Complex AI Commands (login form, grids)

---

## ✅ Decisions Made

2. **Focus:** Essential features only - skip nice-to-have for time management
3. **AI Chat:** Bottom drawer interface (not floating Clippy)
4. **Grouping:** Simple group/ungroup (no complex group transforms)
5. **Z-Index:** 4 buttons only (front/back, forward/backward)

---

## ⚠️ Risks

- **AI Layout Commands:** "Arrange in a row" algorithm complexity
- **Performance:** New features might impact existing performance

---

## 📊 Database Schema

```typescript
// New: canvases/main/groups
{
  id: "group_abc",
  name: "Login Form",
  shapeIds: ["shape_123", "shape_456"],
  createdBy: "user_abc",
  createdAt: timestamp
}

// Updated: shapes collection
{
  // ... existing fields
  groupId: "group_abc" | null,  // NEW
  zIndex: 5,                    // NEW
}
```


---

## ⚠️ Risks

- **Time Management:** 72-hour estimate might be tight
- **AI Layout Commands:** "Arrange in a row" algorithm complexity
- **Performance:** New features might impact existing performance

--

---

## 🔧 Technical Implementation

### Service Layer Extensions

#### CanvasService Updates (Required)
```typescript
// Grouping operations
async groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>
async ungroupShapes(groupId: string): Promise<void>

// Z-index operations
async bringToFront(shapeId: string): Promise<void>
async sendToBack(shapeId: string): Promise<void>
async bringForward(shapeId: string): Promise<void>
async sendBackward(shapeId: string): Promise<void>
```

#### AIService Updates (Required)
```typescript
// Add missing tools to getToolDefinitions()
- groupShapes(shapeIds: string[], userId: string): Promise<string>
- ungroupShapes(groupId: string): Promise<void>
- alignShapes(shapeIds: string[], alignment: string): Promise<void>
- arrangeShapesInRow(shapeIds: string[], spacing: number): Promise<void>
- bringToFront(shapeId: string): Promise<void>
- sendToBack(shapeId: string): Promise<void>

// Update system prompt with layout examples
```

### UI Component Architecture (Required)

#### New Components
```
components/
├── AI/
│   ├── AIChat.tsx              // Main chat interface
│   ├── MessageHistory.tsx      // Message display
│   └── ChatInput.tsx           // Input field
└── Controls/
    ├── GroupingPanel.tsx       // Group/ungroup controls
    └── ZIndexPanel.tsx         // Layer controls
```

#### Enhanced Components
```
components/Canvas/Canvas.tsx
├── Add grouping selection logic
└── Add z-index rendering

components/Layout/LeftToolbar.tsx
├── Add grouping buttons
└── Add z-index controls
```

---

## 🧪 Testing Strategy

### Feature Testing Checklist

#### Grouping ✅
- [ ] Select 2+ shapes, click Group → shapes move together
- [ ] Select grouped shapes, click Ungroup → individual selection
- [ ] User A groups → User B sees group behavior
- [ ] Group operations sync in <100ms

#### Z-Index ✅
- [ ] Bring to front/back buttons work
- [ ] Shapes render in correct order
- [ ] User A changes z-index → User B sees layer change

#### AI Chat ✅
- [ ] Chat interface opens/closes
- [ ] Commands execute successfully
- [ ] Layout commands work ("arrange in a row")
- [ ] Error handling for invalid commands

### Performance Testing ✅
- [ ] 60 FPS maintained with 50+ shapes
- [ ] All sync operations <100ms
- [ ] AI commands meet latency targets (<2s single, <5s multi-step)

### Integration Testing ✅
- [ ] All features work together
- [ ] No conflicts between manual and AI operations
- [ ] Real-time sync across all features
- [ ] Error handling and recovery

---

## ⚠️ Risk Mitigation

### High-Risk Areas

1. **Time Management** - 72-hour estimate might be tight
   - **Mitigation**: Start with highest-value features (grouping, AI layout)
   - **Fallback**: Cut nice-to-have features, focus on core

2. **AI Layout Command Complexity** - "Arrange in a row" algorithm
   - **Mitigation**: Simple sorting + spacing algorithm
   - **Fallback**: Manual spacing if auto-spacing fails

4. **Performance Impact** - New features might slow down app
   - **Mitigation**: Profile early, optimize as needed
   - **Fallback**: Reduce feature complexity if needed

---

## ✅ Success Criteria

### Must Pass (Critical)
- [ ] **Grouping** - Select 2+ shapes, group/ungroup functionality
- [ ] **Z-Index Management** - Bring to front/back, forward/backward
- [ ] **AI Chat UI** - Bottom drawer interface for AI commands
- [ ] **AI Layout Commands** - "Arrange these shapes in a row" works
- [ ] **Demo Video** - 3-5 minutes showing all features
- [ ] **Deployed to Production** - Working URL
- [ ] **Basic Testing** - 2+ users, real-time sync works

---

## 🚀 Next Steps

1. **Review this PRD** - Confirm scope and priorities
2. **Start with Grouping** - Day 1
3. **Add Z-Index Management** - Day 2  
4. **Build AI Chat UI** - AI functionality - Day 3
5. **Implement Layout Commands** - "Arrange in a row" - Day 4
6. **Record Demo Video** - Day 5
7. **Test & Deploy** - Production readiness - Days 6-7

### 🚫 NICE TO HAVE **
- ❌ Alignment Tools - Can skip
- ❌ Comments System - Can skip
- ❌ Advanced Shortcuts - Polish feature
- ❌ Performance Optimization - Scale bonus
- ❌ Complex AI Commands - Advanced features

**Ready to begin Phase 2 implementation**

---

**Last Updated:** 2025-01-27
