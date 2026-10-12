import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markOrderPaidFromCheckoutSession } from "@/lib/stripe-order";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = (await req.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(body.sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
  }

  const order = await markOrderPaidFromCheckoutSession(session);
  if (!order) {
    return NextResponse.json(
      { error: "Payment not completed or order not found" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    status: order.status,
  });
}
