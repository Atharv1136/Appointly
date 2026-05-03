import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, ensureSchema } from "./db.server";
import { dbFindAppt } from "./db.server";
import { readSession } from "./auth.server";
import {
  sendEmail,
  bookingConfirmationHtml,
  bookingReservedHtml,
  bookingRescheduledHtml,
  bookingCancelledHtml,
  organiserNewBookingHtml,
  organiserBookingCancelledHtml,
} from "./email.server";
import crypto from "crypto";

export type SlotInfo = { time: string; iso: string; available: boolean; remaining: number };

// Hash a string into a 32-bit signed integer for use with pg_advisory_xact_lock(int, int).
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
function slotLockKeys(apptId: string, providerId: string, slotIso: string): [number, number] {
  return [hash32(`${apptId}:${providerId}`), hash32(slotIso)];
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function windowsForProviderOnDate(
  schedules: { providerId: string; scheduleType: "weekly" | "flexible"; slots: Record<string, { start: string; end: string }[]> }[],
  providerId: string,
  date: Date,
  fallback: { start: string; end: string },
): { start: string; end: string }[] {
  const sched = schedules.find((s) => s.providerId === providerId);
  if (!sched) return [fallback];
  if (sched.scheduleType === "weekly") {
    const key = DAY_KEYS[date.getDay()];
    const wins = sched.slots[key];
    return Array.isArray(wins) && wins.length ? wins : [];
  }
  const dateKey = date.toISOString().slice(0, 10);
  const wins = sched.slots[dateKey];
  return Array.isArray(wins) && wins.length ? wins : [];
}

async function buildSlotsForProvider(appt: any, providerId: string, date: Date, sql: any): Promise<SlotInfo[]> {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const rows = await sql`
    SELECT slot_start, capacity_count
    FROM bookings
    WHERE appointment_type_id=${appt.id}
      AND provider_id=${providerId}
      AND status <> 'cancelled'
      AND slot_start >= ${dayStart}
      AND slot_start <= ${dayEnd}
  `;
  const usage = new Map<string, number>();
  for (const r of rows) {
    const iso = new Date(r.slot_start).toISOString();
    usage.set(iso, (usage.get(iso) ?? 0) + Number(r.capacity_count));
  }
  const cap = appt.manageCapacity ? appt.maxCapacity : 1;
  const minLead = (appt.minLeadMins ?? 60) * 60 * 1000;
  const buffer = (appt.bufferMins ?? 0) * 60000;
  const windows = windowsForProviderOnDate(appt.schedules ?? [], providerId, date, appt.workingHours);
  const slots: SlotInfo[] = [];
  for (const w of windows) {
    const [sh, sm] = w.start.split(":").map(Number);
    const [eh, em] = w.end.split(":").map(Number);
    const start = new Date(date); start.setHours(sh, sm, 0, 0);
    const end = new Date(date); end.setHours(eh, em, 0, 0);
    const cursor = new Date(start);
    while (cursor.getTime() + appt.durationMins * 60000 <= end.getTime()) {
      const iso = cursor.toISOString();
      const used = usage.get(iso) ?? 0;
      const remaining = cap - used;
      const future = cursor.getTime() > Date.now() + minLead;
      slots.push({
        time: cursor.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        iso,
        available: future && remaining > 0,
        remaining,
      });
      cursor.setMinutes(cursor.getMinutes() + appt.durationMins + (appt.bufferMins ?? 0));
      // (buffer is already applied by adding bufferMins after each step)
      void buffer;
    }
  }
  return slots;
}

export const getSlots = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        appointmentTypeId: z.string().min(1).max(80),
        providerId: z.string().min(1).max(80),
        dateISO: z.string().min(8).max(40),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ slots: SlotInfo[] }> => {
    await ensureSchema();
    const appt = await dbFindAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    const sql = db();
    const date = new Date(data.dateISO);
    const slots = await buildSlotsForProvider(appt, data.providerId, date, sql);
    return { slots };
  });

// Auto-assignment: returns the first provider with a free matching slot for this date,
// or any provider+slot pair scoped to the supplied slot ISO.
export const getAvailableProviderForSlot = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      appointmentTypeId: z.string().min(1).max(80),
      slotStartISO: z.string().min(8).max(40),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const appt = await dbFindAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    const sql = db();
    const slotStart = new Date(data.slotStartISO);
    const date = new Date(slotStart); date.setHours(0, 0, 0, 0);
    for (const p of appt.providers) {
      const slots = await buildSlotsForProvider(appt, p.id, date, sql);
      const match = slots.find((s) => s.iso === slotStart.toISOString());
      if (match && match.available) return { providerId: p.id };
    }
    return { providerId: null as string | null };
  });

const bookingInputSchema = z.object({
  appointmentTypeId: z.string().min(1).max(80),
  providerId: z.string().min(1).max(80),
  slotStartISO: z.string().min(8).max(40),
  capacityCount: z.number().int().min(1).max(50),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(200),
  answers: z.record(z.string().max(80), z.string().max(2000)).default({}),
  paymentId: z.string().max(120).optional(),
  razorpayOrderId: z.string().max(120).optional(),
});

async function organiserEmailFor(organiserId: string): Promise<string | null> {
  if (!organiserId) return null;
  const sql = db();
  const rows = await sql`SELECT email FROM users WHERE id=${organiserId}`;
  return rows.length ? rows[0].email : null;
}

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d) => bookingInputSchema.parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const appt = await dbFindAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    let providerId = data.providerId;
    // Auto-assignment: caller may pass providerId='auto' or any value; if mode=auto, override with picker.
    if (appt.assignmentMode === "auto") {
      const sql0 = db();
      const date = new Date(data.slotStartISO); date.setHours(0, 0, 0, 0);
      let chosen: string | null = null;
      for (const p of appt.providers) {
        const slots = await buildSlotsForProvider(appt, p.id, date, sql0);
        const m = slots.find((s) => s.iso === new Date(data.slotStartISO).toISOString());
        if (m && m.available) { chosen = p.id; break; }
      }
      if (!chosen) throw new Error("No provider is available at this time. Please pick another slot.");
      providerId = chosen;
    }
    const provider = appt.providers.find((p) => p.id === providerId);
    if (!provider) throw new Error("Provider not found");
    if (appt.advancePayment && !data.paymentId) {
      throw new Error("Payment is required for this service");
    }
    const sess = await readSession();
    if (!sess) throw new Error("Not authenticated");
    const customerId = sess.sub;

    const sql = db();
    const slotStart = new Date(data.slotStartISO);
    const cap = appt.manageCapacity ? appt.maxCapacity : 1;
    const status = appt.manualConfirm ? "pending" : "confirmed";
    const paymentStatus = data.paymentId ? "paid" : "unpaid";
    const id = "b_" + crypto.randomUUID();

    try {
      const result = await sql.begin(async (tx) => {
        const rows = await tx`
          SELECT capacity_count
          FROM bookings
          WHERE appointment_type_id=${appt.id}
            AND provider_id=${provider.id}
            AND slot_start=${slotStart}
            AND status <> 'cancelled'
          FOR UPDATE
        `;
        const usedNum = rows.reduce((s: number, r: any) => s + Number(r.capacity_count ?? 0), 0);
        if (usedNum + data.capacityCount > cap) throw new Error("DOUBLE_BOOKING");
        await tx`
          INSERT INTO bookings
            (id, appointment_type_id, provider_id, customer_id, customer_name, customer_email,
             slot_start, capacity_count, status, payment_status, payment_id, razorpay_order_id, answers)
          VALUES
            (${id}, ${appt.id}, ${provider.id}, ${customerId}, ${data.customerName}, ${data.customerEmail.toLowerCase()},
             ${slotStart}, ${data.capacityCount}, ${status}, ${paymentStatus},
             ${data.paymentId ?? null}, ${data.razorpayOrderId ?? null}, ${tx.json(data.answers)})
        `;
        return { id };
      });

      // Customer email
      try {
        const whenLocal = slotStart.toLocaleString(undefined, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        const fields = {
          customerName: data.customerName,
          serviceTitle: appt.title,
          organiser: appt.organiser,
          providerName: provider.name,
          whenLocal,
          durationMins: appt.durationMins,
          bookingId: result.id,
        };
        if (status === "pending") {
          await sendEmail({
            to: data.customerEmail,
            subject: "Your booking has been received",
            html: bookingReservedHtml(fields),
          });
        } else {
          const amount = appt.advancePayment ? Math.round(appt.paymentAmount * data.capacityCount * 1.18) : undefined;
          await sendEmail({
            to: data.customerEmail,
            subject: "Your appointment is confirmed!",
            html: bookingConfirmationHtml({ ...fields, paid: paymentStatus === "paid", amount }),
          });
        }
        // Organiser email
        const orgEmail = await organiserEmailFor(appt.organiserId);
        if (orgEmail && orgEmail !== data.customerEmail.toLowerCase()) {
          await sendEmail({
            to: orgEmail,
            subject: status === "pending" ? "New booking request" : "New booking",
            html: organiserNewBookingHtml({
              ...fields,
              customerEmail: data.customerEmail,
              needsApproval: status === "pending",
            }),
          });
        }
      } catch (e) {
        console.error("[booking] email send failed", e);
      }

      return { id: result.id, status, paymentStatus };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "DOUBLE_BOOKING") {
        throw new Error("This slot is no longer available. Please pick another time.");
      }
      throw e;
    }
  });

export const myBookings = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sess = await readSession();
  if (!sess) return { bookings: [] };
  const sql = db();
  const rows = await sql`
    SELECT id, appointment_type_id, provider_id, customer_id, customer_name, customer_email,
           slot_start, capacity_count, status, payment_status, payment_id, razorpay_order_id, answers, created_at
    FROM bookings
    WHERE customer_id=${sess.sub} OR lower(customer_email)=lower(${sess.email})
    ORDER BY slot_start DESC
  `;
  return {
    bookings: rows.map((r) => ({
      id: r.id,
      appointmentTypeId: r.appointment_type_id,
      providerId: r.provider_id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      slotStart: new Date(r.slot_start).toISOString(),
      capacityCount: Number(r.capacity_count),
      status: r.status as "pending" | "confirmed" | "cancelled",
      paymentStatus: r.payment_status as "paid" | "unpaid",
      paymentId: r.payment_id ?? undefined,
      razorpayOrderId: r.razorpay_order_id ?? undefined,
      answers: r.answers ?? {},
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
});

async function emailContextForBooking(bookingId: string) {
  const sql = db();
  const rows = await sql`SELECT * FROM bookings WHERE id=${bookingId}`;
  if (!rows.length) return null;
  const b = rows[0];
  const appt = await dbFindAppt(b.appointment_type_id);
  if (!appt) return null;
  const provider = appt.providers.find((p) => p.id === b.provider_id);
  return { booking: b, appt, providerName: provider?.name ?? "—" };
}

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await readSession();
    if (!sess) throw new Error("Not authenticated");
    const sql = db();
    const ctx = await emailContextForBooking(data.id);
    await sql`UPDATE bookings SET status='cancelled' WHERE id=${data.id} AND customer_id=${sess.sub}`;
    if (ctx) {
      const fields = {
        customerName: ctx.booking.customer_name,
        serviceTitle: ctx.appt.title,
        organiser: ctx.appt.organiser,
        providerName: ctx.providerName,
        whenLocal: new Date(ctx.booking.slot_start).toLocaleString(undefined, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        durationMins: ctx.appt.durationMins,
        bookingId: ctx.booking.id,
      };
      try {
        await sendEmail({
          to: ctx.booking.customer_email,
          subject: "Your appointment has been cancelled",
          html: bookingCancelledHtml(fields),
        });
        const orgEmail = await organiserEmailFor(ctx.appt.organiserId);
        if (orgEmail) {
          await sendEmail({
            to: orgEmail,
            subject: "Booking cancelled",
            html: organiserBookingCancelledHtml({ ...fields, customerEmail: ctx.booking.customer_email }),
          });
        }
      } catch (e) { console.error("[cancel] email send failed", e); }
    }
    return { ok: true };
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), slotStartISO: z.string().min(8).max(40) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await readSession();
    if (!sess) throw new Error("Not authenticated");
    const sql = db();
    const slotStart = new Date(data.slotStartISO);
    try {
      await sql.begin(async (tx) => {
        const rows = await tx`SELECT * FROM bookings WHERE id=${data.id} AND customer_id=${sess.sub} FOR UPDATE`;
        if (!rows.length) throw new Error("Booking not found");
        const b = rows[0];
        const appt = await dbFindAppt(b.appointment_type_id);
        if (!appt) throw new Error("Service not found");
        const cap = appt.manageCapacity ? appt.maxCapacity : 1;
        const usedRows = await tx`
          SELECT capacity_count
          FROM bookings
          WHERE id <> ${data.id}
            AND appointment_type_id=${b.appointment_type_id}
            AND provider_id=${b.provider_id}
            AND slot_start=${slotStart}
            AND status <> 'cancelled'
          FOR UPDATE
        `;
        const usedNum = usedRows.reduce((s: number, r: any) => s + Number(r.capacity_count ?? 0), 0);
        if (usedNum + Number(b.capacity_count) > cap) throw new Error("DOUBLE_BOOKING");
        await tx`UPDATE bookings SET slot_start=${slotStart} WHERE id=${data.id}`;
      });
      const ctx = await emailContextForBooking(data.id);
      if (ctx) {
        const fields = {
          customerName: ctx.booking.customer_name,
          serviceTitle: ctx.appt.title,
          organiser: ctx.appt.organiser,
          providerName: ctx.providerName,
          whenLocal: slotStart.toLocaleString(undefined, {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          }),
          durationMins: ctx.appt.durationMins,
          bookingId: ctx.booking.id,
        };
        try {
          await sendEmail({
            to: ctx.booking.customer_email,
            subject: "Your appointment was rescheduled",
            html: bookingRescheduledHtml(fields),
          });
          const orgEmail = await organiserEmailFor(ctx.appt.organiserId);
          if (orgEmail) {
            await sendEmail({
              to: orgEmail,
              subject: "Booking rescheduled",
              html: bookingRescheduledHtml(fields),
            });
          }
        } catch (e) { console.error("[reschedule] email send failed", e); }
      }
      return { ok: true };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "DOUBLE_BOOKING") throw new Error("This slot is no longer available. Please pick another time.");
      throw e;
    }
  });
