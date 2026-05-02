# Appointment App — Full Feature Audit & Gap Fix Plan

Below is the complete PRD checklist with current implementation status, followed by the work to close the remaining gaps.

## ✅ Already implemented & working

**Authentication & Onboarding**
- ✅ Email + password signup (name, email, password)
- ✅ OTP verification after signup (Lovable Emails)
- ✅ Email + password login with JWT session
- ✅ Role-based routing post-login (customer → /services, organiser → /organiser, admin → /admin)
- ✅ Role picker on signup (customer / organiser)

**Customer**
- ✅ Browse published appointment types (`/services`)
- ✅ Search & category filter
- ✅ Multi-step booking flow: provider → date → slot → details → confirm → done
- ✅ Real-time slot availability (DB-backed `getSlots`)
- ✅ Capacity selector when manage_capacity enabled
- ✅ Custom questions form rendered from organiser config
- ✅ Razorpay advance payment when required
- ✅ Confirmation page with calendar links
- ✅ My appointments list (upcoming + past, status badges)
- ✅ Cancel booking
- ✅ Reschedule (date/time only)
- ✅ Print payment receipt

**Organiser**
- ✅ Dashboard with Overview / Bookings / Services / Reports tabs
- ✅ Create / edit / delete appointment types
- ✅ Set duration, currency, working hours, lead time, max-advance window, buffer
- ✅ Manage providers (add / edit / remove)
- ✅ Add custom questions (text / textarea / select)
- ✅ Publish / unpublish toggle
- ✅ Capacity management toggle + max capacity
- ✅ Advance payment toggle + amount
- ✅ Manual confirmation toggle
- ✅ Bookings list with status filter, manual confirm/cancel
- ✅ Reports: totals, peak booking hour distribution, top services

**Admin**
- ✅ Stats dashboard (users, organisers, customers, services, bookings, revenue, 14-day trend)
- ✅ List all users
- ✅ Activate / deactivate user accounts
- ✅ Promote / demote roles (customer ↔ organiser ↔ admin)
- ✅ View all bookings, update booking status

**Email (Lovable Emails)**
- ✅ Signup OTP
- ✅ Booking confirmation / reserved (one combined send today)

**Data model & reliability**
- ✅ Postgres tables: users, otps, bookings, appointment_types, providers, questions
- ✅ Row-level lock + capacity check prevents double booking
- ✅ Bcrypt password hashing, JWT sessions, role-guarded routes
- ✅ OTP expiry enforcement

---

## ❌ Missing / incomplete (gap list)

### A. Authentication
1. **Forgot-password is a stub** — UI only, no token issuance, no reset email, no `/reset-password` route.

### B. Customer flow
2. **No "share unpublished via private link"** — `share_token` column exists but isn't generated or honored in the booking page (unpublished services 404 even with a token).
3. **Reschedule email** — no email is sent after a successful reschedule.
4. **Cancel email** — no email is sent on cancel.

### C. Organiser features
5. **No flexible / weekly schedule builder** — only a single `working_start`/`working_end` window; PRD asks for weekly recurring + date-specific overrides (`schedules` table missing).
6. **Per-provider working hours** — providers share the service's hours; PRD wants hours per provider/resource.
7. **Resource-based appointments** — only "user-based" providers exist; no `type: resource` mode or resource naming.
8. **Assignment mode** (auto vs manual) — not implemented; customer always picks provider.
9. **Booking calendar view** — only list view exists, no calendar grid.
10. **Reassign provider on a booking** — no UI/server fn.
11. **New-booking alert email to organiser** — only the customer is emailed.
12. **Booking page preview before publishing** — no preview link from the editor.
13. **Provider/resource utilisation report** — reports tab has hours histogram but no utilisation %.
14. **Onboarding wizard** for first-time organisers — none.

### D. Admin
15. **Per-organiser breakdown** in admin (count of services/bookings per organiser) — not shown.

### E. Non-functional / polish
16. **`is_active` not enforced at login** — deactivated users can still sign in.
17. **WCAG keyboard nav** for calendar/slot picker — not audited.

---

## 🔧 Plan to close the gaps

Phased so each phase is shippable on its own.

### Phase 1 — Email & auth completion
- Add `password_reset_tokens` table (token hash, user_id, expires_at).
- New server fns: `requestPasswordReset`, `resetPassword`. Send reset email via Lovable Emails.
- Wire `/forgot-password` to call the server fn; create `/reset-password` route with token in URL.
- Send **reschedule confirmation** and **cancellation** emails from `rescheduleBooking` / `cancelBooking`.
- Send **new-booking alert** to the organiser inside `createBookingFn` (lookup organiser email by `organiser_id`).
- Block login when `is_active = false` (return a clear error in `loginVerify`).

### Phase 2 — Schedules & resources
- New `schedules` table: `id, appointment_type_id, provider_id, schedule_type ('weekly'|'flexible'), slots_json` (weekly: `{mon:[{start,end}], ...}`, flexible: `{ '2026-05-10':[{start,end}] }`).
- Editor UI in `organiser.services.$id.tsx` → new "Schedule" sub-tab per provider.
- `getSlots` reads schedule for the chosen provider; falls back to `working_start/end` if no schedule row exists (back-compat).
- Add `appointment_types.kind` enum `('user'|'resource')` and a `resource_name` field on providers; relabel UI when `kind='resource'`.
- Add `assignment_mode` ('manual'|'auto') on appointment_types. When auto: customer skips provider step and server picks the first provider with a free slot.

### Phase 3 — Organiser ops & reports
- Calendar view on the Bookings tab (week grid, drag-free, just visual).
- `reassignBooking` server fn + dropdown in booking row.
- Share-link support: generate `share_token` on demand; allow `/book/$id?token=xxx` to bypass `is_published` check.
- "Preview" button in service editor → opens `/book/$id?token=…` in a new tab.
- Utilisation report: `(booked_minutes / available_minutes) per provider per week` rendered as a heatmap.
- First-run onboarding wizard at `/organiser/onboarding` (3 steps: business info → first service → first provider/schedule). Triggered when organiser has zero services.

### Phase 4 — Admin polish & a11y
- Admin: per-organiser table (services count, bookings count, revenue) with click-through.
- Calendar/slot picker keyboard support: arrow keys move date, Enter selects slot, focus ring visible.

### Technical notes
- All new tables added inside `ensureSchema()` with `CREATE TABLE IF NOT EXISTS` so existing data is preserved.
- All new server fns enforce `requireOrganiser` / session checks, matching the existing pattern.
- Email helpers extended in `email.server.ts` (`passwordResetHtml`, `cancellationHtml`, `rescheduleHtml`, `organiserNewBookingHtml`).
- Share-token flow: `services.functions.ts#getService` accepts an optional `token` param and returns the service if `is_published OR share_token matches`.
- No breaking changes to current routes; the booking flow still works for services that don't define a custom schedule.

After Phase 1–4 land, every PRD bullet from sections 4.1 → 4.9 and §5 will be checked off.
