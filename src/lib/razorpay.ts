// Razorpay test-mode integration (client-only).
// In production, the order should be created server-side and the signature verified.
// For test mode without a backend, we open Checkout directly with the test key.

const RAZORPAY_KEY_STORAGE = "apt_razorpay_test_key";

export function getRazorpayKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RAZORPAY_KEY_STORAGE);
}
export function setRazorpayKey(key: string) {
  localStorage.setItem(RAZORPAY_KEY_STORAGE, key);
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type RzpOptions = {
  amountInINR: number;
  name: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};

export async function openRazorpayCheckout(opts: RzpOptions): Promise<{ paymentId: string }> {
  const key = getRazorpayKey();
  if (!key) throw new Error("Razorpay test key not set");
  const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  if (!ok || !window.Razorpay) throw new Error("Failed to load Razorpay");

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key,
      amount: Math.round(opts.amountInINR * 100), // paise
      currency: "INR",
      name: opts.name,
      description: opts.description,
      prefill: {
        name: opts.customerName,
        email: opts.customerEmail,
        contact: opts.customerPhone || "",
      },
      theme: { color: "#1D4ED8" },
      handler: (response: { razorpay_payment_id: string }) => {
        resolve({ paymentId: response.razorpay_payment_id });
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    rzp.open();
  });
}
