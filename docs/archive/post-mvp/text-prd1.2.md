[2 tools called]

# PR1.2: Shape Delete & Duplicate Controls

**Feature:** Individual Shape Controls (Delete & Duplicate)  
**Dependencies:** PR1 (Text Rendering) - Service methods already exist  
**Estimated Time:** 1-2 hours  
**Status:** Ready for Development

---

## Overview

This PR adds individual shape controls (delete and duplicate buttons) that appear when a shape is locked by the current user. The backend service methods already exist - this PR focuses on the missing UI controls.

### What's Already Done ✅
- `canvasService.deleteShape(shapeId)` method exists
- `canvasService.duplicateShape(shapeId, userId)` method exists  
- Lock system works (green/red borders)
- Text tool already added to toolbar

### What PR1.2 Adds 🎯
- Floating controls panel when shape is locked
- [🗑️ Delete] button for individual shapes
- [📋 Duplicate] button for individual shapes
- Error handling with toast notifications
- Real-time sync for delete/duplicate operations

---

## Current State Analysis

### Service Layer (Complete ✅)

Your `canvasService.ts` already has:

```typescript
// Line 689-699
async deleteShape(shapeId: string): Promise<void> {
  const shapeDocRef = doc(firestore, this.shapesCollectionPath, shapeId);
  await deleteDoc(shapeDocRef);
}

// Line 648-683  
async duplicateShape(shapeId: string, createdBy: string): Promise<Shape> {
  // Gets original shape, creates duplicate with 20px offset
  // Handles canvas bounds (wraps to 50,50 if would go outside)
  // Preserves all shape properties including text formatting
}
```

### Missing UI Controls ❌

**Current State:**
- ✅ Global "Clear Canvas" button exists (AppShell.tsx)
- ❌ **No individual shape delete/duplicate buttons**
- ❌ **No floating controls panel**

**What We Need:**
- Floating panel that appears when shape is locked
- Delete button that calls `canvasService.deleteShape()`
- Duplicate button that calls `canvasService.duplicateShape()`

---

## Implementation Plan

### Phase 1: Create Controls Panel Component (45 min)

**New File:** `app/src/components/Canvas/ShapeControls.tsx`

```typescript
interface ShapeControlsProps {
  shapeId: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: (shapeId: string) => void;
  onDuplicate: (shapeId: string) => void;
}

export function ShapeControls({ shapeId, isVisible, position, onDelete, onDuplicate }: ShapeControlsProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="shape-controls-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '8px'
      }}
    >
      <button
        onClick={() => onDelete(shapeId)}
        className="delete-button"
        title="Delete shape"
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        🗑️ Delete
      </button>
      
      <button
        onClick={() => onDuplicate(shapeId)}
        className="duplicate-button"
        title="Duplicate shape"
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        📋 Duplicate
      </button>
    </div>
  );
}
```

### Phase 2: Integrate with Canvas Component (30 min)

**File:** `app/src/components/Canvas/Canvas.tsx`

**Add state for controls panel:**

```typescript
// Add to Canvas component state
const [controlsPanel, setControlsPanel] = useState<{
  isVisible: boolean;
  shapeId: string | null;
  position: { x: number; y: number };
}>({
  isVisible: false,
  shapeId: null,
  position: { x: 0, y: 0 }
});
```

**Add controls panel to render:**

```typescript
// Add after the main canvas content, before </div>
<ShapeControls
  shapeId={controlsPanel.shapeId!}
  isVisible={controlsPanel.isVisible}
  position={controlsPanel.position}
  onDelete={handleDeleteShape}
  onDuplicate={handleDuplicateShape}
/>
```

### Phase 3: Add Event Handlers (30 min)

**Add to Canvas component:**

```typescript
const handleDeleteShape = async (shapeId: string) => {
  try {
    await canvasService.deleteShape(shapeId);
    setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
    showToast('Shape deleted', 'success');
  } catch (error) {
    console.error('Failed to delete shape:', error);
    showToast('Failed to delete shape', 'error');
  }
};

const handleDuplicateShape = async (shapeId: string) => {
  if (!user) return;
  
  try {
    await canvasService.duplicateShape(shapeId, user.uid);
    showToast('Shape duplicated', 'success');
  } catch (error) {
    console.error('Failed to duplicate shape:', error);
    showToast('Failed to duplicate shape', 'error');
  }
};
```

### Phase 4: Show Controls When Shape Locked (15 min)

**Modify shape click handler:**

```typescript
const handleShapeClick = (e: any, shape: Shape) => {
  // ... existing lock logic ...
  
  if (lockAcquired) {
    // Show controls panel near shape
    const stage = stageRef.current;
    const stagePos = stage.getAbsolutePosition();
    const stageScale = stage.scaleX();
    
    setControlsPanel({
      isVisible: true,
      shapeId: shape.id,
      position: {
        x: (shape.x + stagePos.x) / stageScale,
        y: (shape.y + stagePos.y) / stageScale - 50 // Above shape
      }
    });
  }
};
```

**Hide controls when shape unlocked:**

```typescript
// In unlock handler
setControlsPanel({ isVisible: false, shapeId: null, position: { x: 0, y: 0 } });
```

---

## Testing Scenarios

### Test 1: Controls Panel Visibility
- [ ] Lock a shape → controls panel appears above shape
- [ ] Unlock shape → controls panel disappears
- [ ] Lock different shape → controls panel moves to new shape

### Test 2: Delete Functionality
- [ ] Lock a rectangle → click Delete → rectangle disappears
- [ ] Lock a circle → click Delete → circle disappears  
- [ ] Lock a triangle → click Delete → triangle disappears
- [ ] **As User B:** Verify deleted shape disappears in <100ms

### Test 3: Duplicate Functionality
- [ ] Lock a rectangle → click Duplicate → second rectangle appears 20px offset
- [ ] Lock a circle → click Duplicate → second circle appears 20px offset
- [ ] Lock a triangle → click Duplicate → second triangle appears 20px offset
- [ ] **As User B:** Verify duplicated shape appears in <100ms

### Test 4: Canvas Bounds Handling
- [ ] Create shape near right edge → duplicate → new shape wraps to left side
- [ ] Create shape near bottom edge → duplicate → new shape wraps to top
- [ ] Verify no shapes created outside canvas bounds

### Test 5: Error Handling
- [ ] Try to delete non-existent shape → error toast appears
- [ ] Try to duplicate locked shape → error toast appears
- [ ] Network error during delete → error toast appears

### Test 6: Text Shape Support (After PR1)
- [ ] Create text shape → lock it → controls appear
- [ ] Delete text shape → text disappears
- [ ] Duplicate text shape → second text appears with same content
- [ ] Verify text formatting preserved in duplicate

---

## Success Criteria

**PR1.2 is complete when:**

1. ✅ Controls panel appears when shape is locked
2. ✅ Delete button removes shape from canvas
3. ✅ Duplicate button creates copy with 20px offset
4. ✅ Controls panel disappears when shape unlocked
5. ✅ All operations sync in <100ms
6. ✅ Error handling works (toast notifications)
7. ✅ Canvas bounds respected (wraps to 50,50 if needed)
8. ✅ Works with all shape types (rectangle, circle, triangle, text)
9. ✅ No TypeScript errors
10. ✅ No console errors during operations

---

## Implementation Notes

### Positioning Strategy

**Option A: Near Shape (Recommended)**
```typescript
position: {
  x: (shape.x + stagePos.x) / stageScale,
  y: (shape.y + stagePos.y) / stageScale - 50
}
```

**Option B: Fixed Corner**
```typescript
position: { x: 20, y: 20 } // Top-left corner
```

### Error Handling

Use existing `useToast` hook:
```typescript
const { showToast } = useToast();
```

### Service Method Signatures

**Delete:**
```typescript
await canvasService.deleteShape(shapeId);
```

**Duplicate:**
```typescript
await canvasService.duplicateShape(shapeId, user.uid);
```

### Dependencies

- Requires `user` from `useAuth()` hook
- Requires `showToast` from `useToast()` hook
- Requires `canvasService` import

---

## File Structure

```
app/src/components/Canvas/
├── Canvas.tsx              # Main canvas component
├── ColorToolbar.tsx        # Tool selection (already has text tool)
└── ShapeControls.tsx       # NEW: Delete/duplicate controls
```

---

## Next Steps After PR1.2

- **PR2:** Text editing (double-click to edit content)
- **PR3:** Text formatting controls (bold, italic, font size)

---

## Questions & Troubleshooting

### Q: Controls panel not appearing?

**Check:**
1. Is `controlsPanel.isVisible` true when shape locked?
2. Is position calculation correct?
3. Are there CSS z-index conflicts?

### Q: Delete not working?

**Check:**
1. Is `canvasService.deleteShape()` being called?
2. Are there Firestore permission errors?
3. Is the shape ID correct?

### Q: Duplicate creates wrong shape?

**Check:**
1. Is `canvasService.duplicateShape()` being called with correct parameters?
2. Is the original shape data being preserved?
3. Is the 20px offset calculation working?

### Q: Controls panel positioning wrong?

**Fix:** Adjust position calculation based on canvas zoom/pan state.

---

## Summary

**This PR is focused:** Add UI controls for existing service methods.

**Key Insight:** Backend is ready - we just need buttons that call the right methods.

**Time Estimate:** 1-2 hours if you follow this guide step-by-step.

**Success Looks Like:** User locks shape → controls appear → click delete/duplicate → shape deleted/duplicated → collaborator sees change instantly.

---

This PR1.2 plan gives you everything needed to implement individual shape controls using your existing service methods!