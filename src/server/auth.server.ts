// Server-only auth helpers: JWT, password hashing, session cookies.
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE = "apt_session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export type SessionPayload = { sub: string; email: string; name: string; role: string };

export async function issueSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "customer"),
    };
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  deleteCookie(COOKIE, { path: "/" });
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
