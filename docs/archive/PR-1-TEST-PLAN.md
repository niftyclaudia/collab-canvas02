# PR #1: Authentication - Test Plan

## Feature Overview
Email/password authentication with username, automatic cursor color assignment, and persisted sessions for CollabCanvas.

## User Stories
- As a new user, I want to sign up with email/password/username so I can access the collaborative canvas
- As a returning user, I want to log in with my credentials so I can continue working on the canvas
- As an authenticated user, I want my session to persist across browser refreshes so I don't have to re-login constantly
- As a user, I want to see my username and log out option so I know I'm authenticated and can exit when needed

## Setup Instructions

**Prerequisites:**
```bash
# Terminal 1 - Firebase Emulators
cd app
firebase emulators:start

# Terminal 2 - React App  
cd app
npm run dev
```

**Verify Setup:**
- Emulator UI accessible at http://localhost:4000
- React app accessible at http://localhost:5173
- Check that `.env` file exists with Firebase config

## Test Scenarios

### 📋 Happy Path Tests

#### ✅ User Signup Flow
- [ ] Navigate to http://localhost:5173
- [ ] App shows signup form (not authenticated)
- [ ] Fill signup form: email="test@example.com", password="password123", username="TestUser"
- [ ] Click "Sign Up" button
- [ ] **Expected:** Redirects to canvas/main app view
- [ ] **Expected:** Navbar shows "TestUser" and "Logout" button
- [ ] **Expected:** No console errors

#### ✅ User Login Flow  
- [ ] Have existing user in system (from signup test above)
- [ ] Log out if currently logged in
- [ ] Fill login form: email="test@example.com", password="password123"
- [ ] Click "Log In" button
- [ ] **Expected:** Redirects to canvas/main app view
- [ ] **Expected:** Navbar shows correct username "TestUser"
- [ ] **Expected:** No console errors

#### ✅ Session Persistence
- [ ] Complete login flow above
- [ ] Refresh browser (Cmd/Ctrl + R)
- [ ] **Expected:** Still logged in, shows canvas view
- [ ] **Expected:** Username still displayed in navbar
- [ ] **Expected:** No flickering or re-login prompts

#### ✅ Logout Flow
- [ ] While logged in, click "Logout" button in navbar
- [ ] **Expected:** Redirects to login/signup screen
- [ ] **Expected:** Canvas view no longer accessible
- [ ] **Expected:** Navbar shows login/signup options only

### 🔍 Edge Cases & Error Handling

#### ⚠️ Invalid Credentials
- [ ] Try login with email="wrong@example.com", password="wrongpass"
- [ ] **Expected:** Error message displayed (not just console error)
- [ ] **Expected:** Form remains visible, allows retry
- [ ] **Expected:** No navigation occurs

#### ⚠️ Weak Passwords
- [ ] Try signup with password="123"
- [ ] **Expected:** Firebase validation error shown to user
- [ ] **Expected:** Form allows correction and retry

#### ⚠️ Duplicate Email
- [ ] Sign up user with email="duplicate@example.com"
- [ ] Try signup again with same email, different username
- [ ] **Expected:** Error message about email already in use
- [ ] **Expected:** Form allows correction

#### ⚠️ Invalid Email Format
- [] Try signup with email="notanemail"
- [x] **Expected:** Email validation error
- [ ] **Expected:** Form highlights email field issue

#### ⚠️ Empty Username
- [x] Try signup with empty username field
- [ ] **Expected:** Validation prevents submission
- [ ] **Expected:** Username field highlighted/required message

### 🗄️ Data Validation Tests

#### 📊 Firestore User Document
- [ ] Complete signup flow for new user
- [ ] Open Firebase Emulator UI (http://localhost:4000)
- [ ] Navigate to Firestore tab
- [ ] Check `users/{uid}` document exists with:
  - [ ] `uid` (string, matches auth UID)
  - [ ] `username` (string, matches form input)  
  - [ ] `email` (string, matches form input)
  - [ ] `cursorColor` (string, hex color like "#ef4444")
  - [ ] `createdAt` (timestamp, recent)

#### 🎨 Color Assignment
- [ ] Sign up 3 different users
- [ ] Check each gets different `cursorColor` values
- [ ] **Expected:** Colors from palette: #ef4444, #3b82f6, #10b981, #f59e0b
- [ ] **Expected:** No duplicate colors (if <4 users)

### 🌐 Multi-User Tests

#### 👥 Concurrent Signups
- [ ] **Browser 1 (incognito):** Start signup for "User1"  
- [ ] **Browser 2 (normal):** Start signup for "User2"
- [ ] Complete both signups simultaneously
- [ ] **Expected:** Both succeed without conflicts
- [ ] **Expected:** Different cursor colors assigned
- [ ] **Expected:** Both can access canvas independently

#### 🔄 Cross-Browser Session Check
- [ ] Sign up in Browser 1, note username
- [ ] Open Browser 2, try to access canvas directly (http://localhost:5173)
- [ ] **Expected:** Browser 2 shows login screen (sessions are per-browser)
- [ ] Sign up different user in Browser 2
- [ ] **Expected:** Both browsers maintain separate auth states

### ⚡ Performance Tests

#### 🚀 Auth State Loading
- [ ] Clear browser storage, refresh app
- [ ] Measure time from page load to auth state determined
- [ ] **Expected:** <500ms for "not authenticated" determination
- [ ] **Expected:** Loading spinner shows during auth check
- [ ] **Expected:** No content flash before auth state known

#### 📱 Rapid Login/Logout
- [ ] Login → logout → login → logout (repeat 5x quickly)
- [ ] **Expected:** No stuck states or race conditions
- [ ] **Expected:** UI consistently reflects auth state
- [ ] **Expected:** No memory leaks or Firebase connection issues

### 🛡️ Security Tests

#### 🔒 Route Protection  
- [ ] While logged out, try accessing http://localhost:5173 directly
- [ ] **Expected:** Redirected to login screen, not canvas
- [ ] While logged out, try accessing any canvas routes directly
- [ ] **Expected:** Login screen shown, not protected content

#### 🕵️ User Data Isolation
- [ ] Sign up as "User1", note the data shown
- [ ] Log out, sign up as "User2"  
- [ ] **Expected:** No data from User1 visible to User2
- [ ] **Expected:** Clean slate for each user session

## Success Criteria

### ✅ Core Functionality
- [ ] Users can sign up with email/password/username
- [ ] Users can log in with existing credentials
- [ ] Users can log out and session clears completely
- [ ] Auth state persists across browser refreshes
- [ ] Route protection works (no canvas access when logged out)

### ✅ Data Requirements
- [ ] Firestore `users/{uid}` documents created on signup with all required fields
- [ ] Cursor colors assigned from predefined palette (#ef4444, #3b82f6, #10b981, #f59e0b)
- [ ] Username displayed in navbar when authenticated
- [ ] User data properly isolated between accounts

### ✅ Error Handling
- [ ] Invalid credentials show user-friendly error messages
- [ ] Form validation prevents invalid submissions
- [ ] Firebase errors translated to user-understandable messages
- [ ] No console errors during normal operation

### ✅ Performance
- [ ] Auth state determination <500ms
- [ ] Smooth transitions between auth states
- [ ] No flickering or layout shifts during auth checks
- [ ] Memory leaks avoided (no dangling Firebase listeners)

### ✅ Multi-User Support
- [ ] Multiple users can sign up concurrently without conflicts
- [ ] Different cursor colors assigned automatically
- [ ] Cross-browser isolation maintained

## Known Limitations
- No password reset functionality (post-MVP)
- No email verification (post-MVP) 
- Single cursor color per user (no customization yet)
- Basic error messages (not fully polished UX)

## Next Steps After This PR
- PR #2: Canvas Shell + Pan/Zoom + Color Toolbar
- Integration with cursor color from auth in presence system
