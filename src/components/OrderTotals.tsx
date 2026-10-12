import { formatCurrency } from "@/lib/format";

type Props = {
  subtotal: number;
  tax: number;
  total: number;
  className?: string;
};

export function OrderTotals({ subtotal, tax, total, className = "" }: Props) {
  return (
    <dl className={`space-y-1 text-sm ${className}`}>
      <div className="flex justify-between text-stone-600">
        <dt>Subtotal</dt>
        <dd>{formatCurrency(subtotal)}</dd>
      </div>
      <div className="flex justify-between text-stone-600">
        <dt>Tax (13%)</dt>
        <dd>{formatCurrency(tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold text-stone-900">
        <dt>Total</dt>
        <dd>{formatCurrency(total)}</dd>
      </div>
    </dl>
  );
}
