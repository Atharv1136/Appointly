import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { dbFindAppt } from "./db.server";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function auth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys not configured");
  return { id, secret, basic: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") };
}

export const getRazorpayPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const id = process.env.RAZORPAY_KEY_ID;
  if (!id) throw new Error("Razorpay not configured");
  return { keyId: id };
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        appointmentTypeId: z.string().min(1).max(80),
        capacityCount: z.number().int().min(1).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const appt = await dbFindAppt(data.appointmentTypeId);
    if (!appt) throw new Error("Service not found");
    if (!appt.advancePayment) throw new Error("This service does not require payment");
    const subtotal = appt.paymentAmount * data.capacityCount;
    const total = Math.round(subtotal * 1.18); // includes 18% GST
    const a = auth();
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: a.basic },
      body: JSON.stringify({
        amount: total * 100, // paise
        currency: "INR",
        receipt: "rcpt_" + crypto.randomBytes(6).toString("hex"),
        notes: { appointmentTypeId: appt.id },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[razorpay] order failed", res.status, text);
      throw new Error("Could not initiate payment");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: a.id };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        razorpay_order_id: z.string().min(1).max(120),
        razorpay_payment_id: z.string().min(1).max(120),
        razorpay_signature: z.string().min(1).max(256),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const a = auth();
    const expected = crypto
      .createHmac("sha256", a.secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) {
      throw new Error("Payment signature verification failed");
    }
    return { verified: true as const };
  });
