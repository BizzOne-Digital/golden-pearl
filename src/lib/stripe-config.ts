/** Shown on Stripe payments (Dashboard metadata) so you can filter by site. */
export const STRIPE_SITE_ID =
  process.env.STRIPE_SITE_ID?.trim() || "goldenpearl";

export function buildStripePaymentMetadata(input: {
  orderId: string;
  orderNumber: string;
  customerName: string;
}) {
  return {
    site: STRIPE_SITE_ID,
    source: "goldenpearl-online-order",
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
  };
}
