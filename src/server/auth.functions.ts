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
import { sendEmail, otpEmailHtml } from "./email.server";
import bcrypt from "bcryptjs";

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
    await sendEmail({ to: email, subject: "Your Appointly verification code", html: otpEmailHtml(code) });
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
    const users = await sql`SELECT id, name, email, role, phone FROM users WHERE email=${email}`;
    const u = users[0];
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
    await sendEmail({ to: email, subject: "Your Appointly verification code", html: otpEmailHtml(code) });
    return { ok: true };
  });

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await ensureSchema();
    const sql = db();
    const email = data.email.toLowerCase();
    const rows = await sql`SELECT id, name, email, role, phone, password_hash, verified FROM users WHERE email=${email}`;
    if (!rows.length) throw new Error("Invalid email or password");
    const u = rows[0];
    const ok = await verifyPassword(data.password, u.password_hash);
    if (!ok) throw new Error("Invalid email or password");
    if (!u.verified) {
      // Auto-resend OTP and signal frontend to verify
      const code = generateOtp();
      const codeHash = await bcrypt.hash(code, 8);
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await sql`
        INSERT INTO otps (email, code_hash, purpose, expires_at, attempts)
        VALUES (${email}, ${codeHash}, 'signup', ${expires}, 0)
        ON CONFLICT (email) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0
      `;
      await sendEmail({ to: email, subject: "Your Appointly verification code", html: otpEmailHtml(code) });
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
  const rows = await sql`SELECT id, name, email, role, phone FROM users WHERE id=${sess.sub}`;
  if (!rows.length) return { user: null };
  const u = rows[0];
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

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    // Stub: always return success to avoid user enumeration
    console.log("[password-reset] requested for", data.email);
    return { ok: true };
  });
