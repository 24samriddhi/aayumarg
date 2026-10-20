/**
 * Browser side of Razorpay Checkout. The secret key is NEVER here —
 * the server creates the order and later verifies the signature.
 */
export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance { open(): void }
interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string;
  name: string; description: string; theme: { color: string };
  handler: (r: CheckoutResult) => void;
  modal: { ondismiss: () => void };
}
declare global {
  interface Window { Razorpay?: new (o: RazorpayOptions) => RazorpayInstance }
}

/** The patient closed the payment window without paying. */
export class PaymentDismissedError extends Error {
  constructor() { super("Payment was not completed."); this.name = "PaymentDismissedError"; }
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Payments only work in the browser."));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not open the payment window. Check your internet connection and try again."));
    document.body.appendChild(s);
  });
}

export async function openCheckout(o: {
  keyId: string; orderId: string; amount: number; currency: string; description: string;
}): Promise<CheckoutResult> {
  await loadScript();
  if (!window.Razorpay) throw new Error("Could not open the payment window. Please try again.");
  const Razorpay = window.Razorpay;

  return new Promise<CheckoutResult>((resolve, reject) => {
    new Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
      name: "AayuMarg", description: o.description, theme: { color: "#7a1f2b" },
      handler: (r) => resolve(r),
      // Failed attempts are retried inside Razorpay's own window; we only react to "closed".
      modal: { ondismiss: () => reject(new PaymentDismissedError()) },
    }).open();
  });
}
