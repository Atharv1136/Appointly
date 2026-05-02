// Server-only Neon/Postgres client + schema bootstrap.
// IMPORTANT: Cloudflare Workers forbid sharing I/O objects (sockets, streams)
// across requests. We create a fresh postgres client per call instead of caching.
import postgres from "postgres";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return postgres(url, {
    ssl: "require",
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false, // Neon pooler compatibility
  });
}

let _schemaReady = false;


export async function ensureSchema() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
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
    // Add is_active for older deployments
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
    // Index for fast slot lookups
    await sql`
      CREATE INDEX IF NOT EXISTS bookings_slot_idx
      ON bookings (appointment_type_id, provider_id, slot_start)
      WHERE status <> 'cancelled'
    `;
  })();
  return _initPromise;
}
