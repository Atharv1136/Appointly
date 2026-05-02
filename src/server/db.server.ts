// Server-only Neon/Postgres client + schema bootstrap.
// Cloudflare Workers forbid sharing I/O objects across requests.
import postgres from "postgres";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return postgres(url, {
    ssl: "require",
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
  });
}

let _schemaReady = false;

export async function ensureSchema() {
  if (_schemaReady) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      phone         TEXT,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'customer',
      verified      BOOLEAN NOT NULL DEFAULT FALSE,
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`
    CREATE TABLE IF NOT EXISTS otps (
      email      TEXT PRIMARY KEY,
      code_hash  TEXT NOT NULL,
      purpose    TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts   INT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id                   TEXT PRIMARY KEY,
      appointment_type_id  TEXT NOT NULL,
      provider_id          TEXT NOT NULL,
      customer_id          TEXT NOT NULL,
      customer_name        TEXT NOT NULL,
      customer_email       TEXT NOT NULL,
      slot_start           TIMESTAMPTZ NOT NULL,
      capacity_count       INT NOT NULL DEFAULT 1,
      status               TEXT NOT NULL DEFAULT 'confirmed',
      payment_status       TEXT NOT NULL DEFAULT 'unpaid',
      payment_id           TEXT,
      razorpay_order_id    TEXT,
      answers              JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS bookings_slot_idx
    ON bookings (appointment_type_id, provider_id, slot_start)
    WHERE status <> 'cancelled'
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS appointment_types (
      id                TEXT PRIMARY KEY,
      organiser_id      TEXT NOT NULL,
      title             TEXT NOT NULL,
      description       TEXT NOT NULL DEFAULT '',
      category          TEXT NOT NULL DEFAULT 'General',
      organiser_label   TEXT NOT NULL DEFAULT '',
      duration_mins     INT  NOT NULL DEFAULT 30,
      currency          TEXT NOT NULL DEFAULT 'INR',
      manage_capacity   BOOLEAN NOT NULL DEFAULT FALSE,
      max_capacity      INT  NOT NULL DEFAULT 1,
      advance_payment   BOOLEAN NOT NULL DEFAULT FALSE,
      payment_amount    INT  NOT NULL DEFAULT 0,
      manual_confirm    BOOLEAN NOT NULL DEFAULT FALSE,
      working_start     TEXT NOT NULL DEFAULT '09:00',
      working_end       TEXT NOT NULL DEFAULT '17:00',
      min_lead_mins     INT  NOT NULL DEFAULT 60,
      max_advance_days  INT  NOT NULL DEFAULT 60,
      buffer_mins       INT  NOT NULL DEFAULT 0,
      is_published      BOOLEAN NOT NULL DEFAULT TRUE,
      share_token       TEXT,
      kind              TEXT NOT NULL DEFAULT 'user',
      assignment_mode   TEXT NOT NULL DEFAULT 'manual',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE appointment_types ADD COLUMN IF NOT EXISTS share_token TEXT`;
  await sql`ALTER TABLE appointment_types ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE appointment_types ADD COLUMN IF NOT EXISTS assignment_mode TEXT NOT NULL DEFAULT 'manual'`;
  await sql`CREATE INDEX IF NOT EXISTS appt_types_org_idx ON appointment_types (organiser_id)`;
  await sql`CREATE INDEX IF NOT EXISTS appt_types_pub_idx ON appointment_types (is_published)`;
  await sql`CREATE INDEX IF NOT EXISTS appt_types_share_idx ON appointment_types (share_token)`;

  await sql`
    CREATE TABLE IF NOT EXISTS providers (
      id                   TEXT PRIMARY KEY,
      appointment_type_id  TEXT NOT NULL REFERENCES appointment_types(id) ON DELETE CASCADE,
      name                 TEXT NOT NULL,
      title                TEXT NOT NULL DEFAULT '',
      initials             TEXT NOT NULL DEFAULT '',
      sort_order           INT  NOT NULL DEFAULT 0,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS providers_appt_idx ON providers (appointment_type_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id                   TEXT PRIMARY KEY,
      appointment_type_id  TEXT NOT NULL REFERENCES appointment_types(id) ON DELETE CASCADE,
      label                TEXT NOT NULL,
      field_type           TEXT NOT NULL DEFAULT 'text',
      options_json         JSONB NOT NULL DEFAULT '[]'::jsonb,
      required             BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order           INT  NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS questions_appt_idx ON questions (appointment_type_id)`;

  // Per-provider weekly/flexible schedules
  await sql`
    CREATE TABLE IF NOT EXISTS schedules (
      id                   TEXT PRIMARY KEY,
      appointment_type_id  TEXT NOT NULL REFERENCES appointment_types(id) ON DELETE CASCADE,
      provider_id          TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      schedule_type        TEXT NOT NULL DEFAULT 'weekly',
      slots_json           JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS schedules_appt_idx ON schedules (appointment_type_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash  TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Seeding disabled — organisers create their own services from the dashboard.

  _schemaReady = true;
}

export type ScheduleRow = {
  providerId: string;
  scheduleType: "weekly" | "flexible";
  slots: Record<string, { start: string; end: string }[]>;
};

export type DbAppointmentType = {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  organiser: string;
  organiserId: string;
  category: string;
  providers: { id: string; name: string; title: string; initials: string }[];
  manageCapacity: boolean;
  maxCapacity: number;
  advancePayment: boolean;
  paymentAmount: number;
  currency: string;
  manualConfirm: boolean;
  questions: { id: string; label: string; type: "text" | "textarea" | "select"; options?: string[]; required: boolean }[];
  workingHours: { start: string; end: string };
  isPublished: boolean;
  minLeadMins: number;
  maxAdvanceDays: number;
  bufferMins: number;
  shareToken?: string;
  kind: "user" | "resource";
  assignmentMode: "manual" | "auto";
  schedules: ScheduleRow[];
};

function rowToAppt(row: any, providers: any[], questions: any[], schedules: any[]): DbAppointmentType {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    durationMins: Number(row.duration_mins),
    organiser: row.organiser_label ?? "",
    organiserId: row.organiser_id,
    category: row.category ?? "General",
    providers: providers.map((p) => ({ id: p.id, name: p.name, title: p.title ?? "", initials: p.initials ?? "" })),
    manageCapacity: !!row.manage_capacity,
    maxCapacity: Number(row.max_capacity),
    advancePayment: !!row.advance_payment,
    paymentAmount: Number(row.payment_amount),
    currency: row.currency,
    manualConfirm: !!row.manual_confirm,
    questions: questions.map((q) => ({
      id: q.id,
      label: q.label,
      type: q.field_type as "text" | "textarea" | "select",
      options: Array.isArray(q.options_json) ? q.options_json : [],
      required: !!q.required,
    })),
    workingHours: { start: row.working_start, end: row.working_end },
    isPublished: !!row.is_published,
    minLeadMins: Number(row.min_lead_mins),
    maxAdvanceDays: Number(row.max_advance_days),
    bufferMins: Number(row.buffer_mins),
    shareToken: row.share_token ?? undefined,
    kind: (row.kind ?? "user") as "user" | "resource",
    assignmentMode: (row.assignment_mode ?? "manual") as "manual" | "auto",
    schedules: schedules.map((s) => ({
      providerId: s.provider_id,
      scheduleType: s.schedule_type as "weekly" | "flexible",
      slots: (s.slots_json ?? {}) as Record<string, { start: string; end: string }[]>,
    })),
  };
}

export async function dbListAppointmentTypes(opts: { organiserId?: string; publishedOnly?: boolean } = {}): Promise<DbAppointmentType[]> {
  await ensureSchema();
  const sql = db();
  const rows = opts.organiserId
    ? await sql`SELECT * FROM appointment_types WHERE organiser_id=${opts.organiserId} ORDER BY created_at DESC`
    : opts.publishedOnly
    ? await sql`SELECT * FROM appointment_types WHERE is_published=TRUE ORDER BY created_at DESC`
    : await sql`SELECT * FROM appointment_types ORDER BY created_at DESC`;
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const provs = await sql`SELECT * FROM providers WHERE appointment_type_id IN ${sql(ids)} ORDER BY sort_order`;
  const qs = await sql`SELECT * FROM questions WHERE appointment_type_id IN ${sql(ids)} ORDER BY sort_order`;
  const scs = await sql`SELECT * FROM schedules WHERE appointment_type_id IN ${sql(ids)}`;
  return rows.map((r) =>
    rowToAppt(
      r,
      provs.filter((p) => p.appointment_type_id === r.id),
      qs.filter((q) => q.appointment_type_id === r.id),
      scs.filter((s) => s.appointment_type_id === r.id),
    ),
  );
}

export async function dbFindAppt(id: string): Promise<DbAppointmentType | null> {
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT * FROM appointment_types WHERE id=${id}`;
  if (!rows.length) return null;
  const provs = await sql`SELECT * FROM providers WHERE appointment_type_id=${id} ORDER BY sort_order`;
  const qs = await sql`SELECT * FROM questions WHERE appointment_type_id=${id} ORDER BY sort_order`;
  const scs = await sql`SELECT * FROM schedules WHERE appointment_type_id=${id}`;
  return rowToAppt(rows[0], provs, qs, scs);
}

export async function dbFindApptByShareToken(token: string): Promise<DbAppointmentType | null> {
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT id FROM appointment_types WHERE share_token=${token}`;
  if (!rows.length) return null;
  return dbFindAppt(rows[0].id);
}
