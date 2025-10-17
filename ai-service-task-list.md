# AI Service Implementation Task List

## PR #1: AI Service Foundation + Creation Tools

**Timeline:** 45 minutes  
**Complexity:** Medium (new service, OpenAI integration)

---

## 📋 Implementation Checklist

### Phase 1: Setup & Dependencies (5 minutes)

- [ ] **Install OpenAI dependency**
  - [ ] Run `npm install openai`
  - [ ] Verify `package.json` includes `"openai": "^4.20.0"`
  - [ ] Check installation completes without errors

- [ ] **Environment setup**
  - [ ] Add `VITE_OPENAI_API_KEY=sk-...your-key-here` to `.env.example`
  - [ ] Add `VITE_OPENAI_API_KEY=sk-...your-key-here` to `.env` (actual key)
  - [ ] Verify environment variable is accessible

### Phase 2: Core Implementation (30 minutes)

- [ ] **Create AIService class** (`src/services/aiService.ts`)
  - [ ] Import OpenAI and CanvasService dependencies
  - [ ] Define CommandResult interface
  - [ ] Implement constructor with OpenAI client initialization
  - [ ] Implement main `executeCommand()` method
  - [ ] Implement `executeToolCalls()` method
  - [ ] Implement `executeSingleTool()` method with switch statement
  - [ ] Implement `generateSuccessMessage()` method
  - [ ] Implement `getToolDefinitions()` method

- [ ] **Create AI prompts utility** (`src/utils/aiPrompts.ts`)
  - [ ] Implement `getSystemPrompt()` function
  - [ ] Add canvas context summary logic
  - [ ] Add critical rules section (coordinates, defaults)
  - [ ] Add position helpers mapping
  - [ ] Add color codes mapping
  - [ ] Add example commands with expected outputs

- [ ] **Implement 4 creation tools**
  - [ ] **createRectangle tool**
    - [ ] Define function schema with x, y, width, height, color
    - [ ] Implement execution logic calling `canvasService.createShape()`
    - [ ] Set proper defaults (rotation: 0, zIndex: 0, etc.)
  
  - [ ] **createCircle tool**
    - [ ] Define function schema with x, y, radius, color
    - [ ] Implement execution logic calling `canvasService.createCircle()`
  
  - [ ] **createTriangle tool**
    - [ ] Define function schema with x, y, width, height, color
    - [ ] Implement execution logic calling `canvasService.createTriangle()`
  
  - [ ] **createText tool**
    - [ ] Define function schema with text, x, y, fontSize, color, formatting
    - [ ] Implement execution logic calling `canvasService.createText()`
    - [ ] Handle optional parameters (fontSize, color, fontWeight, etc.)

### Phase 3: Testing & Validation (10 minutes)

- [ ] **Basic functionality tests**
  - [ ] Test: `"create a blue rectangle at 500, 500"`
    - [ ] Expected: Blue rectangle appears at (500, 500)
    - [ ] Expected console: "✓ Created 1 rectangle"
  
  - [ ] Test: `"create a red rectangle in the center"`
    - [ ] Expected: Red rectangle appears centered on canvas
    - [ ] Expected console: "✓ Created 1 rectangle"
  
  - [ ] Test: `"add a green circle at the top"`
    - [ ] Expected: Green circle appears at top center
    - [ ] Expected console: "✓ Created 1 circle"
  
  - [ ] Test: `"make a yellow triangle in the bottom-left"`
    - [ ] Expected: Yellow triangle appears in bottom-left area
    - [ ] Expected console: "✓ Created 1 triangle"
  
  - [ ] Test: `"add text that says Hello World"`
    - [ ] Expected: "Hello World" text appears on canvas
    - [ ] Expected console: "✓ Created text layer"
  
  - [ ] Test: `"create bold italic text saying TITLE at the center"`
    - [ ] Expected: Bold, italic "TITLE" text appears centered
    - [ ] Expected console: "✓ Created text layer"

- [ ] **Error handling tests**
  - [ ] Test: `"create a rectangle at 10000, 10000"`
    - [ ] Expected: Graceful error message (position out of bounds)
  
  - [ ] Test: `"create 3 blue rectangles at 100, 200"`
    - [ ] Expected: 3 blue rectangles appear
    - [ ] Expected console: "✓ Created 3 elements"

### Phase 4: Quality Assurance

- [ ] **Position accuracy verification**
  - [ ] Verify centered shapes are truly centered
  - [ ] Verify position helpers work correctly
  - [ ] Test all position keywords: center, top, bottom, left, right, top-left, etc.

- [ ] **Color code verification**
  - [ ] Verify exact hex codes: #3b82f6 (blue), #ef4444 (red), #10b981 (green), #f59e0b (yellow)
  - [ ] Test color name to hex conversion

- [ ] **Text formatting verification**
  - [ ] Test bold text formatting
  - [ ] Test italic text formatting
  - [ ] Test underline text formatting
  - [ ] Test font size variations

- [ ] **Performance verification**
  - [ ] Verify API calls complete in <2 seconds
  - [ ] Check for console errors during execution
  - [ ] Verify real-time canvas updates

---

## 🧪 Testing Commands Reference

```typescript
// Initialize service
const ai = new AIService();
const userId = "test_user_123";

// Test commands (run in browser console)
await ai.executeCommand("create a blue rectangle at 500, 500", userId);
await ai.executeCommand("create a red rectangle in the center", userId);
await ai.executeCommand("add a green circle at the top", userId);
await ai.executeCommand("make a yellow triangle in the bottom-left", userId);
await ai.executeCommand("add text that says Hello World", userId);
await ai.executeCommand("create bold italic text saying TITLE at the center", userId);
await ai.executeCommand("create a rectangle at 10000, 10000", userId);
await ai.executeCommand("create 3 blue rectangles at 100, 200", userId);
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "OpenAI API key not found"
**Solution:** Check `.env` file has `VITE_OPENAI_API_KEY=sk-...`

### Issue 2: AI creates shape but it doesn't appear
**Solution:** Check `canvasService.createShape()` is working manually first

### Issue 3: AI doesn't understand position commands
**Solution:** Review system prompt examples, ensure position helpers are clear

### Issue 4: "Tool call failed" errors
**Solution:** Check `executeSingleTool()` switch statement has correct cases

### Issue 5: Shapes created at wrong positions
**Solution:** Verify position calculations in system prompt (centering logic)

---

## ✅ Success Criteria

### Must Pass:
- [ ] `npm install openai` completes without errors
- [ ] Environment variable `VITE_OPENAI_API_KEY` is set
- [ ] Can import `AIService` class
- [ ] Can call `ai.executeCommand()` without errors
- [ ] AI creates rectangles on command
- [ ] AI creates circles on command
- [ ] AI creates triangles on command
- [ ] AI creates text on command
- [ ] Created shapes appear on canvas in real-time
- [ ] Success messages are returned ("✓ Created 1 rectangle")
- [ ] Error messages are returned when something fails
- [ ] All 9 testing commands above work

### Quality Checks:
- [ ] Position calculations are accurate (centered shapes are truly centered)
- [ ] Color codes match exactly (#3b82f6 for blue, etc.)
- [ ] Text formatting works (bold, italic, underline)
- [ ] AI understands vague commands ("at the center", "at the top")
- [ ] No console errors during execution
- [ ] API calls complete in <2 seconds for single commands

---

## 📁 Files to Create/Modify

```
src/services/aiService.ts          (NEW - 200 lines)
src/utils/aiPrompts.ts             (NEW - 100 lines)
.env.example                       (UPDATE - add VITE_OPENAI_API_KEY)
package.json                       (UPDATE - add openai dependency)
```

---

## ⏱️ Time Breakdown

- **OpenAI setup:** 5 min
- **AIService implementation:** 20 min
- **System prompt:** 10 min
- **Testing:** 10 min

**Total: ~45 minutes**

---

## 🚀 What's Next (PR #2)

After this PR is complete and tested:
- **PR #2** will add 11 more tools (move, resize, rotate, group, align, etc.)
- **PR #2** will expand the system prompt for manipulation commands
- **PR #2** will add layout commands ("arrange in a row")

**Do not implement PR #2 features yet.** This PR should only focus on creation tools.

