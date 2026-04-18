# PerfectFooties — Product QA & Testing Document

**Version:** 1.0  
**Date:** April 2026  
**Project:** PerfectFooties E-Commerce Platform  
**Stack:** React + Vite · Firebase (Firestore, Auth, Storage, Functions) · MUI · Paystack · Mailtrap  

---

## Table of Contents

1. [Business Overview](#1-business-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Test Accounts & Credentials](#3-test-accounts--credentials)
4. [Feature Map](#4-feature-map)
5. [User-Facing Test Cases](#5-user-facing-test-cases)
   - 5.1 Navigation & Navbar
   - 5.2 Homepage
   - 5.3 Shop & Collections
   - 5.4 Item Detail Page
   - 5.5 Cart
   - 5.6 Checkout & Payment
   - 5.7 Thank You Page
   - 5.8 Account & Order History
   - 5.9 Custom Order
   - 5.10 Gift Cards
   - 5.11 Loyalty Points & Referrals
   - 5.12 Newsletter Subscribe
   - 5.14 Wishlist
   - 5.15 Testimonials
6. [Admin Panel Test Cases](#6-admin-panel-test-cases)
   - 6.1 Dashboard
   - 6.2 Orders Management
   - 6.3 Production Queue
   - 6.4 Customers
   - 6.5 Collections & Products
   - 6.6 Newsletter Campaigns
   - 6.7 Gift Cards (Admin)
   - 6.8 Loyalty & Referrals (Admin)
   - 6.9 Blog Posts
   - 6.10 Gallery
   - 6.11 Announcements
7. [Cloud Function & Email Test Cases](#7-cloud-function--email-test-cases)
8. [Payment Flow Test Cases](#8-payment-flow-test-cases)
9. [Security & Access Control Tests](#9-security--access-control-tests)
10. [Responsive / Mobile Tests](#10-responsive--mobile-tests)
11. [Edge Cases & Negative Tests](#11-edge-cases--negative-tests)
12. [Known Constraints & Out of Scope](#12-known-constraints--out-of-scope)
13. [Test Data Requirements](#13-test-data-requirements)
14. [Bug Reporting Template](#14-bug-reporting-template)

---

## 1. Business Overview

**PerfectFooties** is a Nigerian luxury leather-goods e-commerce brand that handcrafts bespoke shoes, bags, belts, wallets, and accessories. The platform serves three customer segments:

| Segment | Behaviour |
|---|---|
| **Retail buyers** | Browse catalog, add to cart, pay via Paystack, receive items |
| **Custom order clients** | Request bespoke pieces specifying type, colour, size, and reference photos; finalise via WhatsApp |

> **Note:** PerfectFooties is a product-only platform. There are no service offerings, appointments, or booking flows.

**Core business rules that testers must understand:**

- Production time is **10–14 days** before shipping.
- Shipping is **2–5 days** (local) or **5–10 days** (international) after production.
- Custom orders are initiated in the app and finalised over WhatsApp — no payment is taken in-app for custom orders.
- Loyalty points are earned at **15 pts per retail/product order** (status `received`).
- Every **50 pts = ₦500** discount on a future order.
- Referrers receive **50 pts** when their referral code is used; the referred customer receives a **₦500 discount**.
- Gift cards are admin-activated; one card per order at checkout.

---

## 2. Test Environment Setup

### Prerequisites

| Requirement | Detail |
|---|---|
| Browser | Chrome (latest), Firefox, Safari (for iOS sim) |
| Devices | Desktop 1440px, tablet 768px, mobile 375px |
| Test payment | Use Paystack **test mode** cards (see Section 13) |
| Email inspection | Mailtrap inbox — ask admin for credentials |
| Firebase Console | Access to `perfect-footies` project for Firestore/Storage inspection |
| Test email accounts | Two separate Gmail accounts (one admin, one regular user) |

### Environment URL

```
Production: https://perfectfooties.com
```

> All testing should begin on the live URL unless a staging environment is provisioned.

### Firebase Project

```
Project ID: perfect-footies
Region: us-central1
```

---

## 3. Test Accounts & Credentials

| Role | Account | Notes |
|---|---|---|
| Admin user | `chizobaezeh338@gmail.com` or `perfectfooties@gmail.com` | `praiseolusegun19@gmail.com` | Google sign-in; has access to `/admin` |
| Regular user A | Any Google account | For placing orders, viewing account |
| Regular user B | Second Google account | For testing referral code flow between two users |
| Mailtrap inbox | Provided by dev | Inspect all transactional emails |

---

## 4. Feature Map

The following features exist and must be tested end-to-end:

```
Public Features
├── Navigation (Navbar + Mobile Drawer)
├── Homepage (Hero, Collections, FAQ, Contact)
├── Shop / Collection Browsing
├── Item Detail (size, colour, add to cart)
├── Cart (add, remove, update quantity)
├── Checkout (shipping, discounts, Paystack payment)
├── Thank You Page (order summary, progress tracker)
├── Custom Order (form, photo upload, WhatsApp navigation)
├── Account (profile, order history with status, wishlist)
├── Order Detail Page (tracking, receipt download)
├── Gift Card Redemption (at checkout)
├── Loyalty Points Redemption (at checkout)
├── Referral Code (URL capture + checkout entry)
├── Newsletter Subscribe (footer)
├── Testimonials (submit review after delivery)
├── Blog (read posts)
├── Gallery
├── Wishlist (save/remove products)
└── Dark / Light Mode

Admin Features (/admin — admin accounts only)
├── Dashboard (metrics, charts, quick actions)
├── Orders (view all, change status, notes, email)
├── Production Queue (in-production tracking, mark shipped)
├── Customers (loyalty tiers, points, order count)
├── Collections (products CRUD)
├── Newsletter (compose, send, campaign history)
├── Gift Cards (create, activate, track)
├── Loyalty & Referrals (leaderboard, manual adjustments)
├── Blog Posts (CRUD)
├── Gallery (CRUD)
├── Announcements (CRUD, activate/deactivate)
└── Cancellation Requests

Cloud Functions
├── Paystack Webhook (auto-confirm payment)
├── Verify Paystack Deposit (manual fallback)
├── onOrderStatusChanged (email on status change)
├── onFirstOrderWelcome (welcome email)
└── sendNewsletter (batch email blast)
```

---

## 5. User-Facing Test Cases

> **Legend:** ✅ Pass · ❌ Fail · ⚠️ Partial

---

### 5.1 Navigation & Navbar

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| NAV-01 | Logo navigates home | Click logo/PF text | Redirects to `/` |
| NAV-02 | Nav links active state | Navigate to `/shop` | "Shop" link shows red underline, others do not |
| NAV-03 | Nav underline hover | Hover over any nav link | Animated red underline slides in |
| NAV-04 | Contact Us scrolls | Click "Contact Us" in nav | Smooth-scrolls to contact section on homepage; if on another page, navigates home first then scrolls |
| NAV-05 | Mobile: PF text visible | View on mobile (≤375px) | "PF" text appears beside logo in brand red cursive font |
| NAV-06 | Mobile: PerfectFooties text on desktop | View on desktop (≥900px) | Full "PerfectFooties" text shown |
| NAV-07 | Hamburger menu opens | Click hamburger on mobile | Drawer slides in from right with all nav items |
| NAV-08 | Drawer closes on link click | Click any item in drawer | Drawer closes and page navigates |
| NAV-09 | Dark mode toggle | Click moon/sun icon | Theme switches; persists on reload |
| NAV-10 | Cart icon shows count | Add item to cart | Cart icon badge shows quantity |
| NAV-11 | Admin button visible to admin | Sign in as admin | Teal "Admin" pill button appears in desktop nav |
| NAV-12 | Admin button hidden from regular users | Sign in as regular user | No admin button |
| NAV-13 | User menu shows when signed in | Sign in with Google | Avatar/initials appear; click shows profile menu |
| NAV-14 | Navbar becomes opaque on scroll | Scroll page down 50px+ | Navbar background fills in with brand cream/dark colour |
| NAV-15 | Navbar transparent at top | At page top | Navbar is transparent |

---

### 5.2 Homepage

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| HOME-01 | Hero section renders | Load `/` | Full-width hero image with headline, sub-text, and CTA buttons |
| HOME-02 | Shop Now CTA navigates | Click "Shop Now" hero button | Navigates to `/shop` |
| HOME-03 | Collection cards display | Scroll to collections | Cards show image, collection name, short description |
| HOME-04 | Card hover — red glow | Hover over a collection card | Warm red shadow appears; border turns red; "Explore" link turns red |
| HOME-05 | Collection card navigates | Click a collection card | Navigates to the correct `/shop/:collectionId` |
| HOME-06 | FAQ section renders | Scroll to FAQ | Questions listed; click expands answer; click again collapses |
| HOME-07 | Contact section renders | Scroll to bottom | Name, email, message form; phone number; map or location info |
| HOME-08 | Announcement banner | If admin has published active announcement | Banner visible at top of page |
| HOME-09 | Newsletter subscribe (footer) | Enter email in footer subscribe field, submit | Success message shown; email saved to Firestore `subscribers` |
| HOME-10 | Section underlines are red | View any section heading | Underline decoration is brand red, not cyan |

---

### 5.3 Shop & Collections

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| SHOP-01 | Shop page loads all collections | Navigate to `/shop` | All categories are displayed as browsable cards |
| SHOP-02 | Collection page loads products | Click into a collection | Products listed with name, price, image |
| SHOP-03 | Filter by type (if applicable) | Use any filter UI | Products narrow to matching type |
| SHOP-04 | Out-of-stock products | View product with stock = 0 | Item shows "Out of Stock" and cannot be added to cart |
| SHOP-05 | Low stock indicator | Product with stock ≤ 5 | Shows "Only X left" badge |
| SHOP-06 | Wishlist from collection | Click heart on product card | Item added to wishlist; heart turns filled |
| SHOP-07 | Niche collections visible | Navigate to niche/limited-edition section | Shows special collection items with countdown or status |

---

### 5.4 Item Detail Page

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| ITEM-01 | Product images display | Open item detail | Main image shown; thumbnail gallery if multiple |
| ITEM-02 | Size selection | Click a size | Size is selected/highlighted |
| ITEM-03 | Colour selection | Click a colour swatch | Colour selected; image updates if applicable |
| ITEM-04 | Add to cart | Select size/colour, click "Add to Cart" | Item added; cart count increments; toast/snackbar confirms |
| ITEM-05 | Add without size (footwear) | Click "Add to Cart" without selecting size | Error shown: "Please select a size" |
| ITEM-06 | Made-to-order note | View leather product detail | Shows "Made to order — 10–14 days production + 2–5 days shipping" note in red-tinted box |
| ITEM-07 | Wishlist from detail | Click heart icon on detail page | Added to wishlist |
| ITEM-08 | Quantity selector | Increment/decrement | Quantity changes; cannot go below 1 |
| ITEM-09 | Back navigation | Click back | Returns to collection page |

---

### 5.5 Cart

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| CART-01 | Items persist in cart | Add items, navigate away, return | Cart items still present |
| CART-02 | Remove item | Click remove/trash icon | Item removed; total recalculates |
| CART-03 | Update quantity | Change quantity in cart | Subtotal updates accordingly |
| CART-04 | Empty cart state | Remove all items | "Your cart is empty" message with Shop CTA |
| CART-05 | Cart total calculation | Add multiple items | Total = sum of (price × quantity) |
| CART-06 | Navigate to checkout | Click "Proceed to Checkout" | Navigates to `/checkout` |
| CART-07 | Cart count in navbar | Add 3 items | Badge shows "3" |

---

### 5.6 Checkout & Payment

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| CHK-01 | Checkout requires sign-in | Visit `/checkout` without auth | Prompt to sign in or guest checkout flow shown |
| CHK-02 | Shipping form required fields | Submit without filling name/address | Validation errors shown per field |
| CHK-03 | International shipping fields | Select non-Nigeria country | Province and postal code fields appear |
| CHK-04 | Order summary visible | Load checkout page | Itemised list of cart items with prices shown |
| CHK-05 | Shipping cost applied | Enter address | Shipping fee added to total |
| CHK-06 | Production note on checkout | Leather/custom item in cart | Dispatch estimate shows "Production: 10–14 days + shipping: 2–5 days (local)" |
| CHK-07 | Gift card redemption | Enter valid active gift card code | Discount applied; balance deducted shown |
| CHK-08 | Invalid gift card rejected | Enter invalid/expired code | Error: "Gift card not found" or "Card already redeemed" |
| CHK-09 | Loyalty points redemption | Sign in with user who has ≥50 pts; tick "Use points" | ₦500 off per 50 pts deducted from total |
| CHK-11 | Referral code from URL | Visit `/?ref=CODE`; go to checkout | Code pre-populated; ₦500 discount shown |
| CHK-12 | Manual referral code entry | Type a referral code at checkout | Validates against Firestore; discount applied |
| CHK-13 | Invalid referral code rejected | Enter random code | Error: "Referral code not found" |
| CHK-14 | Paystack modal opens | Click "Pay Now" | Paystack payment modal appears with correct amount |
| CHK-15 | Successful payment flow | Complete Paystack test payment | Order confirmed; redirected to `/thank-you`; email received in Mailtrap |
| CHK-16 | Order saved to Firestore | After successful payment | Order appears in `users/{uid}/orders/` with status `confirmed` |
| CHK-17 | Stock decremented | Complete purchase of item with stock | Stock count on product decremented by quantity |
| CHK-18 | Payment failure handling | Use a declined test card | Error shown; order remains `pending`; user stays on checkout |

---

### 5.7 Thank You Page

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| TY-01 | Page loads after payment | Complete checkout | `/thank-you` loads with order summary |
| TY-02 | Order reference number shown | View thank you page | Order ID (Firestore doc ID) displayed |
| TY-03 | Red branding throughout | View page | All accent elements (checkmark, progress dots, CTA button) are brand red `#e3242b` — no cyan |
| TY-04 | CheckCircle icon is red | View hero section | CheckCircle icon is red, not teal |
| TY-05 | Progress tracker steps | View order progress section | Steps show: Placed → Confirmed → Production → Shipped → Delivered |
| TY-06 | Production time text | View progress/info section | Shows "10–14 days production + 2–5 days shipping depending on location" |
| TY-07 | WhatsApp card shown | View page | WhatsApp contact card with green border shown (NOT cyan) |
| TY-08 | Continue Shopping button | Click "Continue Shopping" | Navigates to `/shop` |
| TY-09 | Email receipt button | Click "Email Receipt" | Triggers receipt email to customer |
| TY-10 | Download receipt | Click "Download Receipt" | PDF/printable receipt downloads |
| TY-11 | Savings banner (if discount applied) | Checkout with discount | Gold savings banner shows total saved |

---

### 5.8 Account & Order History

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| ACC-01 | Account page requires auth | Visit `/account` without sign-in | Redirect to login or sign-in prompt |
| ACC-02 | Profile tab shows user info | Sign in; visit `/account` | Display name, email, profile photo shown |
| ACC-03 | Loyalty tier displayed | View profile | Shows tier: Fresh / Star Client / Master Patron + points balance |
| ACC-04 | Referral code shown | View profile after first order | Unique referral code displayed with copy/share button |
| ACC-05 | Orders tab shows orders | Click Orders tab | All past orders listed with status chip |
| ACC-06 | Order status colour coding | View orders | Pending = orange, Confirmed = blue, Production = purple, Shipped = teal, Delivered = green |
| ACC-07 | View Order Details | Click "View Details" on order card | Navigates to `/account/orders/:orderId` with full detail |
| ACC-08 | Order detail page: items listed | Open order detail | Itemised products, prices, quantities shown |
| ACC-09 | Order detail page: shipping address | Open order detail | Shipping address shown if applicable |
| ACC-10 | Print shipping label | Click "Print Shipping Label" | Printable shipping label opens/downloads with brand styling |
| ACC-11 | Download receipt from detail | Click receipt button | PDF receipt downloads with brand colours |
| ACC-12 | Cancel order option | View pending order | "Request Cancellation" button visible; submits `cancellationRequests` doc |
| ACC-13 | Wishlist tab shows saved items | Add items to wishlist; view Wishlist tab | All wished items listed with image and price |
| ACC-14 | Add to cart from wishlist | Click "Add to Cart" in wishlist | Item added to cart |
| ACC-15 | Remove from wishlist | Click remove in wishlist | Item removed; list updates |
| ACC-16 | Review order after delivery | Status = `received`; click "Leave Review" | Review form appears; submit saves to `testimonials` |
| ACC-17 | Review not available before delivery | Order status = `confirmed` | No review option shown for that order |

---

### 5.9 Custom Order

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| CO-01 | Page accessible | Navigate to `/custom-order` | Form page loads with hero banner |
| CO-02 | Contact fields pre-fill | Sign in before visiting | Name and email auto-filled from Google account |
| CO-03 | Product type required | Submit without type | Error: "Please select a product type" |
| CO-04 | Colour swatch selection | Click preset colour circle | Colour text and hex value update; swatch shows red border |
| CO-05 | Custom colour picker | Click the colour picker input | Colour picker opens; selecting a colour updates hex and text |
| CO-06 | Colour text field | Type "Forest Green" | Hex value attempts to auto-resolve to matching colour |
| CO-07 | EU size field — footwear only | Select "Footwear" type | EU size dropdown appears |
| CO-08 | EU size required for footwear | Select Footwear, submit without size | Error: "Please select your shoe size" |
| CO-09 | EU size hidden for non-footwear | Select "Bag" type | EU size dropdown is NOT shown |
| CO-10 | Notes character limit | Type 500+ characters | Input capped at 500; counter shows "500/500" |
| CO-11 | Photo upload — click | Click drop zone | File picker opens |
| CO-12 | Photo upload — drag & drop | Drag image file onto drop zone | Image accepted; thumbnail preview shown |
| CO-13 | Photo preview thumbnails | Upload 2 photos | Two 80×80 thumbnails shown with remove button |
| CO-14 | Remove photo | Click ✕ on thumbnail | Photo removed; slot freed |
| CO-15 | Max 5 photos enforced | Upload 5 photos | Drop zone disappears; no more uploads accepted |
| CO-16 | Non-image rejected | Drop a PDF or .docx | Not accepted |
| CO-17 | WhatsApp opens on submit | Fill valid form; submit | Browser opens WhatsApp to PerfectFooties number with prefilled message |
| CO-18 | WhatsApp message includes order ref | Signed-in user submits | Message includes "Order Ref: {orderId}" |
| CO-19 | WhatsApp message includes photo URLs | Upload photos; submit | Photo URLs listed in WhatsApp message |
| CO-20 | Order saved to Firestore | Signed-in user submits | Order appears in `users/{uid}/orders/` with `type: 'custom'`, `status: 'pending'` |
| CO-21 | Order visible in admin queue | Submit custom order; check admin → Orders | Order appears with type "custom" |
| CO-22 | Success state shown | Successful submission | Green checkmark page with order reference number |
| CO-23 | Info box is red, not cyan | View form | Info note box has red tint background/border |
| CO-24 | Loading state during submit | Click submit | Button shows spinner and "Saving & Opening WhatsApp…" |
| CO-25 | Unauthenticated: no Firestore save | Submit without sign-in | WhatsApp still opens; no order in Firestore (no error shown) |

---

### 5.10 Gift Cards

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| GC-01 | Gift card info page | Navigate to `/gift-cards` | Page explains gift card programme |
| GC-02 | Apply gift card at checkout | Enter valid active code | Balance applied as discount; remaining balance shown |
| GC-03 | Partially used card | Use card partially | Balance reduced correctly; status becomes `partially_used` |
| GC-04 | Fully redeemed card | Use remaining balance | Status becomes `fully_redeemed`; card rejected on future use |
| GC-05 | Expired card rejected | Enter expired card code | Error: card expired |
| GC-06 | Invalid code rejected | Enter random string | Error: card not found |
| GC-07 | Only one card per order | Apply card; try adding second | Second card rejected |

---

### 5.11 Loyalty Points & Referrals

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| LOY-01 | Points earned after delivery | Order status set to `received` | `loyaltyPoints` increases by 15 on user doc |
| LOY-02 | Points shown in account | View `/account` | Loyalty points balance and tier displayed |
| LOY-03 | Redeem points at checkout | Have ≥50 pts; use at checkout | ₦500 deducted per 50 pts; pts deducted from balance |
| LOY-04 | Cannot redeem more than balance | Try to redeem 100 pts with only 50 | Capped at available balance |
| LOY-05 | Referral code generated | Complete first order | Referral code appears on account profile |
| LOY-06 | Referral URL capture | Visit `/?ref=CODE` | Code stored in sessionStorage |
| LOY-07 | Referral discount at checkout | Arrive via referral URL; checkout | ₦500 discount applied; prompt shows referral code |
| LOY-08 | Referrer gets points | Referred user completes order | Referrer's Firestore `loyaltyPoints` increases by 50 |
| LOY-09 | Referral code usage tracked | Apply referral code | `referralUses` document created; `totalUses` on code increments |
| LOY-10 | Tier: Fresh (0 orders) | New user | Tier shown as "Fresh" |
| LOY-11 | Tier: Star Client (2+ orders) | User with 2 completed orders | Tier shown as "Star Client"; 5% discount referenced |
| LOY-12 | Tier: Master Patron (4+ orders) | User with 4+ completed orders | Tier shown as "Master Patron"; 10% discount + free engraving |

---

### 5.12 Newsletter Subscribe

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| NS-01 | Subscribe with valid email | Enter email in footer; submit | Success message: "You're subscribed!" |
| NS-02 | Email saved to Firestore | Subscribe; check Firebase console | Doc in `subscribers` collection with email and `subscribedAt` timestamp |
| NS-03 | Invalid email rejected | Enter "notanemail"; submit | Validation error shown |
| NS-04 | Duplicate email | Subscribe with same email twice | Either silently accepted or "Already subscribed" message (no crash) |
| NS-05 | Empty field rejected | Click subscribe with no email | Required field error |

---

### 5.14 Wishlist

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| WL-01 | Add to wishlist | Click heart on product card | Heart fills; item saved |
| WL-02 | Wishlist persists | Add item; close browser; reopen | Item still in wishlist (localStorage) |
| WL-03 | Remove from wishlist | Click filled heart | Item removed; heart unfills |
| WL-04 | Wishlist icon in navbar | Have items in wishlist | Wishlist count badge visible |
| WL-05 | Wishlist in account | Visit Account → Wishlist tab | All wishlisted items shown |

---

### 5.15 Testimonials

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| TEST-01 | Testimonials page loads | Navigate to `/testimonials` | All published testimonials displayed with star ratings |
| TEST-02 | Submit review | Order status = `received`; go to account; click review | Review form shown |
| TEST-03 | Star rating required | Submit review without rating | Error shown |
| TEST-04 | Text required | Submit with only a rating | Error: review text required |
| TEST-05 | Optional photo upload | Attach photo to review | Photo uploaded to Storage; shown in testimonial |
| TEST-06 | Review submitted | Complete form; submit | Success message; testimonial saved to Firestore |
| TEST-07 | Cannot review twice | Already reviewed an order | Review option no longer shown for that order |

---

## 6. Admin Panel Test Cases

> Access: Sign in with an admin Google account, navigate to `/admin`.

---

### 6.1 Dashboard

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| DASH-01 | Dashboard loads | Navigate to `/admin` | Dashboard section shown by default |
| DASH-02 | Total orders stat | View stat cards | Shows correct count of all orders |
| DASH-03 | Revenue stat | View stat cards | Shows sum of confirmed/received/completed order totals |
| DASH-04 | Pending orders stat | View stat cards | Shows count of orders with `status: 'pending'` |
| DASH-05 | Production queue stat | View stat cards | Shows count of orders with `status: 'production'` — NOT low stock count |
| DASH-06 | Customer count | View stat cards | Shows count of documents in `users` collection |
| DASH-07 | Daily orders chart | View charts | Bar chart shows orders per day for last 7 days |
| DASH-08 | Revenue chart | View charts | Line/bar chart shows revenue trend |
| DASH-09 | Recent orders list | View right panel | Last 3 orders shown with status chip |
| DASH-10 | Quick action buttons | Click "Production Queue" button | Navigates to production tracker section |
| DASH-11 | Low stock banner | Product with stock ≤ 2 | Warning banner appears listing low-stock products |

---

### 6.2 Orders Management

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| ORD-01 | All orders listed | Open Orders section | All orders from all users shown, newest first |
| ORD-02 | Filter by status | Select a status filter | List narrows to matching status only |
| ORD-03 | Filter by type | Select type filter | Shows only orders of that type (leather, retail, custom, etc.) |
| ORD-04 | Search by name/email | Type customer name | Matching orders surface |
| ORD-05 | Expand order row | Click chevron/expand icon | Expanded row shows: email, phone, items, notes, shipping address, photos (custom orders), discount details |
| ORD-06 | Custom order: phone is WhatsApp link | Expand custom order row | Phone number is green underlined; clicking opens WhatsApp with prefilled specialist message |
| ORD-07 | Custom order: email is mailto link | Expand custom order row | Email is red underlined; clicking opens email client with prefilled subject + body |
| ORD-08 | Custom order: reference photos shown | Expand custom order row with photos | Photo thumbnails shown; clicking opens full image in new tab |
| ORD-09 | Change order status | Use status dropdown on order row | Status updates in Firestore; status history logged |
| ORD-10 | Status → confirmed triggers email | Change status to `confirmed` | Customer receives order confirmation email in Mailtrap |
| ORD-11 | Status → production triggers email | Change status to `production` | Customer receives "In Production" email |
| ORD-12 | Status → shipped triggers email | Change status to `shipped` | Customer receives "Shipped" email (with tracking link if set) |
| ORD-13 | Status → received triggers email | Change status to `received` | Customer receives "Delivered" email |
| ORD-14 | Add admin note | Click notes icon; type note | Note saved with timestamp; visible in expanded row |
| ORD-15 | Send confirmation email manually | Click email icon on order | Confirmation email sent; success toast shown |
| ORD-16 | Delete order | Click delete; confirm | Order removed from Firestore |
| ORD-17 | Export to CSV | Click export button | CSV downloads with all visible orders |
| ORD-18 | Create admin order | Click "Add Order" | Form appears; fill details; order saved to `users/admin-legacy/orders/` |
| ORD-19 | Extra charge | Add extra charge to an order | Extra charge amount + reason saved; shown in expanded row |
| ORD-21 | Tracking link | Add tracking link to shipped order | Tracking link saved; customer email includes "Track My Package" link |

---

### 6.3 Production Queue

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| PROD-01 | Section loads | Navigate to Production Queue | Page shows spinner then loads orders |
| PROD-02 | Shows confirmed orders | Order has status `confirmed` | Order card visible in queue |
| PROD-03 | Shows production orders | Order has status `production` | Order card visible with "In Production" chip |
| PROD-04 | Does NOT show pending/shipped orders | Orders with other statuses | NOT shown in production queue |
| PROD-05 | Urgency: On Track | Order < 12 days old | Green "On Track" chip |
| PROD-06 | Urgency: Due Soon | Order within 2 days of 14-day window | Orange "Due Soon" chip |
| PROD-07 | Urgency: Overdue | Order older than 14 days | Red "Overdue" chip with warning icon |
| PROD-08 | Progress bar | View order card | Blue/green/red bar shows % of 14-day production window used |
| PROD-09 | Sort order | Multiple orders with different urgency | Overdue first, then Due Soon, then On Track |
| PROD-10 | Mark Shipped | Click "Mark Shipped" button | Order status updated to `shipped`; card removed from queue; email sent to customer |
| PROD-11 | Queue refreshes | After marking shipped | Queue reloads and shipped order is gone |
| PROD-12 | Empty state | No confirmed/production orders | "Queue is clear!" message with green check icon |

---

### 6.4 Customers

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| CUS-01 | Customer list loads | Open Customers section | All users listed |
| CUS-02 | Loyalty points shown | View customer row | Points balance, earned, redeemed visible |
| CUS-03 | Tier shown | View customer row | Fresh / Star Client / Master Patron label |
| CUS-04 | Order count shown | View customer row | Number of orders placed |
| CUS-05 | Search customer | Type name or email | Matching customers shown |

---

### 6.5 Collections & Products

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| COL-01 | Collections load | Open Collections section | All categories listed with products |
| COL-02 | Add product | Click "+ Add Product" in a category | Product form dialog opens |
| COL-03 | Required fields validated | Submit empty product form | Validation errors shown |
| COL-04 | Image upload | Upload product image | Image saved to Firebase Storage; URL saved to product |
| COL-05 | Edit product | Click edit on existing product | Pre-filled form; save updates Firestore |
| COL-06 | Delete product | Click delete; confirm | Product removed from category's products array |
| COL-07 | Stock management | Set stock value | Stock saved; item shows "Out of Stock" at 0 on storefront |
| COL-08 | Create category | Click "+ New Category" | Category added to Firestore |
| COL-09 | Delete category | Delete with no products | Category removed |

---

### 6.6 Newsletter Campaigns

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| NL-01 | Newsletter section loads | Open Newsletter section | Two tabs: Subscribers and Campaigns |
| NL-02 | Subscribers tab | Click Subscribers tab | Table of all subscriber emails with dates |
| NL-03 | Search subscribers | Type email fragment | Filtered list shown |
| NL-04 | Delete subscriber | Click delete on row | Subscriber removed from Firestore |
| NL-05 | Copy all emails | Click "Copy All" | All visible emails copied to clipboard |
| NL-06 | Compose new campaign | Click "+ New Campaign" | Dialog opens with split-panel (form left, preview right) |
| NL-07 | Subject required | Submit without subject | Error: "Subject is required" |
| NL-08 | Headline required | Submit without headline | Error: "Headline is required" |
| NL-09 | Body required | Submit without body | Error: "Body text is required" |
| NL-10 | Live preview updates | Type in any field | Right-panel preview updates in real time |
| NL-11 | Preview: logo in header | View email preview | Dark header with PerfectFooties logo visible |
| NL-12 | Preview: red accent bar | View email preview | Red bar below header |
| NL-13 | Image upload — file | Switch to Upload tab; drag/drop image | Progress bar; image appears in preview |
| NL-14 | Image upload — URL | Switch to URL tab; paste image URL | Image appears in preview |
| NL-15 | CTA button optional | Leave CTA fields blank | Preview shows no button |
| NL-16 | CTA button with text + URL | Fill CTA fields | Red button shown in preview |
| NL-17 | Save as Draft | Click "Save Draft" | Campaign saved to Firestore with `status: 'draft'`; dialog closes |
| NL-18 | Draft appears in Campaigns tab | After saving draft | Row in campaign table with "Draft" status chip |
| NL-19 | Edit draft | Click edit icon on draft | Compose dialog reopens with existing values |
| NL-20 | Send Now | Click "Save & Send" | Confirmation prompt; on confirm: emails sent to all subscribers |
| NL-21 | Sent count shown | After send completes | Campaign row shows sent count and "Sent" status chip |
| NL-22 | Email received | Check Mailtrap for each subscriber | Emails arrive with correct content, logo, red bar, CTA |
| NL-23 | Cannot resend sent campaign | Click send on "Sent" campaign | Error or "Already sent" — button disabled |
| NL-24 | Delete campaign | Click delete icon | Campaign removed from Firestore |
| NL-25 | Image thumbnail in table | Campaign with image | Thumbnail shown in campaign table row |

---

### 6.7 Gift Cards (Admin)

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| GCA-01 | Gift cards list loads | Open Gift Cards section | All gift cards shown with status and balance |
| GCA-02 | Create gift card | Click "+ Create Card" | Card generated with 8-character code; status `pending` |
| GCA-03 | Activate card | Click "Activate" on pending card | Status → `active`; expiry date set 1 year from now |
| GCA-04 | View transactions | Expand gift card row | Shows list of redemption transactions with amounts and order IDs |
| GCA-05 | Export gift card data | Click export | CSV/data export downloads |

---

### 6.8 Loyalty & Referrals (Admin)

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| LAR-01 | Referral leaderboard | Open Loyalty section | List of referral codes ranked by total uses |
| LAR-02 | Manual point adjustment | Select user; enter delta and reason | `loyaltyAdjustments` doc created; user's `loyaltyPoints` updated |
| LAR-03 | Negative adjustment | Enter a negative delta | Points reduced; cannot go below 0 |
| LAR-04 | Adjustment logged | After adjustment | Adjustment visible in adjustment history with before/after balance |
| LAR-05 | All users loyalty list | View all users | Points, tier, earned, redeemed shown per user |

---

### 6.9 Blog Posts

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| BLOG-01 | Blog post list | Open Blog Posts section | All posts listed |
| BLOG-02 | Create post | Click "+ New Post"; fill all fields | Post saved to Firestore with auto-generated slug |
| BLOG-03 | Edit post | Click edit | Pre-filled form; save updates doc |
| BLOG-04 | Delete post | Click delete; confirm | Post removed |
| BLOG-05 | Post appears on /blog | Publish post | Visible at `/blog` with correct content |

---

### 6.10 Gallery

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| GAL-01 | Gallery images list | Open Gallery section | All gallery images shown |
| GAL-02 | Upload image | Click upload; select file | Image saved to Storage; URL in Firestore |
| GAL-03 | Add caption | Fill caption field | Caption saved and displayed on gallery page |
| GAL-04 | Delete image | Click delete; confirm | Image removed from Firestore (and ideally Storage) |
| GAL-05 | Reorder images | Drag or set order number | Order field updates; gallery page reflects new order |

---

### 6.11 Announcements

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| ANN-01 | Create announcement | Fill title, message, CTA | Announcement saved |
| ANN-02 | Activate announcement | Toggle active = true | Banner appears on homepage |
| ANN-03 | Deactivate announcement | Toggle active = false | Banner removed from homepage |
| ANN-04 | Expiry date | Set expiry in past | Announcement no longer shown even if active |
| ANN-05 | CTA link | Set ctaUrl | Banner has clickable CTA button |

---

## 7. Cloud Function & Email Test Cases

> Inspect emails at: Mailtrap inbox.

| ID | Test Case | Trigger | Expected Email |
|---|---|---|---|
| EML-01 | Confirmation email via webhook | Complete Paystack payment | Subject: "Order Confirmed"; includes items, total, order ID; PerfectFooties logo in header |
| EML-02 | Confirmation email via admin | Admin clicks email icon on order | Same confirmation template sent manually |
| EML-03 | Production email | Admin sets status → `production` | Subject: "Your Order is Being Crafted"; includes order ID and item name |
| EML-04 | Shipped email | Admin sets status → `shipped` or `shipping` | Subject: "Your Order is On Its Way"; includes tracking link if present |
| EML-05 | Shipped email with tracking | Admin adds tracking link before shipping | Email shows "Track My Package" button |
| EML-06 | Delivered email | Admin sets status → `received` or `delivered` | Subject: "Your Order Has Arrived!"; full itemised receipt included |
| EML-07 | Welcome email | First ever order confirmed | One-time welcome email sent (does NOT repeat on subsequent orders) |
| EML-08 | Newsletter batch send | Admin sends newsletter from campaign | All subscribers receive branded email with correct headline, body, image, CTA |
| EML-09 | Logo in all emails | Open any email | PerfectFooties logo (72px circular) visible in dark gradient header |
| EML-10 | Production timeframe in emails | Open confirmation email | Shows "10–14 days production + 2–5 days shipping" — NOT "5–10 business days" |
| EML-11 | No email without address | Order with no email field | Email function exits gracefully; no crash in logs |
| EML-12 | Webhook signature validation | Send request to webhook URL without valid signature | Returns 401; no order update |

---

## 8. Payment Flow Test Cases

> Use Paystack test cards. Test mode dashboard: https://dashboard.paystack.com/#/test

### Paystack Test Cards

| Card Number | CVV | Expiry | Result |
|---|---|---|---|
| 4084 0840 8408 4081 | 408 | Any future | Success |
| 4084 0840 8408 4081 | 408 | Any future | Success (PIN: 0000) |
| 5531 8866 5214 2950 | 564 | Any future | Success |
| 4084 0840 8408 4081 | Any | Any past | Declined |

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| PAY-01 | Full payment for retail order | Add retail product; checkout; pay | Paystack modal shows full total; on success → order confirmed |
| PAY-02 | Webhook confirms order | Pay via test card | Within ~30 seconds: order in Firestore updates to `confirmed`, `depositVerified: true` |
| PAY-04 | Manual verify fallback | Webhook missed; click "Verify Payment" | `verifyPaystackDeposit` callable checks Paystack API; updates order if paid |
| PAY-05 | Amount mismatch rejected | Tampered amount in request | `verifyPaystackDeposit` rejects if paid amount < expected |
| PAY-06 | Duplicate webhook ignored | Webhook fires twice for same reference | Second call sees `depositVerified: true` and skips; no double email |
| PAY-07 | Declined payment | Use declined test card | Error message shown in Paystack modal; order stays `pending` |
| PAY-08 | Order with discount paid | Apply gift card / loyalty / referral; pay | Discounted total charged via Paystack; Firestore records discount amounts |

---

## 9. Security & Access Control Tests

| ID | Test Case | Expected Result |
|---|---|---|
| SEC-01 | Regular user cannot access `/admin` | Sign in as regular user; visit `/admin` | Redirected away; admin UI not shown |
| SEC-02 | Unauthenticated cannot read orders | Direct Firestore SDK call without auth | Permission denied |
| SEC-03 | User cannot read another user's orders | User A tries to read User B's orders path | Permission denied |
| SEC-04 | User can read own orders | Authenticated user reads own orders | Success |
| SEC-05 | Admin can read all orders via collection group | Admin queries collection group | Returns all orders across all users |
| SEC-06 | Non-admin cannot send newsletter | Regular user calls `sendNewsletter` callable | `permission-denied` error |
| SEC-07 | Unauthenticated newsletter send blocked | Call `sendNewsletter` without auth | `unauthenticated` error |
| SEC-08 | Newsletter collection: admin read only | Regular user reads `newsletters` | Permission denied |
| SEC-09 | Subscribers: anyone can create | POST subscriber without auth | Allowed (public subscribe) |
| SEC-10 | Subscribers: only admin can delete | Regular user tries to delete subscriber | Permission denied |
| SEC-11 | Storage: custom-orders only auth users | Unauthenticated upload to custom-orders/ | Permission denied |
| SEC-12 | Storage: product images admin only | Regular user tries to upload to products/ | Permission denied |
| SEC-13 | Gift cards: admin write only | Regular user tries to create gift card | Permission denied |
| SEC-14 | Order status validation | Try to set order status to `invalid-status` | Rejected by `validateOrderStatus()` |
| SEC-15 | Paystack webhook signature | POST to webhook without x-paystack-signature | 401 response |

---

## 10. Responsive / Mobile Tests

> Test on actual devices or Chrome DevTools at the sizes below.

| Breakpoint | Width | Test Focus |
|---|---|---|
| Mobile S | 320px | No horizontal overflow; text readable |
| Mobile M | 375px | Standard iPhone; all interactions reachable |
| Mobile L | 425px | Larger phones |
| Tablet | 768px | Two-column layouts where applicable |
| Desktop | 1440px | Full navigation, side panels |

| ID | Test Case | Expected Result |
|---|---|---|
| RES-01 | Navbar on mobile | Hamburger menu visible; no nav links shown; PF text beside logo | 
| RES-02 | Mobile drawer | All nav items accessible in drawer; close button works |
| RES-03 | Cart page on mobile | Items stack vertically; remove button accessible |
| RES-04 | Checkout form on mobile | All inputs reachable; no clipping |
| RES-05 | Admin panel on mobile | Sidebar collapses; content scrollable |
| RES-06 | Newsletter compose on mobile | Edit/Preview tabs shown instead of split panel |
| RES-07 | Custom order form on mobile | Photo grid wraps; drop zone visible |
| RES-08 | Thank you page on mobile | Progress tracker readable; buttons full width |
| RES-09 | Product detail on mobile | Image gallery scrollable; add to cart button fixed or visible |
| RES-10 | Bottom mobile nav | Fixed bottom nav bar visible on mobile with key icons |

---

## 11. Edge Cases & Negative Tests

| ID | Scenario | Expected Behaviour |
|---|---|---|
| EDGE-01 | Order with 0 items | Should not be possible; checkout disabled if cart empty |
| EDGE-02 | User has no email address | Emails skipped gracefully; function logs warning but no crash |
| EDGE-03 | Network offline during payment | Paystack handles; order stays pending; user can retry |
| EDGE-04 | Admin deletes order mid-production | Order disappears from queue on next load |
| EDGE-05 | Two users place last-in-stock item simultaneously | First Paystack confirmation wins; second gets error or partial fulfilment |
| EDGE-06 | Gift card with £0 balance | Rejected: "Card fully redeemed" |
| EDGE-07 | Loyalty redemption exceeds order total | Cannot redeem more than the order value |
| EDGE-08 | Referral code used by code owner | Should either be rejected or simply not apply (self-referral blocked) |
| EDGE-09 | Newsletter to 0 subscribers | Function returns `{ success: true, sentCount: 0 }` gracefully |
| EDGE-10 | Custom order without sign-in | No Firestore save; WhatsApp still opens; no crash |
| EDGE-11 | Upload non-image to custom order | File rejected; error shown |
| EDGE-12 | Upload 6th photo | Slot capped at 5; no more uploads accepted |
| EDGE-13 | Very long customer name (200+ chars) | `sanitizeString` trims at 200 chars |
| EDGE-14 | SQL-like characters in fields | Sanitized; not injectable (Firestore is NoSQL but XSS possible) |
| EDGE-15 | Open WhatsApp link on desktop | Opens WhatsApp Web |
| EDGE-16 | Order placed then cancelled by user | `cancellationRequests` doc created; order NOT auto-deleted |
| EDGE-17 | Admin marks production order as shipped without tracking link | Email sent without tracking button; no crash |
| EDGE-18 | Paystack webhook fires before order saved | Rare race condition; webhook finds no order; returns 200 OK silently |
| EDGE-19 | Dark mode + admin panel | Admin panel respects theme; all text readable |
| EDGE-20 | Rapid double-click on "Add to Cart" | Item not added twice (debounce or one-at-a-time write) |

---

## 12. Known Constraints & Out of Scope

| Item | Notes |
|---|---|
| **International shipping rates** | Currently not dynamically calculated; flat estimates shown |
| **Apple Pay / Google Pay** | Not implemented; Paystack card only |
| **Order search by reference ID** | Not available on customer-facing account page |
| **Push notifications** | Notification bell exists; deep integration may vary |
| **SMS notifications** | Not implemented |
| **Inventory sync across sessions** | Stock decremented on Paystack confirmation; concurrent stock race is a known risk |
| **Blog comments** | Not implemented |
| **Multi-currency** | NGN only |
| **Pagination** | Large order lists loaded without pagination (may slow at scale) |
| **Staging environment** | No dedicated staging; all tests hit production Firebase project — use test Paystack mode and test user accounts |

---

## 13. Test Data Requirements

### Paystack
- Use **test mode** API keys (confirm with dev team)
- Test cards listed in Section 8

### Firebase Test Data to Prepare Before Testing

| Data | How to Create | Used For |
|---|---|---|
| At least 3 products with stock | Admin → Collections | Cart, checkout, stock decrement tests |
| 1 product with stock = 0 | Admin → Collections | Out-of-stock display |
| 1 active gift card | Admin → Gift Cards → Create + Activate | Gift card redemption |
| 1 expired gift card | Admin → Gift Cards → Create with past expiry | Expired card rejection |
| 2 regular Google test accounts | Google accounts | User A & User B for referral test |
| 1+ newsletter subscribers | Subscribe via footer | Newsletter send test |
| 1 draft newsletter campaign | Admin → Newsletter → New Campaign → Save Draft | Send newsletter test |
| 1 custom order | Place via `/custom-order` with test account | Admin custom order view |

### Environment Variables (confirm with dev)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_APP_ID
VITE_PAYSTACK_PUBLIC_KEY   ← must be TEST key for QA
```

---

## 14. Bug Reporting Template

Use the following format for every defect found:

```
BUG-###

Title: [Short, clear description]

Environment:
  - URL: 
  - Browser & Version:
  - Device / Screen Size:
  - User Role: (Guest / Regular User / Admin)

Test Case ID: [e.g. CHK-15]

Steps to Reproduce:
  1.
  2.
  3.

Expected Result:
  [What should happen according to this document]

Actual Result:
  [What actually happened]

Severity: Critical / High / Medium / Low
  - Critical = blocks core user flow (payment, order placement)
  - High = major feature broken but workaround exists
  - Medium = incorrect behaviour but minor impact
  - Low = cosmetic or UI issue

Screenshots / Recording:
  [Attach]

Firebase / Console Errors (if any):
  [Paste any Firestore errors, function logs, or browser console errors]

Notes:
  [Any additional context]
```

---

## Appendix A — Status Lifecycle

```
Retail / Leather / Custom Orders:
  pending → confirmed → production → shipped/shipping → received/delivered
                                                      ↘ cancelled

Gift Cards:
  pending → active → partially_used → fully_redeemed
                                    → expired (by date)
```

---

## Appendix B — Brand Colour Reference

| Token | Hex | Used For |
|---|---|---|
| Brand Red | `#e3242b` | CTAs, active states, accents, icons |
| Brand Red Dark | `#b81b21` | Hover states on red elements |
| Teal | `#007a7a` | Admin button, secondary actions |
| Warm Beige | `#E8D5B0` | Card borders, dividers |
| Background Cream | `#FFF8F0` | Page background |
| WhatsApp Green | `#25D366` | WhatsApp buttons only |

> Any element that appears **cyan/teal** on a customer-facing page (outside of admin teal buttons) is a bug. All customer-facing accents must be brand red.

---

*End of QA Test Plan — PerfectFooties v1.0*
