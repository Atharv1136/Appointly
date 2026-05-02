// Server-only email sender via Resend HTTP API.
const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || "Appointly <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — skipping send", opts.subject);
    return { skipped: true };
  }
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[email] send failed", res.status, text);
    return { ok: false, error: text };
  }
  return { ok: true };
}

export function otpEmailHtml(code: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1F2937">
      <h2 style="color:#1D4ED8;margin:0 0 12px">Verify your email</h2>
      <p>Use this code to verify your Appointly account:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#F1F5F9;padding:16px;text-align:center;border-radius:12px;margin:16px 0">${code}</div>
      <p style="color:#6B7280;font-size:14px">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
    </div>
  `;
}

export function bookingConfirmationHtml(b: {
  customerName: string;
  serviceTitle: string;
  organiser: string;
  providerName: string;
  whenLocal: string;
  durationMins: number;
  paid: boolean;
  amount?: number;
  bookingId: string;
}) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1F2937">
      <h2 style="color:#1D4ED8;margin:0 0 8px">Your appointment is confirmed 🎉</h2>
      <p>Hi ${b.customerName}, your booking is locked in.</p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Service:</strong> ${b.serviceTitle}</p>
        <p style="margin:4px 0"><strong>Provider:</strong> ${b.providerName} (${b.organiser})</p>
        <p style="margin:4px 0"><strong>When:</strong> ${b.whenLocal} (${b.durationMins} min)</p>
        ${b.paid && b.amount ? `<p style="margin:4px 0"><strong>Paid:</strong> ₹${b.amount}</p>` : ""}
        <p style="margin:4px 0;color:#6B7280;font-size:12px">Booking ID: ${b.bookingId}</p>
      </div>
      <p style="color:#6B7280;font-size:14px">Need to reschedule? Visit your appointments page on Appointly.</p>
    </div>
  `;
}
