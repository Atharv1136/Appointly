import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, ensureSchema } from "./db.server";
import {
  hashPassword,
  verifyPassword,
  issueSession,
  readSession,
  clearSessionCookie,
  generateOtp,
  type SessionPayload,
} from "./auth.server";
import { sendEmail, otpEmailHtml, passwordResetHtml } from "./email.server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export type PublicUser = { id: string; name: string; email: string; role: string; phone?: string };

export const signupStart = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(120),
        email: z.string().email().max(200),
        password: z.string().min(8).max(200),
        role: z.enum(["customer", "organiser"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();
    const existing = await sql`SELECT id, verified FROM users WHERE email = ${email}`;
    if (existing.length && existing[0].verified) {
      throw new Error("An account with this email already exists. Please log in.");
    }
    const passwordHash = await hashPassword(data.password);
    const id = "u_" + crypto.randomUUID();
    if (existing.length) {
      await sql`UPDATE users SET name=${data.name}, password_hash=${passwordHash}, role=${data.role} WHERE email=${email}`;
    } else {
      await sql`INSERT INTO users (id, name, email, password_hash, role) VALUES (${id}, ${data.name}, ${email}, ${passwordHash}, ${data.role})`;
    }
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 8);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await sql`
      INSERT INTO otps (email, code_hash, purpose, expires_at, attempts)
      VALUES (${email}, ${codeHash}, 'signup', ${expires}, 0)
      ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, purpose=EXCLUDED.purpose, expires_at=EXCLUDED.expires_at, attempts=0
    `;
    await sendEmail({ to: email, subject: "Your CalenSync verification code", html: otpEmailHtml(code), purpose: "auth" });
    return { ok: true, email };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();
    const rows = await sql`SELECT * FROM otps WHERE email=${email}`;
    if (!rows.length) throw new Error("No code found. Please request a new one.");
    const otp = rows[0];
    if (otp.attempts >= 5) throw new Error("Too many attempts. Request a new code.");
    if (new Date(otp.expires_at).getTime() < Date.now()) throw new Error("Code expired. Request a new one.");
    const ok = await bcrypt.compare(data.code, otp.code_hash);
    if (!ok) {
      await sql`UPDATE otps SET attempts=attempts+1 WHERE email=${email}`;
      throw new Error("Invalid code");
    }
    await sql`UPDATE users SET verified=TRUE WHERE email=${email}`;
    await sql`DELETE FROM otps WHERE email=${email}`;
    const users = await sql`SELECT id, name, email, role, phone, COALESCE(is_active, TRUE) AS is_active FROM users WHERE email=${email}`;
    const u = users[0];
    if (u.is_active === false) throw new Error("Your account has been deactivated. Contact support.");
    const sess: SessionPayload = { sub: u.id, email: u.email, name: u.name, role: u.role };
    await issueSession(sess);
    return { user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone ?? undefined } as PublicUser };
  });

export const resendOtp = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 8);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await sql`
      INSERT INTO otps (email, code_hash, purpose, expires_at, attempts)
      VALUES (${email}, ${codeHash}, 'signup', ${expires}, 0)
      ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0
    `;
    await sendEmail({ to: email, subject: "Your CalenSync verification code", html: otpEmailHtml(code), purpose: "auth" });
    return { ok: true };
  });

const ADMIN_EMAIL = "atharvbhosaletemp00@gmail.com";
const ADMIN_PASSWORD = "Atharv@1136";
const ADMIN_ID = "u_admin_root";

async function ensureAdminUser() {
  const sql = db();
  const rows = await sql`SELECT id FROM users WHERE email=${ADMIN_EMAIL}`;
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  if (!rows.length) {
    await sql`INSERT INTO users (id, name, email, password_hash, role, verified)
              VALUES (${ADMIN_ID}, 'Platform Admin', ${ADMIN_EMAIL}, ${passwordHash}, 'admin', TRUE)`;
  } else {
    await sql`UPDATE users SET role='admin', verified=TRUE, password_hash=${passwordHash}, is_active=TRUE WHERE email=${ADMIN_EMAIL}`;
  }
}

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();

    if (email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
      await ensureAdminUser();
      const rows = await sql`SELECT id, name, email, role, phone FROM users WHERE email=${ADMIN_EMAIL}`;
      const u = rows[0];
      await issueSession({ sub: u.id, email: u.email, name: u.name, role: "admin" });
      return {
        needsVerification: false as const,
        user: { id: u.id, name: u.name, email: u.email, role: "admin", phone: u.phone ?? undefined } as PublicUser,
      };
    }

    const rows = await sql`SELECT id, name, email, role, phone, password_hash, verified, COALESCE(is_active, TRUE) AS is_active FROM users WHERE email=${email}`;
    if (!rows.length) throw new Error("Invalid email or password");
    if (rows[0].is_active === false) throw new Error("Your account has been deactivated. Contact support.");
    const u = rows[0];
    const ok = await verifyPassword(data.password, u.password_hash);
    if (!ok) throw new Error("Invalid email or password");
    if (!u.verified) {
      const code = generateOtp();
      const codeHash = await bcrypt.hash(code, 8);
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await sql`
        INSERT INTO otps (email, code_hash, purpose, expires_at, attempts)
        VALUES (${email}, ${codeHash}, 'signup', ${expires}, 0)
        ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0
      `;
      await sendEmail({ to: email, subject: "Your CalenSync verification code", html: otpEmailHtml(code), purpose: "auth" });
      return { needsVerification: true as const, email };
    }
    await issueSession({ sub: u.id, email: u.email, name: u.name, role: u.role });
    return {
      needsVerification: false as const,
      user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone ?? undefined } as PublicUser,
    };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { ok: true };
});

export const meFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  const sess = await readSession();
  if (!sess) return { user: null };
  const sql = db();
  const rows = await sql`SELECT id, name, email, role, phone, COALESCE(is_active, TRUE) AS is_active FROM users WHERE id=${sess.sub}`;
  if (!rows.length) return { user: null };
  const u = rows[0];
  // Enforce deactivation: kick the session if the account is no longer active.
  if (u.is_active === false) {
    clearSessionCookie();
    return { user: null };
  }
  return { user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone ?? undefined } as PublicUser };
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().min(1).max(120), phone: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sess = await readSession();
    if (!sess) throw new Error("Not authenticated");
    const sql = db();
    await sql`UPDATE users SET name=${data.name}, phone=${data.phone ?? null} WHERE id=${sess.sub}`;
    await issueSession({ ...sess, name: data.name });
    const rows = await sql`SELECT id, name, email, role, phone FROM users WHERE id=${sess.sub}`;
    const u = rows[0];
    return { user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone ?? undefined } as PublicUser };
  });

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), origin: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();
    const rows = await sql`SELECT id, name, COALESCE(is_active, TRUE) AS is_active FROM users WHERE email=${email}`;
    // Always return ok to prevent user enumeration.
    if (!rows.length || rows[0].is_active === false) return { ok: true };
    const u = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    await sql`
      INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
      VALUES (${tokenHash}, ${u.id}, ${expires})
    `;
    const origin = data.origin || process.env.PUBLIC_APP_URL || "https://calensync.app";
    const resetUrl = `${origin.replace(/\/$/, "")}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your CalenSync password",
      html: passwordResetHtml({ name: u.name, resetUrl }),
      purpose: "auth",
    });
    return { ok: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: z.string().min(32).max(200), password: z.string().min(8).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const tokenHash = sha256(data.token);
    const rows = await sql`SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash=${tokenHash}`;
    if (!rows.length) throw new Error("Invalid or expired link");
    const t = rows[0];
    if (t.used_at) throw new Error("This link has already been used");
    if (new Date(t.expires_at).getTime() < Date.now()) throw new Error("This link has expired");
    const newHash = await hashPassword(data.password);
    await sql`UPDATE users SET password_hash=${newHash} WHERE id=${t.user_id}`;
    await sql`UPDATE password_reset_tokens SET used_at=NOW() WHERE token_hash=${tokenHash}`;
    return { ok: true };
  });
