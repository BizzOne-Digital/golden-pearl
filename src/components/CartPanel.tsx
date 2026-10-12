"use client";

import { useCart } from "@/context/CartContext";
import { OrderTotals } from "@/components/OrderTotals";
import { formatCurrency } from "@/lib/format";
import { resolveMenuImage } from "@/lib/menu-image";

type Props = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export function CartPanel({ open, onClose, onCheckout }: Props) {
  const { lines, updateQty, removeLine, subtotal, tax, total, clear } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Close cart"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md min-w-0 flex-col bg-white shadow-2xl sm:max-w-md">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-stone-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex gap-3 border-b border-stone-100 pb-4"
                >
                  <img
                    src={resolveMenuImage(line.image)}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover bg-stone-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{line.name}</p>
                    <p className="text-sm text-stone-500">
                      {formatCurrency(line.price)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg border border-stone-200"
                        onClick={() => updateQty(line.key, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg border border-stone-200"
                        onClick={() => updateQty(line.key, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-xs text-red-600"
                        onClick={() => removeLine(line.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-stone-200 p-4">
          <OrderTotals subtotal={subtotal} tax={tax} total={total} className="mb-4" />
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={onCheckout}
            className="w-full rounded-xl bg-[#a20302] py-3 font-medium text-white disabled:opacity-40"
          >
            Checkout
          </button>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full py-2 text-sm text-stone-500"
            >
              Clear cart
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
