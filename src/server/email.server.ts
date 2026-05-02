// Server-only email sender via Lovable Emails, with Resend as a local fallback.
import { sendLovableEmail } from "@lovable.dev/email-js";

const RESEND_URL = "https://api.resend.com/emails";

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendEmail(opts: { to: string; subject: string; html: string; purpose?: "auth" | "transactional" }) {
  try {
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const from = "Appointly <no-reply@notify.atharvbhosale.site>";
    if (lovableApiKey) {
      return await sendLovableEmail(
        {
          idempotency_key: crypto.randomUUID(),
          to: opts.to,
          from,
          sender_domain: "notify.atharvbhosale.site",
          subject: opts.subject,
          html: opts.html,
          text: htmlToText(opts.html),
          purpose: "transactional",
          unsubscribe_token: crypto.randomUUID(),
        },
        { apiKey: lovableApiKey },
      );
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] LOVABLE_API_KEY/RESEND_API_KEY missing — skipping send", opts.subject);
      return { skipped: true };
    }
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] send failed", res.status, text);
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send threw", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}

function shell(title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1F2937">
    <h2 style="color:#1D4ED8;margin:0 0 12px">${title}</h2>
    ${body}
    <p style="color:#9CA3AF;font-size:12px;margin-top:32px">— Appointly</p>
  </div>`;
}

export function otpEmailHtml(code: string) {
  return shell("Verify your email", `
    <p>Use this code to verify your Appointly account:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#F1F5F9;padding:16px;text-align:center;border-radius:12px;margin:16px 0">${code}</div>
    <p style="color:#6B7280;font-size:14px">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
  `);
}

export function passwordResetHtml(args: { name: string; resetUrl: string }) {
  return shell("Reset your password", `
    <p>Hi ${args.name}, we received a request to reset your password.</p>
    <p><a href="${args.resetUrl}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
    <p style="color:#6B7280;font-size:14px">This link expires in 30 minutes. If you didn't request a reset, ignore this email.</p>
    <p style="color:#9CA3AF;font-size:12px;word-break:break-all">${args.resetUrl}</p>
  `);
}

type BookingEmailFields = {
  customerName: string;
  serviceTitle: string;
  organiser: string;
  providerName: string;
  whenLocal: string;
  durationMins: number;
  bookingId: string;
};

export function bookingConfirmationHtml(b: BookingEmailFields & { paid: boolean; amount?: number }) {
  return shell("Your appointment is confirmed 🎉", `
    <p>Hi ${b.customerName}, your booking is locked in.</p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
      <p style="margin:4px 0"><strong>Provider:</strong> ${b.providerName} (${b.organiser})</p>
      <p style="margin:4px 0"><strong>When:</strong> ${b.whenLocal} (${b.durationMins} min)</p>
      ${b.paid && b.amount ? `<p style="margin:4px 0"><strong>Paid:</strong> ₹${b.amount}</p>` : ""}
      <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
    </div>
    <p style="color:#6B7280;font-size:14px">Need to reschedule? Visit your appointments page on Appointly.</p>
  `);
}

export function bookingReservedHtml(b: BookingEmailFields) {
  return shell("Appointment reserved", `
    <p>Hi ${b.customerName}, we've received your booking request. The organiser will confirm shortly.</p>
    <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
      <p style="margin:4px 0"><strong>Provider:</strong> ${b.providerName} (${b.organiser})</p>
      <p style="margin:4px 0"><strong>When:</strong> ${b.whenLocal} (${b.durationMins} min)</p>
      <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
    </div>
  `);
}

export function bookingRescheduledHtml(b: BookingEmailFields) {
  return shell("Appointment rescheduled", `
    <p>Hi ${b.customerName}, your appointment has been rescheduled.</p>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
      <p style="margin:4px 0"><strong>New time:</strong> ${b.whenLocal} (${b.durationMins} min)</p>
      <p style="margin:4px 0"><strong>Provider:</strong> ${b.providerName}</p>
      <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
    </div>
  `);
}

export function bookingCancelledHtml(b: BookingEmailFields) {
  return shell("Appointment cancelled", `
    <p>Hi ${b.customerName}, your appointment has been cancelled.</p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
      <p style="margin:4px 0"><strong>Was scheduled for:</strong> ${b.whenLocal}</p>
      <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
    </div>
  `);
}

export function organiserNewBookingHtml(b: BookingEmailFields & { customerEmail: string; needsApproval: boolean }) {
  return shell(b.needsApproval ? "New booking request" : "New booking", `
    <p>You have a ${b.needsApproval ? "new pending booking that needs your approval" : "new confirmed booking"}.</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
      <p style="margin:4px 0"><strong>Customer:</strong> ${b.customerName} (${b.customerEmail})</p>
      <p style="margin:4px 0"><strong>When:</strong> ${b.whenLocal} (${b.durationMins} min)</p>
      <p style="margin:4px 0"><strong>Provider:</strong> ${b.providerName}</p>
      <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
    </div>
  `);
}

export function organiserBookingCancelledHtml(b: BookingEmailFields & { customerEmail: string }) {
  return shell("Booking cancelled", `
    <p>${b.customerName} (${b.customerEmail}) cancelled their booking.</p>
    <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
    <p style="margin:4px 0"><strong>Was scheduled for:</strong> ${b.whenLocal}</p>
    <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
  `);
}
