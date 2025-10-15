# CollabCanvas - Real-time Collaborative Canvas

A real-time collaborative design canvas built with React, TypeScript, Firebase, and Konva.js.

## Features

- **Real-time collaboration:** Multiple users can work simultaneously
- **Live cursors:** See other users' cursor positions and names in real-time
- **Shape creation:** Click and drag to create rectangles
- **Simple locking:** First-click wins shape locking system
- **Presence awareness:** See who's currently online
- **Pan and zoom:** Navigate a large 5000×5000 canvas

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Canvas:** Konva.js + react-konva
- **Backend:** Firebase (Auth + Firestore + Realtime Database)
- **Deployment:** Vercel

## Local Development

This project uses Firebase Emulators for local development - no Firebase costs during development!

### Prerequisites

- Node.js v18+ 
- npm v9+
- Java 11+ (for Firebase Emulators)

### Setup

```bash
# Terminal 1: Start Firebase Emulators (from app/)
cd app
npx firebase emulators:start

# Terminal 2: Start React Dev Server (from app/)
cd app  
npm run dev
```

### Access Points

- **React App:** http://localhost:5173
- **Firebase Emulator UI:** http://localhost:4000
- **Auth Emulator:** http://localhost:9099
- **Firestore Emulator:** http://localhost:8080  
- **Realtime Database Emulator:** http://localhost:9000

### Testing Multi-User

1. Open **Incognito window:** http://localhost:5173 (User A)
2. Open **Normal window:** http://localhost:5173 (User B)
3. Sign up as different users and test real-time features

### Project Structure

```
app/
├── src/
│   ├── components/     # UI components
│   ├── contexts/       # React contexts  
│   ├── hooks/          # Custom hooks
│   ├── services/       # Firebase service layer
│   ├── utils/          # Helper functions
│   └── firebase.ts     # Firebase initialization
├── firebase.json       # Emulator configuration
├── firestore.rules     # Firestore security rules
└── database.rules.json # RTDB security rules
```

## Architecture

- **Service Layer Pattern:** Clean separation between UI and Firebase
- **Hybrid Database:** RTDB for real-time data (cursors), Firestore for persistent data (shapes)
- **AI-Ready:** Service layer designed for easy AI agent integration

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Firebase Emulators

The app automatically connects to emulators in development mode. No authentication required for emulators.

**Emulator UI Features:**
- View/manage users and authentication
- Inspect Firestore collections and documents  
- Monitor Realtime Database data
- Clear data between tests

## Deployment

```bash
npm run build    # Build production bundle
vercel --prod    # Deploy to Vercel
```

**Note:** Update Firebase config with production values before deploying.

---

For full project documentation, see the parent directory's `docs/` folder.