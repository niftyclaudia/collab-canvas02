# Postcard Creator — Product Requirements

**Tagline:** Draw postcards with friends, mail them IRL

**Business Model:** Freemium → $12 for 3 physical postcards

**Status:** In Development

---

## 🎯 What It Is

A collaborative MS Paint-style app (2000s aesthetic) where users create postcard artwork with friends in real-time, then pay to send physical postcards via mail. Think: nostalgic Paint meets real-world postcard service.

---

## 👤 User Flow

1. **Sign up** → Create account
2. **Draw** → Use Paint tools on blank canvas (4x6 postcard size)
3. **Collaborate** → Share link, friends edit in real-time
4. **Pay** → $20 via Stripe → get 3 postcard credits
5. **Send** → Fill recipient form (name, address) → submit order
6. **Fulfill** → Email sent to vanessa.mercado24@gmail.com with postcard PNG
7. **Mail** → Vanessa prints at Staples, mails postcard
8. **Notify** → User gets "Postcard mailed!" email with image

---

## 💰 Pricing & Limits

- **Free users:** 1 canvas, can draw + collaborate, NO export/send
- **Paid users ($20):** 3 postcard credits, can send 3 physical postcards
- **Refund policy:** Only if postcard not mailed within 7 days

---

## 📐 Technical Specs

- **Canvas:** 1200×1800 pixels (4x6 inches at 300 DPI)
- **Postcard back:** Template with "Created using You've Got Mail" + address space
- **Stripe:** Test mode first, then live
- **Email:** Firebase Email Extension (cheapest, easiest)
- **Email notifications to:** vanessa.mercado24@gmail.com
- **Address:** US only (form validation)

---

## 🎨 Design Notes

**AI Chat Interface:** Microsoft Office Assistant (Clippy) style character with speech bubble for prompts

*[Add Clippy reference image: `./images/clippy-assistant.png`]*

---

## ✅ Feature Checklist

### Infrastructure (Completed)
- [x] User authentication (signup/login)
- [x] Canvas persistence (Firestore)
- [x] Real-time collaboration
- [x] Shape tools (rectangle, circle, triangle, text)
- [x] Shape manipulation (move, resize, rotate, delete)
- [x] Color palette
- [x] Live cursors

### Paint Tools (Missing)
- [ ] Pencil tool (free-form drawing)
- [ ] Spray paint tool (clouds, textures)
- [ ] Fill bucket tool (flood fill)
- [ ] Line tool
- [ ] Stroke width selector (1px, 3px, 5px, 8px)
- [ ] Undo/Redo (Ctrl+Z/Ctrl+Y)

### Canvas Management (Missing)
- [ ] Canvas size: 1200×1800 (4x6 postcard)
- [ ] 1 canvas limit for free users
- [ ] Canvas sharing (generate shareable link)
- [ ] Canvas list/gallery view
- [ ] Canvas naming

### Payment System (Stretch Goal)
- [ ] Stripe integration ($20 payment)
- [ ] Postcard credits (3 per purchase)
- [ ] Credits display in user dashboard
- [ ] Payment success/failure handling

### Order & Fulfillment (Stretch Goal)
- [ ] "Send Postcard" button (paid users only)
- [ ] Recipient form (name, address, city, state, zip - US only)
- [ ] Sender name field
- [ ] US address validation
- [ ] Export canvas to PNG (1200×1800)
- [ ] Generate postcard back (address template + app branding)
- [ ] Email to vanessa.mercado24@gmail.com with:
  - Postcard PNG attachment
  - Recipient address
  - Sender name
  - Order ID
- [ ] Order tracking (pending/mailed status)
- [ ] "Mark as Mailed" admin action
- [ ] Email to user: "Your postcard has been sent!" with image

### AI Features (Core Requirement - Phase 2)
- [ ] Clippy-style chat UI ← **REQUIRED FOR DEMO**
- [ ] AI prompt interpretation ("draw a dog on a boat") ← **REQUIRED FOR DEMO**
- [ ] AI shape templates (house, tree, car, person)
- [ ] AI natural drawing (spray clouds, etc.)

---

## 📊 Database Schema

```typescript
// users collection (UPDATE)
{
  id: string,
  email: string,
  postcardCredits: number, // 0 for free, 3 after $12 payment
  canvasLimit: number, // 1 for free
  stripeCustomerId: string,
  createdAt: Timestamp,
}

// canvases collection (UPDATE)
{
  id: string,
  userId: string, // owner
  name: string,
  shareLink: string,
  collaborators: [userId],
  createdAt: Timestamp,
}

// orders collection (NEW)
{
  id: string,
  userId: string,
  canvasId: string,
  postcardImageUrl: string, // PNG export
  recipientName: string,
  recipientAddress: string,
  recipientCity: string,
  recipientState: string,
  recipientZip: string,
  senderName: string,
  status: 'pending' | 'mailed' | 'cancelled',
  createdAt: Timestamp,
  mailedAt: Timestamp | null,
}
```

---

## 🚀 PR Roadmap

### Phase 1: Paint Tools (MVP Drawing)
1. PR #1: Pencil tool
2. PR #2: Spray paint tool
3. PR #3: Fill bucket tool

### Phase 2: AI Features (Core Requirement) ← **FOCUS FOR SCHOOL DEMO**
4. PR #4: Clippy-style chat UI
5. PR #5: AI drawing prompts + templates

### Phase 3: Canvas Management
6. PR #6: Canvas size (1200×1800) + aspect ratio lock
7. PR #7: Stroke width selector
8. PR #8: Canvas sharing + collaboration

### Phase 4: Business Logic (Stretch Goals)
9. PR #9: Canvas limit (1 for free users)
10. PR #10: Stripe integration + credits system
11. PR #11: "Send Postcard" flow + order form
12. PR #12: Canvas export to PNG (1200×1800)
13. PR #13: Postcard back template generator
14. PR #14: Email to Vanessa (order notifications)
15. PR #15: User email notifications (confirmed, mailed)
16. PR #16: Order tracking + admin actions

---

## 🎯 School Project Requirements

**Core (Must Have for Demo):**
- All Paint tools working (pencil, spray, bucket)
- **Clippy-style AI chat interface** ← REQUIRED
- **AI drawing prompts** ("draw a dog on a boat") ← REQUIRED
- Real-time collaboration (already working)
- Canvas sharing (invite friends)
- Stroke width selector

**Stretch Goals (If Time Permits):**
- Canvas fixed to 4x6 postcard size
- Stripe payment ($20 → 3 credits)
- "Send Postcard" form (US addresses only)
- Email to Vanessa with order details
- Email to user (order confirmed, postcard mailed)
- Canvas limits for free users
- PNG export for printing
- Admin dashboard
- Advanced tools (eraser, eyedropper)

---

## ✅ Decisions Made

1. **App name:** "You've Got Mail"
2. **Postcard back design:** `collabcanvas/docs/images/postcard-back-template.png` (and .svg)
3. **Clippy character:** Original Clippy style
4. **Stripe webhook:** Use simplest approach (Stripe Checkout success URL redirect)
5. **Print quality:** 300 DPI (good quality, authentic 2000s aesthetic - not 4K)

---

## ⚠️ Risks

- **Fulfillment bottleneck:** Manual printing/mailing (you)
- **Stripe test mode:** Must switch to live before launch
- **Email deliverability:** Firebase Email Extension limits
- **US addresses only:** International demand?
- **Print shop availability:** Staples hours/location

---

**Last Updated:** 2025-10-18
