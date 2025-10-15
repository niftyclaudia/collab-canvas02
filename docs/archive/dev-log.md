# CollabCanvas MVP Development Log

## 📸 Project Snapshot

**Multi-user canvas with rectangles, live cursors, presence, and optimistic locking in ~24h**

### 🔗 Links
- **Live Demo:** [collab-canvas02.vercel.app](https://collab-canvas02.vercel.app)
- **Repository:** [github.com/niftyclaudia/collab-canvas02](https://github.com/niftyclaudia/collab-canvas02)

### 🛠 Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Canvas:** Konva.js
- **Backend:** Firebase (Auth, RTDB for cursors/presence, Firestore for shapes)
- **Deployment:** Vercel

---

## 🤖 How I Partnered with AI

### Strategic Approach
- **Tiny, runnable slices**: "Two users + one rect + live cursors" → AI scaffold + checklist I could run
- **Constrained prompts**: "Using architecture.md + PR-2-TEST-PLAN.md, implement locking; explain risks first"
- **PR Doc Trio**: Kept quality high with Summary (decisions/files), Quick Start (90-sec check), Test Plan (edge cases)

---

## 🚧 Bumps on the Road → Fast Fixes

### Issues Encountered & Solutions

| Issue | Problem | Solution |
|-------|---------|----------|
| **Wrong install path** | Dependencies in repo root (not app folder) → dev failed | README callout to `cd` into the app first |
| **CLI confusion** | Tried `npm firebase` (wrong) | Use `npx firebase` (or global install) → emulators stable |
| **Ghost Users** | Users logging out left their cursors visible to others | Flip the order → cleanup presence data first, then logout |

---

## 🏗 Realtime Architecture: Two Buckets Strategy

### Why it stays snappy

#### 🔄 RTDB (Ephemeral Data)
```
cursors/{canvasId}/{userId} → x, y, timestamp
presence/{canvasId}/{userId} → online, lastSeen
```

#### 💾 Firestore (Durable Data)
```
canvases/{id}
shapes/{id} → canvasId, type, color, position, size, lockedBy
```

### 🧠 Reasoning
- **High-frequency updates** → RTDB
- **Authoritative edits** → Firestore
- **Clean boundary** kept UX smooth & costs down
- **Locking mechanism**: `lockedBy` gate; UI disables handles when locked; conflicts show toast + revert

---

## ✅ Shipped in the MVP

### Core Features
- ✅ **Authentication** → canvas access
- ✅ **Presence system** with user list
- ✅ **Named cursors** (~<50ms perceived latency)
- ✅ **Rectangle creation/movement** with optimistic locking
- ✅ **Conflict handling** with user feedback
- ✅ **Live drag preview**
- ✅ **Automatic cleanup** on disconnect

### 📊 Performance Metrics
- **Concurrent users**: 5+ tested
- **Shape capacity**: 100+ shapes
- **Frame rate**: ~60 FPS with Konva

---

## 📈 Numbers That Matter

| Metric | Value |
|--------|-------|
| **Development time** | ~24 hours to MVP |
| **Lines of code** | ~2,800 LOC |
| **Git commits** | 47+ commits |
| **Pull requests** | 7 initial PRs (19+ total after polish) |
| **Major restarts** | 1 (fixed by reviewing and updating docs to explicitly include Java for Firebase) |

---

## 🚀 Next Up

### Planned Features
- **Shape operations**: Delete/resize functionality
- **New shapes**: Circles and lines
- **Advanced interactions**: Rotate handles
- **UI enhancements**: Color picker
- **History management**: Undo/redo via command log
- **AI features**: "Arrange/align/auto-theme" via constrained mutation API