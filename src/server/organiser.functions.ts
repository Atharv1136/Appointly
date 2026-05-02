import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { db, ensureSchema, dbFindAppt, dbListAppointmentTypes } from "./db.server";
import { readSession } from "./auth.server";

async function requireOrganiser() {
  const sess = await readSession();
  if (!sess) throw new Error("Not authenticated");
  if (sess.role !== "organiser" && sess.role !== "admin") throw new Error("Organiser access required");
  return sess;
}

async function ownsService(serviceId: string, organiserId: string, role: string) {
  if (role === "admin") return true;
  const sql = db();
  const rows = await sql`SELECT organiser_id FROM appointment_types WHERE id=${serviceId}`;
  if (!rows.length) throw new Error("Service not found");
  if (rows[0].organiser_id !== organiserId) throw new Error("Not allowed");
  return true;
}

export const listMyServices = createServerFn({ method: "GET" }).handler(async () => {
  const sess = await requireOrganiser();
  const services = sess.role === "admin"
    ? await dbListAppointmentTypes()
    : await dbListAppointmentTypes({ organiserId: sess.sub });
  return { services };
});

export const getMyService = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.id, sess.sub, sess.role);
    const service = await dbFindAppt(data.id);
    if (!service) throw new Error("Service not found");
    return { service };
  });

const serviceInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).default(""),
  category: z.string().max(60).default("General"),
  organiserLabel: z.string().max(120).default(""),
  durationMins: z.number().int().min(5).max(480),
  currency: z.string().min(1).max(8).default("INR"),
  manageCapacity: z.boolean().default(false),
  maxCapacity: z.number().int().min(1).max(500).default(1),
  advancePayment: z.boolean().default(false),
  paymentAmount: z.number().int().min(0).max(10_000_000).default(0),
  manualConfirm: z.boolean().default(false),
  workingStart: z.string().regex(/^\d{2}:\d{2}$/),
  workingEnd: z.string().regex(/^\d{2}:\d{2}$/),
  minLeadMins: z.number().int().min(0).max(60 * 24 * 30).default(60),
  maxAdvanceDays: z.number().int().min(1).max(365).default(60),
  bufferMins: z.number().int().min(0).max(240).default(0),
  isPublished: z.boolean().default(true),
  kind: z.enum(["user", "resource"]).default("user"),
  assignmentMode: z.enum(["manual", "auto"]).default("manual"),
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "service";
}

export const createService = createServerFn({ method: "POST" })
  .inputValidator((d) => serviceInputSchema.parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    const sql = db();
    const id = slugify(data.title) + "-" + crypto.randomBytes(3).toString("hex");
    const orgLabel = data.organiserLabel || sess.name;
    await sql`
      INSERT INTO appointment_types
        (id, organiser_id, title, description, category, organiser_label,
         duration_mins, currency, manage_capacity, max_capacity,
         advance_payment, payment_amount, manual_confirm,
         working_start, working_end, min_lead_mins, max_advance_days, buffer_mins, is_published,
         kind, assignment_mode)
      VALUES
        (${id}, ${sess.sub}, ${data.title}, ${data.description}, ${data.category}, ${orgLabel},
         ${data.durationMins}, ${data.currency}, ${data.manageCapacity}, ${data.maxCapacity},
         ${data.advancePayment}, ${data.paymentAmount}, ${data.manualConfirm},
         ${data.workingStart}, ${data.workingEnd}, ${data.minLeadMins}, ${data.maxAdvanceDays}, ${data.bufferMins}, ${data.isPublished},
         ${data.kind}, ${data.assignmentMode})
    `;
    const initials = sess.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "OR";
    await sql`
      INSERT INTO providers (id, appointment_type_id, name, title, initials, sort_order)
      VALUES (${"prv_" + crypto.randomUUID()}, ${id}, ${sess.name}, 'Provider', ${initials}, 0)
    `;
    return { id };
  });

export const updateService = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).extend(serviceInputSchema.shape).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.id, sess.sub, sess.role);
    const sql = db();
    await sql`
      UPDATE appointment_types SET
        title=${data.title}, description=${data.description}, category=${data.category},
        organiser_label=${data.organiserLabel || sess.name},
        duration_mins=${data.durationMins}, currency=${data.currency},
        manage_capacity=${data.manageCapacity}, max_capacity=${data.maxCapacity},
        advance_payment=${data.advancePayment}, payment_amount=${data.paymentAmount},
        manual_confirm=${data.manualConfirm},
        working_start=${data.workingStart}, working_end=${data.workingEnd},
        min_lead_mins=${data.minLeadMins}, max_advance_days=${data.maxAdvanceDays},
        buffer_mins=${data.bufferMins}, is_published=${data.isPublished},
        kind=${data.kind}, assignment_mode=${data.assignmentMode}
      WHERE id=${data.id}
    `;
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.id, sess.sub, sess.role);
    const sql = db();
    await sql`DELETE FROM appointment_types WHERE id=${data.id}`;
    return { ok: true };
  });

export const togglePublish = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), published: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.id, sess.sub, sess.role);
    const sql = db();
    await sql`UPDATE appointment_types SET is_published=${data.published} WHERE id=${data.id}`;
    return { ok: true };
  });

// Generate / rotate / clear share token for unpublished previews.
export const generateShareToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), enable: z.boolean().default(true) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.id, sess.sub, sess.role);
    const sql = db();
    if (!data.enable) {
      await sql`UPDATE appointment_types SET share_token=NULL WHERE id=${data.id}`;
      return { token: null as string | null };
    }
    const token = crypto.randomBytes(16).toString("hex");
    await sql`UPDATE appointment_types SET share_token=${token} WHERE id=${data.id}`;
    return { token };
  });

// ---- Providers ----
const providerInput = z.object({
  serviceId: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  title: z.string().max(120).default(""),
  initials: z.string().max(4).default(""),
});

export const addProvider = createServerFn({ method: "POST" })
  .inputValidator((d) => providerInput.parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    const id = "prv_" + crypto.randomUUID();
    const inits = (data.initials || data.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")).toUpperCase();
    const cnt = await sql`SELECT COUNT(*)::int AS c FROM providers WHERE appointment_type_id=${data.serviceId}`;
    await sql`
      INSERT INTO providers (id, appointment_type_id, name, title, initials, sort_order)
      VALUES (${id}, ${data.serviceId}, ${data.name}, ${data.title}, ${inits}, ${cnt[0].c})
    `;
    return { id };
  });

export const updateProvider = createServerFn({ method: "POST" })
  .inputValidator((d) => providerInput.extend({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    const inits = (data.initials || data.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")).toUpperCase();
    await sql`UPDATE providers SET name=${data.name}, title=${data.title}, initials=${inits} WHERE id=${data.id} AND appointment_type_id=${data.serviceId}`;
    return { ok: true };
  });

export const removeProvider = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), serviceId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    await sql`DELETE FROM providers WHERE id=${data.id} AND appointment_type_id=${data.serviceId}`;
    return { ok: true };
  });

// ---- Schedules ----
const windowSchema = z.object({ start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) });
const weeklySlotsSchema = z.record(
  z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]),
  z.array(windowSchema).max(8),
);
const flexibleSlotsSchema = z.record(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.array(windowSchema).max(8),
);

export const setProviderSchedule = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      serviceId: z.string().min(1).max(80),
      providerId: z.string().min(1).max(80),
      scheduleType: z.enum(["weekly", "flexible"]),
      slots: z.union([weeklySlotsSchema, flexibleSlotsSchema]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    const id = "sch_" + crypto.randomUUID();
    await sql`
      INSERT INTO schedules (id, appointment_type_id, provider_id, schedule_type, slots_json, updated_at)
      VALUES (${id}, ${data.serviceId}, ${data.providerId}, ${data.scheduleType}, ${sql.json(data.slots)}, NOW())
      ON CONFLICT (provider_id) DO UPDATE
        SET schedule_type=EXCLUDED.schedule_type, slots_json=EXCLUDED.slots_json, updated_at=NOW()
    `;
    return { ok: true };
  });

export const clearProviderSchedule = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ serviceId: z.string().min(1).max(80), providerId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    await sql`DELETE FROM schedules WHERE provider_id=${data.providerId} AND appointment_type_id=${data.serviceId}`;
    return { ok: true };
  });

// ---- Reassign booking ----
export const reassignBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ bookingId: z.string().min(1).max(80), providerId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    const sql = db();
    const rows = await sql`SELECT b.*, t.organiser_id FROM bookings b JOIN appointment_types t ON t.id=b.appointment_type_id WHERE b.id=${data.bookingId}`;
    if (!rows.length) throw new Error("Booking not found");
    const b = rows[0];
    if (sess.role !== "admin" && b.organiser_id !== sess.sub) throw new Error("Not allowed");
    await sql`UPDATE bookings SET provider_id=${data.providerId} WHERE id=${data.bookingId}`;
    return { ok: true };
  });

// ---- Questions ----
const questionInput = z.object({
  serviceId: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["text", "textarea", "select"]).default("text"),
  options: z.array(z.string().max(80)).max(20).default([]),
  required: z.boolean().default(false),
});

export const addQuestion = createServerFn({ method: "POST" })
  .inputValidator((d) => questionInput.parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    const id = "q_" + crypto.randomUUID();
    const cnt = await sql`SELECT COUNT(*)::int AS c FROM questions WHERE appointment_type_id=${data.serviceId}`;
    await sql`
      INSERT INTO questions (id, appointment_type_id, label, field_type, options_json, required, sort_order)
      VALUES (${id}, ${data.serviceId}, ${data.label}, ${data.type}, ${sql.json(data.options)}, ${data.required}, ${cnt[0].c})
    `;
    return { id };
  });

export const updateQuestion = createServerFn({ method: "POST" })
  .inputValidator((d) => questionInput.extend({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    await sql`
      UPDATE questions
      SET label=${data.label}, field_type=${data.type}, options_json=${sql.json(data.options)}, required=${data.required}
      WHERE id=${data.id} AND appointment_type_id=${data.serviceId}
    `;
    return { ok: true };
  });

export const removeQuestion = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80), serviceId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sess = await requireOrganiser();
    await ownsService(data.serviceId, sess.sub, sess.role);
    const sql = db();
    await sql`DELETE FROM questions WHERE id=${data.id} AND appointment_type_id=${data.serviceId}`;
    return { ok: true };
  });

// ---- Utilisation report (per-provider, last 14 days) ----
export const utilisationReport = createServerFn({ method: "GET" }).handler(async () => {
  const sess = await requireOrganiser();
  await ensureSchema();
  const sql = db();
  const services = sess.role === "admin"
    ? await dbListAppointmentTypes()
    : await dbListAppointmentTypes({ organiserId: sess.sub });
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const out: { providerId: string; providerName: string; serviceTitle: string; bookedMinutes: number; availableMinutes: number; rate: number }[] = [];
  for (const s of services) {
    const bookings = await sql`
      SELECT provider_id, COUNT(*)::int AS c, COALESCE(SUM(capacity_count),0)::int AS people
      FROM bookings
      WHERE appointment_type_id=${s.id} AND status<>'cancelled' AND slot_start >= ${since}
      GROUP BY provider_id
    `;
    for (const p of s.providers) {
      // estimate available minutes = sum of windows over the next 14 days
      let avail = 0;
      for (let d = 0; d < 14; d++) {
        const day = new Date(Date.now() + d * 86400000);
        const sched = s.schedules.find((x) => x.providerId === p.id);
        const fb = s.workingHours;
        const wins = sched
          ? (sched.scheduleType === "weekly"
              ? sched.slots[DAY_KEY[day.getDay()]] ?? []
              : sched.slots[day.toISOString().slice(0, 10)] ?? [])
          : [fb];
        for (const w of wins) {
          const [sh, sm] = w.start.split(":").map(Number);
          const [eh, em] = w.end.split(":").map(Number);
          avail += (eh * 60 + em) - (sh * 60 + sm);
        }
      }
      const row = bookings.find((b: any) => b.provider_id === p.id);
      const booked = (Number(row?.c ?? 0)) * s.durationMins;
      out.push({
        providerId: p.id,
        providerName: p.name,
        serviceTitle: s.title,
        bookedMinutes: booked,
        availableMinutes: avail,
        rate: avail > 0 ? Math.min(1, booked / avail) : 0,
      });
    }
  }
  return { rows: out };
});

const DAY_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
