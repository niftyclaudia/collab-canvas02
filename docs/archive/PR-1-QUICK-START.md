# PR #1: Authentication - Quick Start

## Prerequisites
Firebase emulators and React dev server running

## Setup
```bash
# Terminal 1
cd app && firebase emulators:start

# Terminal 2  
cd app && npm run dev
```

## Test Steps
1. Go to http://localhost:5173
2. Sign up: email="test@example.com", password="password123", username="TestUser"
3. Verify: redirects to canvas, navbar shows "TestUser" + colored dot + logout
4. Refresh browser (Cmd/Ctrl+R)
5. Verify: still logged in, no re-auth required
6. Click "Logout" button
7. Verify: back to auth screen
8. Log in with same credentials
9. Verify: canvas appears again

## Expected Result
✅ Complete auth flow working: signup → canvas → logout → login → canvas
✅ Username displayed in navbar with cursor color indicator  
✅ Session persists across refresh
✅ Clean UI with proper loading/error states

**Validation time: ~90 seconds**
