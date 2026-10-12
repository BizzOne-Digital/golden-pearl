type Props = {
  orderNumber: string;
  onClose: () => void;
};

export function OrderSuccessModal({ orderNumber, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700"
          aria-hidden
        >
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-bold text-stone-900">Thank you!</h2>
        <p className="mt-2 text-stone-600">
          Your payment was successful. We&apos;re preparing your order.
        </p>
        {orderNumber && (
          <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800">
            Order <span className="text-[#a20302]">{orderNumber}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-stone-500">
          A confirmation was sent to your email.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#a20302] py-3 font-medium text-white"
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}
