"use client";

import { FormEvent, useState } from "react";
import { useCart } from "@/context/CartContext";
import { OrderTotals } from "@/components/OrderTotals";

type Props = {
  open: boolean;
  onClose: () => void;
  onDemoPaid?: (orderNumber: string) => void;
};

export function CheckoutModal({ open, onClose, onDemoPaid }: Props) {
  const { lines, subtotal, tax, total, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");

  if (!open) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const selectedType =
      (form.get("orderType") as "pickup" | "delivery") || "pickup";
    const address = String(form.get("address") || "").trim();

    if (selectedType === "delivery" && !address) {
      setError("Please enter your delivery address.");
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      orderType: selectedType,
      address,
      notes: String(form.get("notes") || ""),
      items: lines.map((l) => ({
        productId: l.productId,
        externalId: l.externalId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        image: l.image,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.demoPayment && data.orderId) {
        const payRes = await fetch(`/api/orders/${data.orderId}/pay`, {
          method: "POST",
        });
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || "Payment failed");
        clear();
        onDemoPaid?.(payData.orderNumber);
        onClose();
        return;
      }

      clear();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/50"
        aria-label="Close checkout"
        onClick={onClose}
      />
      <div className="relative max-h-[92dvh] w-full max-w-lg min-w-0 overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
        <h2 className="text-xl font-semibold">Checkout</h2>
        <p className="mt-1 text-sm text-stone-500">
          Enter your details, then pay securely with Stripe.
        </p>

        <OrderTotals
          subtotal={subtotal}
          tax={tax}
          total={total}
          className="mt-4 rounded-xl bg-stone-50 p-4"
        />

        <form onSubmit={onSubmit} className="mt-6 w-full min-w-0 space-y-4">
          <label className="block w-full min-w-0 text-sm">
            <span className="font-medium">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Phone</span>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Order type</span>
            <select
              name="orderType"
              value={orderType}
              onChange={(e) =>
                setOrderType(e.target.value as "pickup" | "delivery")
              }
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="pickup">Pick up</option>
              <option value="delivery">Home delivery</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">
              Address {orderType === "delivery" ? "(required)" : "(optional)"}
            </span>
            <input
              name="address"
              required={orderType === "delivery"}
              autoComplete="street-address"
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Notes</span>
            <textarea
              name="notes"
              rows={2}
              className="mt-1 w-full max-w-full min-w-0 rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="w-full rounded-xl bg-[#a20302] py-3 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Please wait…" : "Pay now"}
          </button>
        </form>
      </div>
    </div>
  );
}
