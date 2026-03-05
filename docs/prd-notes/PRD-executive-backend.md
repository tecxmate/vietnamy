# Product Requirements Document: VnMe Executive Backend

**Version:** 1.0
**Date:** February 25, 2026
**Author:** Product & Engineering
**Status:** Draft
**Target Tier:** VnMe Executive (affluent expats, business executives, high-end travelers in Vietnam)

---

## Table of Contents

1. [Stripe Payment Integration](#1-stripe-payment-integration)
2. [On-Demand Human Translation System](#2-on-demand-human-translation-system)
3. [Calendly/Zoom Tutoring Integration](#3-calendlyzoom-tutoring-integration)
4. [Enterprise B2B License Management](#4-enterprise-b2b-license-management)
5. [Hotel Wi-Fi Geo-Detection](#5-hotel-wi-fi-geo-detection)
6. [Affiliate Tracking Backend](#6-affiliate-tracking-backend)
7. [Blog/SEO Content Platform](#7-blogseo-content-platform)
8. [Push Notification System](#8-push-notification-system)

---

## 1. Stripe Payment Integration

### Overview

Monetize the Executive tier through recurring subscriptions managed entirely via Stripe. Users subscribe at $15/month or $150/year, with Stripe handling checkout, billing, and self-service management through its Customer Portal. The backend tracks subscription status on each user record and responds to Stripe lifecycle events via webhooks.

### Requirements

- Offer two subscription plans: **$15/month** and **$150/year** for "VnMe Executive."
- Use **Stripe Checkout Sessions** for the initial subscription flow. The frontend `PremiumModal` CTA calls the backend, which creates a session and returns the Stripe-hosted checkout URL.
- Provide **Stripe Customer Portal** access so users can update payment methods, switch plans, and cancel without contacting support.
- Implement a **webhook handler** at `POST /api/webhooks/stripe` that processes at minimum: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- Persist `stripe_customer_id`, `subscription_id`, `subscription_status`, and `current_period_end` on the user record.
- Enforce a **3-day grace period** after a failed payment before revoking Executive access.
- Gate all Executive-only API routes with middleware that checks subscription status.

### Technical Approach

- Install the `stripe` npm package on the Express server.
- Create Stripe Products and Prices via the Stripe Dashboard or seed script; store Price IDs in server config.
- **`POST /api/subscribe`** — Accepts `{ priceId }`, creates a Stripe Checkout Session with `mode: 'subscription'`, and returns `{ url }` for redirect.
- **`POST /api/webhooks/stripe`** — Receives raw body (do not parse JSON before signature verification), verifies with `stripe.webhooks.constructEvent`, and updates the user record accordingly.
- **`GET /api/subscription-status`** — Returns the authenticated user's current plan, status, and `current_period_end`.
- **`POST /api/billing-portal`** — Creates a Stripe Billing Portal session and returns its URL.
- On `invoice.payment_failed`, set a `grace_period_end` timestamp (current time + 3 days). A scheduled job revokes access for users past their grace period.

### Acceptance Criteria

- [ ] A free-tier user can click "Upgrade" in `PremiumModal`, be redirected to Stripe Checkout, complete payment, and return to the app with Executive access active immediately.
- [ ] `GET /api/subscription-status` reflects the correct plan and status within 30 seconds of a Stripe event.
- [ ] After a simulated failed payment, the user retains access for exactly 3 days before being downgraded.
- [ ] A subscribed user can access Stripe Customer Portal, cancel, and have their status updated to `canceled` at period end.
- [ ] Webhook endpoint rejects requests with invalid Stripe signatures (returns 400).
- [ ] All Executive-gated endpoints return 403 for users without an active subscription.

---

## 2. On-Demand Human Translation System

### Overview

Allow users to submit English phrases and receive studio-quality Vietnamese audio recordings from native speakers within 24 hours. This is a premium differentiator: Executive-tier users get unlimited requests for free, while free-tier users pay per request. An admin queue lets translators claim, record, and submit work, with a quality review step before delivery.

### Requirements

- Users submit an English phrase (max 500 characters) via `POST /api/translations/request`.
- Native-speaking translators record Vietnamese audio and upload it to fulfill the request.
- **Pricing:** 5,000 VND (~$0.20) per request for free-tier users; free for Executive-tier users.
- Recordings are stored in **S3 or Cloudflare R2** and served via signed or CDN URLs.
- An **admin queue** allows translators to browse unclaimed requests, claim one, upload audio, and mark it complete.
- A **quality review step** (admin or senior translator) approves the recording before it is delivered to the user.
- Users receive a **push notification** when their recording is ready.
- Users can view all their past requests and recordings via `GET /api/translations/mine`.

### Technical Approach

- **Database table: `translation_requests`**
  - `id`, `user_id`, `source_text`, `status` (pending, claimed, recorded, reviewed, delivered, rejected), `translator_id`, `reviewer_id`, `audio_url`, `created_at`, `delivered_at`
- **API Endpoints:**
  - `POST /api/translations/request` — Create a new request. Deduct credits or verify Executive status.
  - `GET /api/translations/mine` — List the authenticated user's requests with status and audio URLs.
  - `GET /api/admin/translations/queue` — List unclaimed requests (translator role).
  - `POST /api/admin/translations/:id/claim` — Translator claims a request.
  - `POST /api/admin/translations/:id/upload` — Translator uploads audio (multipart form).
  - `POST /api/admin/translations/:id/approve` — Reviewer approves; status moves to `delivered` and notification fires.
  - `POST /api/admin/translations/:id/reject` — Reviewer rejects with feedback; translator re-records.
- Audio upload uses `multer` for multipart handling, then streams to R2/S3 via the AWS SDK or R2-compatible client.
- Trigger a push notification (see Section 8) on status change to `delivered`.

### Acceptance Criteria

- [ ] A free-tier user can submit a request, be charged 5,000 VND, and see it appear in their request list as "pending."
- [ ] An Executive-tier user can submit a request with no charge.
- [ ] A translator can view the queue, claim a request, upload audio, and submit for review.
- [ ] A reviewer can approve or reject a submission. Rejected submissions return to the translator with feedback.
- [ ] On approval, the user receives a push notification and can play the audio from their request history.
- [ ] Audio files are served from R2/S3 with appropriate caching headers and access controls.
- [ ] The median turnaround from submission to delivery is under 24 hours (measured via analytics).

---

## 3. Calendly/Zoom Tutoring Integration

### Overview

Connect Executive users with live Vietnamese tutors for 1-on-1 sessions. Tutors maintain profiles with availability and specialties. Booking is handled via Calendly (embed or API), and sessions take place on Zoom. Payments flow through Stripe, with the platform retaining a 20% commission and paying tutors via Stripe Connect.

### Requirements

- **Tutor profiles:** name, photo, bio, specialties (Business Vietnamese, Conversational, etc.), session rate ($25-$40 per 30 minutes), star rating, availability.
- **Booking flow:** User selects a tutor, picks an available time slot (Calendly embed or Calendly API), and pays for the session.
- **Zoom integration:** A Zoom meeting link is auto-generated upon confirmed booking and shared with both parties.
- **Payment:** Per-session charge via Stripe at time of booking. The platform takes a **20% commission**.
- **Tutor payouts:** Handled via **Stripe Connect** (Standard or Express accounts). Tutors onboard once through a Stripe Connect flow.
- Session history and upcoming bookings are visible to both users and tutors.

### Technical Approach

- **Database tables:**
  - `tutors` — `id`, `user_id`, `display_name`, `bio`, `specialties` (JSON), `rate_cents`, `calendly_url`, `stripe_connect_id`, `rating`, `active`
  - `bookings` — `id`, `user_id`, `tutor_id`, `calendly_event_id`, `zoom_link`, `starts_at`, `duration_min`, `amount_cents`, `platform_fee_cents`, `status` (confirmed, completed, canceled), `created_at`
- **API Endpoints:**
  - `GET /api/tutors` — List active tutors with availability summary.
  - `GET /api/tutors/:id` — Full tutor profile.
  - `POST /api/bookings` — Create a booking. Charges the user via Stripe and creates a transfer to the tutor's Connect account minus 20%.
  - `GET /api/bookings/mine` — User's upcoming and past sessions.
  - `POST /api/webhooks/calendly` — Receive Calendly webhook on event creation/cancellation.
- Zoom meeting links are created via the **Zoom Server-to-Server OAuth** app using `POST /v2/users/{userId}/meetings`.
- Calendly integration options: embed Calendly scheduling widget in-app, or use the Calendly API v2 to fetch availability and create invitees programmatically.
- Stripe Connect: Use `payment_intents` with `transfer_data` to split funds at payment time.

### Acceptance Criteria

- [ ] Users can browse tutor profiles filtered by specialty and view real-time availability.
- [ ] A user can book a session, pay via Stripe, and receive a confirmation with a Zoom link.
- [ ] The tutor receives the Zoom link and booking details.
- [ ] The platform retains exactly 20% of the session fee; the tutor receives 80% via Stripe Connect.
- [ ] Cancellations made 24+ hours in advance result in a full refund; under 24 hours, no refund.
- [ ] Both users and tutors can view their session history.

---

## 4. Enterprise B2B License Management

### Overview

Offer enterprise packages to companies relocating employees to Vietnam, international schools, and hospitality groups. An admin dashboard lets the enterprise account owner manage seats, view usage analytics, and customize branding. Billing is invoice-based (NET 30) rather than credit card.

### Requirements

- **Pricing:** $5,000/year for 50 seats (additional seats available).
- **Admin dashboard** for the enterprise account owner:
  - Add/remove users by email.
  - Bulk onboard employees via **CSV upload** (columns: email, first_name, last_name, department).
  - View per-employee usage analytics (lessons completed, practice sessions, streak).
- **Custom branding:** Upload a company logo displayed in the app header for enterprise users.
- **SSO support:** SAML 2.0 and OAuth 2.0 for enterprise identity providers (Okta, Azure AD, Google Workspace).
- **Invoice billing:** Generate invoices with NET 30 payment terms. Track payment status.
- Enterprise users receive full Executive-tier access without individual subscriptions.

### Technical Approach

- **Database tables:**
  - `organizations` — `id`, `name`, `logo_url`, `sso_provider`, `sso_config` (JSON), `seat_limit`, `billing_email`, `contract_start`, `contract_end`, `status`
  - `org_memberships` — `id`, `org_id`, `user_id`, `role` (admin, member), `added_at`
  - `org_invoices` — `id`, `org_id`, `amount_cents`, `issued_at`, `due_at`, `paid_at`, `status` (draft, sent, paid, overdue)
- **API Endpoints:**
  - `POST /api/enterprise/seats` — Add a user by email. Sends invite if unregistered.
  - `DELETE /api/enterprise/seats/:userId` — Remove a user from the organization.
  - `POST /api/enterprise/seats/bulk` — Accept CSV file, parse, and onboard users.
  - `GET /api/enterprise/analytics` — Aggregated and per-user usage data.
  - `PUT /api/enterprise/branding` — Upload logo, update organization display settings.
  - `GET /api/enterprise/invoices` — List invoices for the organization.
- SSO: Use `passport-saml` for SAML and existing OAuth strategies for OAuth 2.0. On SSO login, auto-provision the user into the organization.
- CSV parsing via `csv-parse` npm package with validation and error reporting.
- Subscription middleware recognizes org membership as equivalent to an active Executive subscription.

### Acceptance Criteria

- [ ] An enterprise admin can log in, view the dashboard, and see current seat usage (e.g., "37/50 seats used").
- [ ] Adding a user by email grants them immediate Executive access. If they have no account, they receive an invite email.
- [ ] CSV bulk upload correctly onboards valid rows and returns errors for invalid ones (missing email, duplicate, etc.).
- [ ] Per-employee analytics show lessons completed, practice time, and current streak.
- [ ] The company logo appears in the app header for all organization members.
- [ ] SSO login via SAML (tested with Okta) auto-provisions the user into the correct organization.
- [ ] Invoices are generated with NET 30 terms and their status is tracked accurately.

---

## 5. Hotel Wi-Fi Geo-Detection

### Overview

Partner with hotels to offer complimentary VnMe access to guests. When a user connects to a partner hotel's Wi-Fi network, the app detects the network via IP range matching and auto-unlocks specified Executive modules for the duration of their session. This creates a distribution channel and upsell funnel.

### Requirements

- Detect the user's connection to a partner hotel's Wi-Fi by matching their public IP against known IP ranges.
- Auto-unlock specified modules (e.g., Travel Phrases, Restaurant Vietnamese) for the duration of the session without requiring login.
- **Partner hotel management dashboard:** Add/edit hotels, configure IP ranges, select unlocked modules, view activation analytics.
- **Analytics:** Track activations per hotel (unique users, sessions, module usage, conversion to signup).
- **Fallback:** If IP detection fails, provide a hotel-specific landing page URL (e.g., `/hotel/marriott-hcmc`) with a time-limited access token.

### Technical Approach

- **Database tables:**
  - `partner_hotels` — `id`, `name`, `chain`, `city`, `ip_ranges` (JSON array of CIDR blocks), `unlocked_modules` (JSON array), `landing_slug`, `active`, `created_at`
  - `hotel_activations` — `id`, `hotel_id`, `user_id` (nullable for anonymous), `ip_address`, `session_token`, `activated_at`, `converted_to_signup` (boolean)
- **API Endpoints:**
  - `GET /api/hotel/detect` — Called on app load. Checks the request IP against `partner_hotels.ip_ranges`. Returns `{ hotel, unlockedModules }` or `{ detected: false }`.
  - `GET /api/hotel/:slug` — Landing page fallback. Issues a short-lived JWT granting temporary module access.
  - `GET /api/admin/hotels` — List partner hotels.
  - `POST /api/admin/hotels` — Add a new partner hotel with IP ranges and module config.
  - `PUT /api/admin/hotels/:id` — Update hotel configuration.
  - `GET /api/admin/hotels/:id/analytics` — Activation and conversion metrics.
- IP matching: Use the `ip-range-check` or `netmask` npm package to test the request IP against CIDR blocks. Cache the hotel-IP lookup in memory for fast matching.
- For the fallback flow, generate a JWT with `{ hotelId, modules, exp }` (e.g., 8-hour expiry) and pass it as a query parameter.
- The frontend reads the hotel detection response and conditionally unlocks modules in the UI without requiring auth.

### Acceptance Criteria

- [ ] A request from an IP within a partner hotel's configured range returns the correct hotel and unlocked modules.
- [ ] An unauthenticated user on hotel Wi-Fi can access the specified modules without signing up.
- [ ] The hotel fallback landing page issues a valid temporary token that unlocks the correct modules.
- [ ] The partner dashboard accurately shows activation counts and signup conversion rates per hotel.
- [ ] Adding or updating a hotel's IP range takes effect within 60 seconds (cache refresh).
- [ ] Requests from non-partner IPs return `{ detected: false }` with no unlocked modules.

---

## 6. Affiliate Tracking Backend

### Overview

Power a referral and affiliate program that lets influencers, bloggers, travel agencies, and existing users earn commission by referring new subscribers. The backend tracks clicks, signups, and conversions tied to unique affiliate codes, calculates commissions, and reports payout amounts.

### Requirements

- Each affiliate receives a **unique tracking code** (e.g., `?ref=AFFILIATE_CODE`).
- Track **clicks** (landing page visits with ref param), **signups** (account creation), and **conversions** (paid subscription).
- **Commission tiers:** configurable percentage of subscription revenue (e.g., 20% for standard affiliates, 30% for premium partners).
- **Payout reporting:** Affiliates can view their referrals, earnings, and payout history.
- **Affiliate dashboard:** Dedicated interface showing clicks, conversions, conversion rate, and earnings.
- Payouts via **Stripe Connect** (preferred) or manual bank transfer with export.

### Technical Approach

- **Database tables:**
  - `affiliates` — `id`, `user_id`, `code` (unique), `commission_rate`, `tier`, `stripe_connect_id`, `status` (active, paused, terminated), `created_at`
  - `affiliate_clicks` — `id`, `affiliate_id`, `ip_address`, `user_agent`, `referrer_url`, `created_at`
  - `affiliate_conversions` — `id`, `affiliate_id`, `referred_user_id`, `event` (signup, subscription), `revenue_cents`, `commission_cents`, `created_at`
  - `affiliate_payouts` — `id`, `affiliate_id`, `amount_cents`, `stripe_transfer_id`, `status` (pending, paid, failed), `created_at`
- **API Endpoints:**
  - `GET /api/affiliate/track?ref=CODE` — Record a click. Set a first-party cookie (`vnme_ref`, 30-day expiry) so the attribution persists.
  - `GET /api/affiliate/dashboard` — Authenticated affiliate's stats: clicks, signups, conversions, earnings, payout history.
  - `POST /api/admin/affiliates` — Create or manage affiliate accounts.
  - `POST /api/admin/affiliates/payouts` — Trigger payout batch.
- On user signup, check for `vnme_ref` cookie and associate the new user with the affiliate.
- On subscription creation (via Stripe webhook), calculate commission and write to `affiliate_conversions`.
- Monthly payout job: aggregate unpaid commissions, create Stripe transfers to Connect accounts.

### Acceptance Criteria

- [ ] Visiting the site with `?ref=CODE` sets the attribution cookie and records a click.
- [ ] A user who signs up within 30 days of clicking an affiliate link is attributed to that affiliate.
- [ ] When the attributed user subscribes, the correct commission (based on tier) is calculated and recorded.
- [ ] The affiliate dashboard displays accurate click, conversion, and earnings data.
- [ ] Payouts are correctly batched and transferred via Stripe Connect.
- [ ] Affiliate codes are case-insensitive and validate to prevent duplicates.

---

## 7. Blog/SEO Content Platform

### Overview

Publish expat-targeted content (articles, guides, listicles) to drive organic search traffic and funnel readers into the app. The platform supports SEO metadata, categorization, email capture, and deep links into relevant app lessons. This can be built as a headless CMS integration or an extension of the existing admin tools.

### Requirements

- **CMS for publishing articles** with rich text, images, and embedded media.
- **SEO metadata** per article: title tag, meta description, Open Graph tags (og:title, og:description, og:image), canonical URL.
- **Categories:** Expat Life, Business Vietnamese, Real Estate, Culture, Travel, Food.
- **Email capture:** Newsletter signup form on each article page. Store subscribers for drip campaigns.
- **App integration:** Articles link to relevant lessons/modules within VnMe (e.g., "Learn restaurant phrases" links to the corresponding practice page).
- **Implementation options:** Headless CMS (Contentful, Strapi) or extend the existing Express admin to include article CRUD.

### Technical Approach

- **Recommended approach:** Use **Strapi** (self-hosted, open source) as the headless CMS. The Express server proxies or fetches content from Strapi's API and renders it server-side (or serves it to a static site generator).
- **Alternative:** Build article CRUD directly into the Express admin with a `blog_posts` table:
  - `id`, `title`, `slug`, `body` (Markdown or HTML), `excerpt`, `category`, `featured_image_url`, `seo_title`, `seo_description`, `og_image_url`, `author_id`, `status` (draft, published), `published_at`, `created_at`, `updated_at`
  - `email_subscribers` — `id`, `email`, `source` (article slug), `subscribed_at`, `unsubscribed_at`
- **API Endpoints (if built in-house):**
  - `GET /api/blog/posts` — List published posts, paginated, filterable by category.
  - `GET /api/blog/posts/:slug` — Single post with full content and SEO metadata.
  - `POST /api/blog/subscribe` — Email newsletter signup.
  - Admin CRUD: `POST/PUT/DELETE /api/admin/blog/posts`
- Server-side render the blog pages (or pre-render at build time) for SEO. Include structured data (JSON-LD Article schema).
- Email capture integrates with a mailing service (Resend, SendGrid, or Mailchimp) for drip campaign delivery.

### Acceptance Criteria

- [ ] An admin can create, edit, and publish a blog post with rich content and images.
- [ ] Published posts are accessible at `/blog/:slug` and render server-side with correct SEO tags.
- [ ] Each post page includes og:title, og:description, og:image, and canonical URL in the HTML head.
- [ ] Posts are filterable by category on the blog index page.
- [ ] The email capture form successfully stores the subscriber and triggers a confirmation/welcome email.
- [ ] Articles contain working deep links to relevant VnMe app modules.
- [ ] Google Search Console shows the blog pages as indexed and crawlable within 2 weeks of launch.

---

## 8. Push Notification System

### Overview

Keep users engaged with timely push notifications delivered via the Web Push API. Notification types include daily practice reminders, streak-at-risk alerts, new content announcements, and translation-ready notifications. Users control their preferences, and admins can broadcast to all users or targeted segments.

### Requirements

- Implement **Web Push API** using a service worker to receive notifications even when the app tab is closed.
- **Notification types:**
  - Daily practice reminder (configurable time)
  - Streak at risk (sent if user has not practiced and streak will expire in < 4 hours)
  - New content available (new lessons, articles)
  - Translation ready (see Section 2)
  - Admin broadcast (announcements, promotions)
- **User preferences:** Opt-in/out per notification type. Set preferred delivery time for daily reminders.
- **Scheduled sends:** Deliver daily reminders at each user's preferred local time.
- **Admin tools:** Compose and send broadcast notifications to all users or filtered segments (e.g., Executive tier, inactive 7+ days).

### Technical Approach

- Use the `web-push` npm package to send push messages from the Express server.
- Generate VAPID keys (store in environment variables). The frontend requests push permission and sends the subscription object to the server.
- **Database tables:**
  - `push_subscriptions` — `id`, `user_id`, `endpoint`, `keys_p256dh`, `keys_auth`, `created_at`
  - `notification_preferences` — `user_id`, `daily_reminder` (boolean), `reminder_time` (HH:MM), `streak_alert` (boolean), `new_content` (boolean), `translation_ready` (boolean)
  - `notification_log` — `id`, `user_id`, `type`, `title`, `body`, `sent_at`, `clicked_at`
- **API Endpoints:**
  - `POST /api/push/subscribe` — Store the push subscription object for the authenticated user.
  - `PUT /api/push/preferences` — Update notification preferences.
  - `GET /api/push/preferences` — Retrieve current preferences.
  - `POST /api/admin/push/broadcast` — Send a notification to all users or a segment.
- **Scheduled jobs (cron):**
  - Every 15 minutes: query users whose `reminder_time` falls within the current window and who have not practiced today. Send daily reminder.
  - Every hour: query users with active streaks who have not practiced and whose streak expires within 4 hours. Send streak-at-risk alert.
- Service worker (`sw.js`) handles the `push` event, displays the notification, and handles `notificationclick` to open the app at the relevant page.

### Acceptance Criteria

- [ ] A user can grant push permission, and the subscription is stored on the server.
- [ ] A user who opts into daily reminders receives a notification at their configured time (within a 15-minute window).
- [ ] A user with a streak at risk receives an alert notification before the streak expires.
- [ ] When a translation is marked as delivered, the requesting user receives a push notification within 60 seconds.
- [ ] An admin can compose and send a broadcast notification that reaches all opted-in users.
- [ ] Users can toggle each notification type on/off independently, and changes take effect immediately.
- [ ] The notification log records all sent notifications and tracks click-through.
- [ ] Notifications display correctly on Chrome, Firefox, and Edge on both desktop and mobile.

---

## Appendix

### Shared Infrastructure Notes

- **Authentication:** All endpoints (except public blog and hotel detection) require JWT-based authentication. Enterprise SSO tokens are exchanged for the same JWT format.
- **Database:** SQLite for development; migrate to PostgreSQL for production deployment of these features.
- **File Storage:** Cloudflare R2 (S3-compatible) for audio files, images, and logos. Serve via Cloudflare CDN.
- **Environment Variables:** All API keys, Stripe secrets, VAPID keys, and third-party credentials are stored in environment variables, never committed to the repository.
- **Rate Limiting:** Apply rate limits to all public-facing endpoints (e.g., 100 requests/minute per IP for detection, 10 requests/minute for translation submissions).

### Priority Order (Suggested)

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | Stripe Payment Integration | Prerequisite for all monetization |
| P0 | Push Notification System | Prerequisite for engagement and translation delivery |
| P1 | On-Demand Human Translation | Core Executive differentiator |
| P1 | Affiliate Tracking Backend | Growth engine for acquisition |
| P2 | Calendly/Zoom Tutoring Integration | High-value but operationally complex |
| P2 | Blog/SEO Content Platform | Long-term organic growth |
| P3 | Enterprise B2B License Management | Longer sales cycle |
| P3 | Hotel Wi-Fi Geo-Detection | Requires partner development |
