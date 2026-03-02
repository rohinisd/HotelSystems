declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  booking_id: number;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout(
  order: RazorpayOrder,
  onSuccess: (response: RazorpayResponse) => void,
  onFailure: (error: any) => void,
) {
  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    order_id: order.order_id,
    name: "TurfStack",
    description: `Court Booking #${order.booking_id}`,
    handler: (response: RazorpayResponse) => {
      onSuccess(response);
    },
    theme: {
      color: "#10b981",
    },
    modal: {
      ondismiss: () => {
        onFailure({ description: "Payment cancelled by user" });
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", onFailure);
  rzp.open();
}
