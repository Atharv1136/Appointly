import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, ensureSchema } from "./db.server";
import { readSession } from "./auth.server";
import { APPT_TYPES } from "./services-catalog.server";

async function requireAdmin() {
  const sess = await readSession();
  if (!sess) throw new Error("Not authenticated");
  if (sess.role !== "admin") throw new Error("Admin access required");
  return sess;
}

async function requireOrganiserOrAdmin() {
  const sess = await readSession();
  if (!sess) throw new Error("Not authenticated");
  if (sess.role !== "admin" && sess.role !== "organiser") throw new Error("Organiser access required");
  return sess;
}

export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  await requireAdmin();
  const sql = db();
  const [users, organisers, customers, bookings, confirmed, pending, cancelled, revenueRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM users`,
    sql`SELECT COUNT(*)::int AS c FROM users WHERE role='organiser'`,
    sql`SELECT COUNT(*)::int AS c FROM users WHERE role='customer'`,
    sql`SELECT COUNT(*)::int AS c FROM bookings`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='confirmed'`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='pending'`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='cancelled'`,
    sql`SELECT appointment_type_id, capacity_count FROM bookings WHERE payment_status='paid' AND status<>'cancelled'`,
  ]);
  // Compute revenue from catalog amounts
  let revenue = 0;
  const priceMap = new Map(APPT_TYPES.map((a) => [a.id, a.advancePayment ? a.paymentAmount : 0]));
  for (const r of revenueRows) {
    const p = priceMap.get(r.appointment_type_id) ?? 0;
    revenue += p * Number(r.capacity_count);
  }
  // Bookings by day (last 14 days)
  const trend = await sql`
    SELECT DATE_TRUNC('day', slot_start)::date AS d, COUNT(*)::int AS c
    FROM bookings
    WHERE slot_start >= NOW() - INTERVAL '14 days'
    GROUP BY 1 ORDER BY 1
  `;
  return {
    totalUsers: users[0].c,
    totalOrganisers: organisers[0].c,
    totalCustomers: customers[0].c,
    totalServices: APPT_TYPES.length,
    totalBookings: bookings[0].c,
    confirmedBookings: confirmed[0].c,
    pendingBookings: pending[0].c,
    cancelledBookings: cancelled[0].c,
    revenue,
    trend: trend.map((r) => ({ date: new Date(r.d).toISOString().slice(0, 10), count: r.c })),
  };
});

export const adminListUsers = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  await requireAdmin();
  const sql = db();
  const rows = await sql`
    SELECT id, name, email, role, COALESCE(is_active, TRUE) AS is_active, verified, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return {
    users: rows.map((r) => ({
      id: r.id, name: r.name, email: r.email, role: r.role,
      isActive: r.is_active, verified: r.verified,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
});

export const adminSetUserActive = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await requireAdmin();
    if (data.id === sess.sub) throw new Error("You cannot deactivate your own account");
    const sql = db();
    await sql`UPDATE users SET is_active=${data.active} WHERE id=${data.id}`;
    return { ok: true };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.string().min(1).max(80),
    role: z.enum(["customer", "organiser", "admin"]),
  }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await requireAdmin();
    if (data.id === sess.sub && data.role !== "admin") throw new Error("You cannot demote yourself");
    const sql = db();
    await sql`UPDATE users SET role=${data.role} WHERE id=${data.id}`;
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    status: z.enum(["all", "pending", "confirmed", "cancelled"]).default("all"),
    serviceId: z.string().max(80).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    await requireOrganiserOrAdmin();
    const sql = db();
    const rows = await sql`
      SELECT id, appointment_type_id, provider_id, customer_id, customer_name, customer_email,
             slot_start, capacity_count, status, payment_status, created_at
      FROM bookings
      WHERE (${data.status === "all"} OR status = ${data.status})
        AND (${!data.serviceId} OR appointment_type_id = ${data.serviceId ?? ""})
      ORDER BY slot_start DESC
      LIMIT 500
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
        createdAt: new Date(r.created_at).toISOString(),
      })),
    };
  });

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.string().min(1).max(80),
    status: z.enum(["pending", "confirmed", "cancelled"]),
  }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    await requireOrganiserOrAdmin();
    const sql = db();
    await sql`UPDATE bookings SET status=${data.status} WHERE id=${data.id}`;
    return { ok: true };
  });

export const organiserStats = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  await requireOrganiserOrAdmin();
  const sql = db();
  const [bookings, confirmed, pending, cancelled, byService, byHour] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM bookings`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='confirmed'`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='pending'`,
    sql`SELECT COUNT(*)::int AS c FROM bookings WHERE status='cancelled'`,
    sql`SELECT appointment_type_id, COUNT(*)::int AS c FROM bookings WHERE status<>'cancelled' GROUP BY 1 ORDER BY c DESC LIMIT 10`,
    sql`SELECT EXTRACT(HOUR FROM slot_start)::int AS h, COUNT(*)::int AS c FROM bookings WHERE status<>'cancelled' GROUP BY 1 ORDER BY 1`,
  ]);
  return {
    totalBookings: bookings[0].c,
    confirmed: confirmed[0].c,
    pending: pending[0].c,
    cancelled: cancelled[0].c,
    byService: byService.map((r) => ({ serviceId: r.appointment_type_id, count: r.c })),
    byHour: byHour.map((r) => ({ hour: r.h, count: r.c })),
  };
});
