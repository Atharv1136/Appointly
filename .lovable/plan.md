# Ship all 17 fixes — execution plan

I have a complete picture of the codebase. The work is broken into 4 atomic phases. Approving this switches me into build mode and I'll ship all 17 items end-to-end without further prompting.

## Phase 1 — Auth & emails (items 1, 3, 4, 5, 16)
- Add `password_reset_tokens` table; new `requestPasswordReset` (issues token, sends email) and `resetPassword` server fns.
- New `/reset-password` route page.
- New email templates: `passwordResetHtml`, `bookingRescheduledHtml`, `bookingCancelledHtml`, `organiserNewBookingHtml`, `bookingReservedHtml`.
- `createBookingFn` → also email the organiser; use reserved-vs-confirmed copy for the customer.
- `cancelBooking` & `rescheduleBooking` → send the right email after success.
- `loginFn` → already checks `is_active`; add the same check to `meFn` so deactivated sessions are kicked out, and to OTP verify.

## Phase 2 — Schedules, resources, assignment (items 6, 7, 8, 9)
- New `schedules` table (one row per provider, `weekly` | `flexible`, `slots_json`).
- New `appointment_types.kind` (`user`|`resource`) and `assignment_mode` (`manual`|`auto`) columns + organiser fns to set them.
- New `setSchedule` / `getSchedule` organiser fns.
- `getSlots` reads the provider's schedule when present (per-day window list) and falls back to the service's `working_start/end` otherwise.
- New `getAvailableProviders` fn: returns the first provider with a free slot (used when `assignment_mode='auto'`).
- Booking page: skip the provider step when `assignmentMode==='auto'`; relabel "Provider" → "Resource" when `kind==='resource'`.
- Service editor: new Schedule sub-tab per provider (weekly grid + flexible date overrides), Resource/User toggle, Manual/Auto assignment toggle.

## Phase 3 — Organiser ops (items 2, 10, 11, 12, 13, 14)
- `share_token` lifecycle: `generateShareToken` fn; `getService` accepts an optional token to bypass `is_published`.
- Service editor: "Generate share link" + "Preview booking page" buttons (open `/book/$id?token=…`).
- `book.$id.tsx`: read `?token=` and pass to `getService`.
- Calendar view on Bookings tab (week grid). Toggle list/calendar.
- `reassignBooking` server fn + dropdown in each booking row.
- Utilisation report: compute `(booked_minutes / available_minutes) per provider per week` from bookings + schedules; render heatmap.
- `/organiser/onboarding` first-run wizard (3 steps: business info → first service → first provider/schedule). Auto-redirect organisers with zero services.

## Phase 4 — Admin & a11y (items 15, 17)
- Admin: new "Organisers" sub-section listing each organiser with services count, bookings count, revenue (via new `adminListOrganisers` fn).
- Slot picker & calendar: add `role="grid"`, arrow-key navigation between dates and slots, Enter/Space to select, visible focus rings.

## Technical notes
- All new tables added inside `ensureSchema()` with `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` so existing data is preserved (no destructive migration).
- Auth-token reset link uses a 32-byte random token, sha256-hashed in the DB; expires 30 min.
- `AppointmentType` type extended with optional `isPublished`, `shareToken`, `kind`, `assignmentMode`, `schedules`, `minLeadMins`, `maxAdvanceDays`, `bufferMins`.
- Emails sent best-effort (try/catch, logged on failure) so a flaky email provider never blocks a booking.

After approval I'll execute all 4 phases in this turn.
