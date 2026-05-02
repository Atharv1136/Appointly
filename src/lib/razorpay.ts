// Razorpay client: opens Checkout using a server-created order.

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

export type RzpCheckoutOpts = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};

export type RzpResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function openRazorpayCheckout(opts: RzpCheckoutOpts): Promise<RzpResult> {
  const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  if (!ok || !window.Razorpay) throw new Error("Failed to load Razorpay");
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amountPaise,
      currency: opts.currency,
      name: opts.name,
      description: opts.description,
      prefill: {
        name: opts.customerName,
        email: opts.customerEmail,
        contact: opts.customerPhone || "",
      },
      theme: { color: "#1D4ED8" },
      handler: (response: RzpResult) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}
