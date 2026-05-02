## Goal

Today the Organiser dashboard only **views** stats over a hard-coded list of 4 services in `services-catalog.server.ts`. After signup, an organiser cannot create their own service, set durations, working hours, prices, or custom questions. We will rebuild it as a full self-service control panel backed by the database, matching the PRD (sections 4.5 – 4.8).

---

## What the organiser will be able to do

1. **Sign up & onboard** — pick the "Organiser" role at signup, land on a guided onboarding screen that walks through creating their first service.
2. **Create & manage services (Appointment Types)**
   - Title, description, category, currency
   - Duration (15 / 30 / 45 / 60 min or custom)
   - Working hours (per weekday, with breaks)
   - Capacity: single or group (max people per slot)
   - Pricing: free / advance payment with amount
   - Manual confirmation toggle (auto-confirm vs approve-each)
   - Min lead time + max advance booking window
   - Buffer time between appointments
   - Publish / unpublish toggle + private share link for unpublished
3. **Manage providers / resources**
   - Add staff or resources to a service (name, title, initials/avatar)
   - Per-provider working hours overrides
4. **Custom booking-form questions**
   - Add/edit/delete questions (text, textarea, select with options)
   - Mark required, reorder
5. **Manage bookings**
   - List + calendar view, filter by date/status/service/provider
   - Confirm, cancel, reschedule, reassign provider
   - View customer answers and payment status
6. **Reports**
   - Bookings over time, peak-hour heatmap, revenue, top services, provider utilisation

---

## Database changes (new migration)

```text
appointment_types   id, organiser_id, title, description, category,
                    duration_mins, currency, manage_capacity, max_capacity,
                    advance_payment, payment_amount, manual_confirm,
                    min_lead_mins, max_advance_days, buffer_mins,
                    is_published, share_token, created_at

providers           id, appointment_type_id, name, title, initials,
                    working_hours_json (per-weekday start/end + breaks)

questions           id, appointment_type_id, label, field_type,
                    options_json, required, sort_order

bookings (existing) + new columns: organiser_id (denormalised for fast filter)
answers             stored as JSONB on bookings (already present)
```

`services-catalog.server.ts` becomes a one-time **seed** for demo data, then is removed from the runtime path. `findAppt`/`listServices`/`getService` are rewritten to query the DB.

---

## New server functions (`src/server/organiser.functions.ts`)

All gated by `requireOrganiserOrAdmin()` and scoped to `organiser_id = session.sub`:

- `listMyServices`, `getMyService(id)`
- `createService(data)`, `updateService(id, data)`, `deleteService(id)`
- `togglePublish(id, published)`
- `addProvider`, `updateProvider`, `removeProvider`
- `addQuestion`, `updateQuestion`, `removeQuestion`, `reorderQuestions`
- `confirmBooking(id)`, `cancelBookingAdmin(id)`, `rescheduleBookingAdmin(id, slot)`, `reassignProvider(id, providerId)`
- `organiserStats` (extended with revenue + utilisation, scoped to organiser)

Existing customer-facing `getSlots` / `createBookingFn` are updated to read service config from the DB instead of the static catalog.

---

## New & updated routes

```text
src/routes/organiser.index.tsx            existing — refactored
src/routes/organiser.services.new.tsx     create-service wizard
src/routes/organiser.services.$id.tsx     edit service: tabs for
                                          Details · Hours · Providers ·
                                          Questions · Rules · Preview
src/routes/organiser.bookings.tsx         full bookings management
src/routes/organiser.onboarding.tsx       first-run wizard after signup
src/routes/signup.tsx                     add role picker (customer/organiser)
```

The dashboard's existing **Overview / Bookings / Services / Reports** tabs stay, but each card/row gets real CRUD actions ("Edit", "Publish", "Delete", "+ New service").

---

## UI building blocks

- Service form with `react-hook-form` + zod, sectioned card layout
- Weekly hours editor: 7 rows (Mon–Sun) with start/end time pickers + "Closed" toggle
- Providers manager: inline list with add/edit dialog
- Questions manager: drag-to-reorder list with type selector
- Rules section: capacity, payment amount, manual confirm switches, lead-time sliders
- Live "Preview booking page" panel that renders the customer-side card + slot grid for the in-progress config
- Calendar view for bookings using existing `Calendar` shadcn component

---

## Auth / signup flow

- Signup form gains a **"I'm an organiser"** option (or a separate `/signup/organiser` route) that sets `role='organiser'` on user creation.
- After OTP verification an organiser is redirected to `/organiser/onboarding` (create first service) instead of `/`.
- `RoleGuard` already supports `["organiser","admin"]` — no changes needed.

---

## Migration / backwards-compat

- On first run we seed the existing 4 catalog services into the DB under a system organiser id `org_seed` so the public services page keeps working.
- `services-catalog.server.ts` is deleted after the seed runs once.
- Bookings table keeps current shape; new `organiser_id` column is back-filled from each booking's appointment type.

---

## Out of scope (call out, defer to next iteration)

- Stripe payouts to organisers (we keep Razorpay collecting on behalf, view-only revenue report)
- Two-way Google/Outlook calendar sync (we keep the existing .ics download)
- SMS notifications
- Multi-organiser teams / staff sub-accounts with their own logins

---

## Build order

1. DB migration + seed of existing catalog
2. Server functions for service CRUD + providers + questions
3. Rewrite `getSlots`/`createBookingFn`/`listServices` to read from DB
4. Organiser service-edit route with all tabs
5. Create-service wizard + onboarding redirect
6. Bookings management tab actions (confirm/cancel/reschedule/reassign)
7. Reports: revenue + utilisation
8. Signup role picker
9. End-to-end test: signup → create service → publish → book as customer → manage in dashboard

Approve this and I'll switch to build mode and ship it in that order.