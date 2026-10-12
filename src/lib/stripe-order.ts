import type Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function markOrderPaidFromCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return null;

  if (session.payment_status !== "paid") {
    return null;
  }

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) return null;

  if (order.status !== "paid") {
    order.status = "paid";
    order.paidAt = new Date();
    order.stripeSessionId = session.id;
    await order.save();
  }

  return order;
}

export function absoluteAssetUrl(origin: string, path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = origin.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
