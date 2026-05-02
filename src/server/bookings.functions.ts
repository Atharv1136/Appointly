import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, ensureSchema } from "./db.server";
import { findAppt } from "./services-catalog.server";
import { readSession } from "./auth.server";
import { sendEmail, bookingConfirmationHtml } from "./email.server";
import crypto from "crypto";

export type SlotInfo = { time: string; iso: string; available: boolean; remaining: number };

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
    const appt = findAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    const date = new Date(data.dateISO);
    const [sh, sm] = appt.workingHours.start.split(":").map(Number);
    const [eh, em] = appt.workingHours.end.split(":").map(Number);
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);

    // Pre-fetch existing bookings for the day
    const sql = db();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const rows = await sql`
      SELECT slot_start, capacity_count
      FROM bookings
      WHERE appointment_type_id=${appt.id}
        AND provider_id=${data.providerId}
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
    const minLead = 60 * 60 * 1000;
    const slots: SlotInfo[] = [];
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
      cursor.setMinutes(cursor.getMinutes() + appt.durationMins);
    }
    return { slots };
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

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d) => bookingInputSchema.parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const appt = findAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    const provider = appt.providers.find((p) => p.id === data.providerId);
    if (!provider) throw new Error("Provider not found");
    if (appt.advancePayment && !data.paymentId) {
      throw new Error("Payment is required for this service");
    }
    const sess = await readSession();
    const customerId = sess?.sub ?? "guest_" + data.customerEmail;

    const sql = db();
    const slotStart = new Date(data.slotStartISO);
    const cap = appt.manageCapacity ? appt.maxCapacity : 1;
    const status = appt.manualConfirm ? "pending" : "confirmed";
    const paymentStatus = data.paymentId ? "paid" : "unpaid";
    const id = "b_" + crypto.randomUUID();

    // Transaction with row-level lock to prevent double booking
    try {
      const result = await sql.begin(async (tx) => {
        const used = await tx`
          SELECT COALESCE(SUM(capacity_count), 0)::int AS used
          FROM bookings
          WHERE appointment_type_id=${appt.id}
            AND provider_id=${provider.id}
            AND slot_start=${slotStart}
            AND status <> 'cancelled'
          FOR UPDATE
        `;
        const usedNum = Number(used[0]?.used ?? 0);
        if (usedNum + data.capacityCount > cap) {
          throw new Error("DOUBLE_BOOKING");
        }
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

      // Send confirmation email (best effort)
      try {
        const amount = appt.advancePayment ? Math.round(appt.paymentAmount * data.capacityCount * 1.18) : undefined;
        await sendEmail({
          to: data.customerEmail,
          subject: appt.manualConfirm ? "Your booking has been received" : "Your appointment is confirmed!",
          html: bookingConfirmationHtml({
            customerName: data.customerName,
            serviceTitle: appt.title,
            organiser: appt.organiser,
            providerName: provider.name,
            whenLocal: slotStart.toLocaleString(undefined, {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            }),
            durationMins: appt.durationMins,
            paid: paymentStatus === "paid",
            amount,
            bookingId: result.id,
          }),
        });
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
           slot_start, capacity_count, status, payment_status, answers, created_at
    FROM bookings
    WHERE customer_id=${sess.sub}
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
      answers: r.answers ?? {},
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
});

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await readSession();
    if (!sess) throw new Error("Not authenticated");
    const sql = db();
    await sql`UPDATE bookings SET status='cancelled' WHERE id=${data.id} AND customer_id=${sess.sub}`;
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
        const appt = findAppt(b.appointment_type_id);
        if (!appt) throw new Error("Service not found");
        const cap = appt.manageCapacity ? appt.maxCapacity : 1;
        const used = await tx`
          SELECT COALESCE(SUM(capacity_count),0)::int AS used
          FROM bookings
          WHERE id <> ${data.id}
            AND appointment_type_id=${b.appointment_type_id}
            AND provider_id=${b.provider_id}
            AND slot_start=${slotStart}
            AND status <> 'cancelled'
          FOR UPDATE
        `;
        if (Number(used[0]?.used ?? 0) + Number(b.capacity_count) > cap) {
          throw new Error("DOUBLE_BOOKING");
        }
        await tx`UPDATE bookings SET slot_start=${slotStart} WHERE id=${data.id}`;
      });
      return { ok: true };
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "DOUBLE_BOOKING") throw new Error("This slot is no longer available. Please pick another time.");
      throw e;
    }
  });
